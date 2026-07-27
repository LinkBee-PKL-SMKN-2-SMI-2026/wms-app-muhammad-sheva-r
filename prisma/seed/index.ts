import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

// Inisialisasi adapter PG untuk Prisma 7
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(' Starting seed database...');

  // 1. Clean existing data
  await prisma.stock_Movements.deleteMany();
  await prisma.activity_Logs.deleteMany();
  await prisma.products.deleteMany();
  await prisma.categories.deleteMany();
  await prisma.locations.deleteMany();
  await prisma.users.deleteMany();

  // 2. Hash password admin
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 3. Create Admin User
  const adminUser = await prisma.users.create({
    data: {
      name: 'Super Admin',
      email: 'admin@wms.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(' Admin user created:', adminUser.email);

  // 4. Create Categories
  const categoryElektronik = await prisma.categories.create({
    data: { name: 'Elektronik', description: 'Barang-barang elektronik dan periferal' },
  });
  const categoryFurniture = await prisma.categories.create({
    data: { name: 'Furniture', description: 'Perabotan kantor dan meja kursi' },
  });
  const categoryATK = await prisma.categories.create({
    data: { name: 'ATK', description: 'Alat tulis kantor dan kertas' },
  });

  console.log(' 3 Categories created');

  // 5. Create Locations
  const locationA1 = await prisma.locations.create({
    data: { name: 'Rak A1', code: 'RAK-A1' },
  });
  const locationA2 = await prisma.locations.create({
    data: { name: 'Rak A2', code: 'RAK-A2' },
  });
  const locationB1 = await prisma.locations.create({
    data: { name: 'Gudang B1', code: 'GDG-B1' },
  });

  console.log(' 3 Locations created');

  // 6. Create 5 Products with relations
  await prisma.products.createMany({
    data: [
      {
        name: 'Laptop Gaming ACER',
        sku: 'ELEK-001',
        description: 'Laptop spesifikasi tinggi untuk kantor',
        stock: 15,
        minimumStock: 5,
        categoryId: categoryElektronik.id,
        locationId: locationA1.id,
      },
      {
        name: 'Mouse Wireless Logitech',
        sku: 'ELEK-002',
        description: 'Mouse ergonomis tanpa kabel',
        stock: 50,
        minimumStock: 10,
        categoryId: categoryElektronik.id,
        locationId: locationA1.id,
      },
      {
        name: 'Meja Kerja Kayu',
        sku: 'FURN-001',
        description: 'Meja kayu ukuran 120x60 cm',
        stock: 8,
        minimumStock: 3,
        categoryId: categoryFurniture.id,
        locationId: locationB1.id,
      },
      {
        name: 'Kursi Kantor Ergonomis',
        sku: 'FURN-002',
        description: 'Kursi dengan penopang pinggang',
        stock: 12,
        minimumStock: 4,
        categoryId: categoryFurniture.id,
        locationId: locationB1.id,
      },
      {
        name: 'Kertas HVS A4 80gr',
        sku: 'ATK-001',
        description: 'Kertas HVS 1 rim isi 500 lembar',
        stock: 100,
        minimumStock: 20,
        categoryId: categoryATK.id,
        locationId: locationA2.id,
      },
    ],
  });

  console.log(' 5 Products created');
  console.log(' Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(' Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });