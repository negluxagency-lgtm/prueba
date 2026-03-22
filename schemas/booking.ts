import { z } from 'zod'

// ──────────────────────────────────────────────
// Booking Schema
// ──────────────────────────────────────────────

export const BookingSchema = z.object({
    /** Shop slug (public URL identifier) */
    slug: z.string().min(1, 'El slug de la barbería es obligatorio'),

    /** ID of the selected service (String/UUID or Number) */
    serviceId: z.union([z.string(), z.number()]).transform(v => String(v)),

    /** Date in YYYY-MM-DD format */
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (usa YYYY-MM-DD)'),

    /** Time in HH:MM format */
    time: z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (usa HH:MM)'),

    /** Guest full name, minimum 3 chars */
    guestName: z
        .string()
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(80, 'El nombre es demasiado largo'),

    /** Spanish phone number: exactly 9 digits */
    guestPhone: z
        .string()
        .regex(/^\d{9}$/, 'El teléfono debe tener exactamente 9 dígitos numéricos'),

    /** Optional barber ID (String/UUID or Number) */
    barberId: z.union([z.string(), z.number()]).transform(v => String(v)).optional(),

    /**
     * Honeypot anti-bot: este campo debe llegar SIEMPRE vacío.
     * Es invisible para humanos (hidden via CSS). Los bots que auto-rellenan
     * formularios lo llenarán y serán detectados antes de tocar Supabase.
     */
    address_confirm: z.string().max(0, 'Bot detected').optional(),

    /** reCAPTCHA v3 token for bot validation */
    recaptchaToken: z.string().optional(),
})

// Inferred TypeScript type — use this in Server Actions
export type BookingInput = z.infer<typeof BookingSchema>
