import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type { GetDashboardStatsQuery, GetRecentMovementsQuery } from '../models/dashboard.dto';
import { catchAsync } from '../utils/catchAsync';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * 1. FUNGSI GET DASHBOARD STATS (STATISTIK REAL-TIME DASHBOARD)
 * Mengambil data statistik komprehensif untuk halaman utama dashboard:
 * - Overview (total produk, total stok, stok tipis, stok habis)
 * - Pergerakan barang (Inbound, Outbound, Net Movement berdasarkan periode)
 * - Top 5 produk dengan pergerakan terbanyak
 * - Distribusi produk dan stok per kategori
 */
export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  // Ambil query 'period' dari URL (pilihan: 'today', 'week', atau 'month'). Default-nya 'week'.
  const { period = 'week' } = req.query as unknown as GetDashboardStatsQuery;

  // 1. Tentukan tanggal filter berdasarkan periode waktu yang dipilih
  const now = new Date();
  let dateFilter: Date;

  switch (period) {
    case 'today':
      // Filter dari awal hari ini (jam 00:00)
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      // Filter 7 hari ke belakang dari sekarang
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      // Filter 30 hari ke belakang dari sekarang
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  // 2. Eksekusi 8 query database secara paralel (bersamaan) menggunakan Promise.all untuk kecepatan ekstra
  const [
    totalProducts,
    totalStockAgg,
    lowStockCount,
    outOfStockCount,
    inboundAgg,
    outboundAgg,
    topMovementsGroup,
    categoriesWithProducts,
  ] = await Promise.all([
    // [A] Overview: Total seluruh produk
    // (model Product tidak punya field isActive, jadi dihapus)
    prisma.product.count(),

    // [B] Overview: Total akumulasi seluruh stok produk
    prisma.product.aggregate({
      _sum: { stock: true },
    }),

    // [C] Overview: Jumlah produk dengan stok tipis (stok > 0 tapi <= minimumStock)
    // Perbandingan antar kolom tidak bisa lewat `where` biasa di Prisma,
    // jadi pakai raw query. Nama tabel "products" mengikuti @@map("products").
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::int as count FROM "products"
      WHERE stock > 0 AND stock <= "minimumStock"
    `.then((result) => Number(result[0]?.count ?? 0)),

    // [D] Overview: Jumlah produk yang stoknya habis (stok = 0)
    prisma.product.count({
      where: { stock: 0 },
    }),

    // [E] Movements: Total barang masuk pada periode waktu tersebut
    // (enum MovementType nilainya 'IN', bukan 'INBOUND')
    prisma.stockMovement.aggregate({
      _sum: { quantity: true },
      where: {
        type: 'IN',
        createdAt: { gte: dateFilter },
      },
    }),

    // [F] Movements: Total barang keluar pada periode waktu tersebut
    // (enum MovementType nilainya 'OUT', bukan 'OUTBOUND')
    prisma.stockMovement.aggregate({
      _sum: { quantity: true },
      where: {
        type: 'OUT',
        createdAt: { gte: dateFilter },
      },
    }),

    // [G] Top Products: Mengelompokkan (groupBy) transaksi berdasarkan productId,
    // lalu urutkan dari yang jumlah akumulasi pergerakannya terbanyak (Top 5).
    prisma.stockMovement.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { createdAt: { gte: dateFilter } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),

    // [H] Category Distribution: Ambil semua kategori beserta seluruh stok produk di dalamnya
    // (model Category tidak punya field isActive, jadi dihapus)
    prisma.category.findMany({
      select: {
        name: true,
        products: {
          select: { stock: true },
        },
      },
    }),
  ]);

  // 3. Kalkulasi data statistik pergerakan barang
  const totalInbound = inboundAgg._sum.quantity || 0;
  const totalOutbound = outboundAgg._sum.quantity || 0;
  const netMovement = totalInbound - totalOutbound; // Selisih barang masuk vs keluar

  // 4. Ambil informasi nama & SKU untuk 5 produk teratas (Top 5 Products)
  const topProductIds = topMovementsGroup.map((item) => item.productId);
  const productsDetail = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, sku: true },
  });

  // Gabungkan ID produk dari groupBy dengan detail nama & SKU yang baru di-query
  const topProducts = topMovementsGroup.map((groupItem) => {
    const productInfo = productsDetail.find((p) => p.id === groupItem.productId);
    return {
      id: groupItem.productId,
      name: productInfo?.name || 'Unknown',
      sku: productInfo?.sku || '-',
      totalMovement: groupItem._sum.quantity || 0,
    };
  });

  // 5. Format data distribusi per kategori (menghitung total jenis produk & total stok per kategori)
  const categoryDistribution = categoriesWithProducts.map((cat) => ({
    categoryName: cat.name,
    productCount: cat.products.length,
    totalStock: cat.products.reduce((acc, curr) => acc + curr.stock, 0),
  }));

  // Kirim respon akhir ke client
  res.status(200).json({
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: {
      overview: {
        totalProducts,
        totalStock: totalStockAgg._sum.stock || 0,
        lowStockCount,
        outOfStockCount,
      },
      movements: {
        totalInbound,
        totalOutbound,
        netMovement,
      },
      topProducts,
      categoryDistribution,
    },
  });
});

/**
 * 2. FUNGSI GET RECENT MOVEMENTS (RIWAYAT PERGERAKAN TERBARU)
 * Mengambil 10 (atau sesuai limit) transaksi pergerakan barang terbaru
 * lengkap dengan data pendukung (nama/SKU produk & nama user pelaksana).
 */
export const getRecentMovements = catchAsync(async (req: Request, res: Response) => {
  // Ambil parameter pagination dari URL query
  const { page = 1, limit = 10 } = req.query as unknown as GetRecentMovementsQuery;

  // Konversi input string URL ke tipe Number
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  // Jalankan query pengambilan data riwayat dan hitung total data secara paralel
  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' }, // Urutkan dari transaksi paling baru
      take: limitNum, // Jumlah data per halaman
      skip, // Data yang dilewati untuk pagination
      include: {
        product: { select: { id: true, name: true, sku: true } }, // Sertakan info produk
        user: { select: { id: true, name: true } }, // Sertakan info user pelaksana
      },
    }),

    // Hitung total seluruh riwayat pergerakan stok di database
    prisma.stockMovement.count(),
  ]);

  res.status(200).json({
    success: true,
    message: 'Recent movements retrieved successfully',
    data: movements,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum), // Kalkulasi total halaman
    },
  });
});
