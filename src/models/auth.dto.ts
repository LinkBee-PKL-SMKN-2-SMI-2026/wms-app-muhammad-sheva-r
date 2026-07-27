import { z } from 'zod';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '../validations/auth.validation';

export type RegisterRequest = z.infer<typeof RegisterSchema>['body'];
export type LoginRequest = z.infer<typeof LoginSchema>['body'];
export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>['body'];