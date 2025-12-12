import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2),
});

export const businessSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  timezone: z.string().min(1),
  phoneNumber: z.string().optional(),
  whatsappToken: z.string().optional(),
  logoUrl: z.string().url().optional(),
  brandColor: z.string().regex(/^#?[0-9a-fA-F]{6}$/).optional(),
  bannerUrl: z.string().url().optional(),
});

export const serviceSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(2),
  durationMinutes: z.coerce.number().int().positive(),
  cleaningTimeMinutes: z.coerce.number().int().nonnegative(),
  price: z.coerce.number().nonnegative(),
});

export const scheduleSchema = z.object({
  businessId: z.string().min(1),
  weekday: z.coerce.number().int().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const bookingSchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  clientName: z.string().min(1),
  clientPhone: z.string().min(1),
});

export type BookingForm = z.infer<typeof bookingSchema>;
