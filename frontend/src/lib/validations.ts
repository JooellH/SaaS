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

const hhmm = /^\d{2}:\d{2}$/;
const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map((n) => Number(n));
  return hours * 60 + minutes;
};

export const scheduleSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    openTime: z.string().regex(hhmm),
    closeTime: z.string().regex(hhmm),
    breakStart: z.string().regex(hhmm).optional(),
    breakEnd: z.string().regex(hhmm).optional(),
  })
  .superRefine((data, ctx) => {
    const open = toMinutes(data.openTime);
    const close = toMinutes(data.closeTime);
    if (open >= close) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closeTime"],
        message: "El horario de cierre debe ser mayor al de apertura.",
      });
    }

    const hasBreakStart = Boolean(data.breakStart);
    const hasBreakEnd = Boolean(data.breakEnd);
    if (hasBreakStart !== hasBreakEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["breakStart"],
        message: "Completa inicio y fin de la pausa.",
      });
      return;
    }

    if (data.breakStart && data.breakEnd) {
      const pauseStart = toMinutes(data.breakStart);
      const pauseEnd = toMinutes(data.breakEnd);
      if (!(open < pauseStart && pauseStart < pauseEnd && pauseEnd < close)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["breakStart"],
          message: "La pausa debe estar dentro del horario y ser válida.",
        });
      }
    }
  })
  .transform((data) => {
    const intervals = data.breakStart && data.breakEnd
      ? [
          { start: data.openTime, end: data.breakStart },
          { start: data.breakEnd, end: data.closeTime },
        ]
      : [{ start: data.openTime, end: data.closeTime }];

    return {
      weekday: data.weekday,
      intervals,
      isActive: true,
    };
  });

export const bookingSchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  clientName: z.string().min(1),
  clientPhone: z.string().min(1),
});

export type BookingForm = z.infer<typeof bookingSchema>;
