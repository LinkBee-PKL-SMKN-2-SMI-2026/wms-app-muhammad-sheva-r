import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
// 1. Tambahkan import untuk middleware autentikasi
import { authenticate } from '../middlewares/authenticate.middleware';
import { RegisterSchema, LoginSchema } from '../validations/auth.validation';
// 2. Tambahkan getMe di dalam kurung kurawal import controller ini
import { register, login, getMe } from '../controllers/auth.controller';

const router = Router();

router.post('/register', validate(RegisterSchema), register);
router.post('/login', validate(LoginSchema), login);

// 3. Daftarkan rute GET /me di sini, lindungi dengan middleware authenticate
router.get('/me', authenticate, getMe);

export default router;