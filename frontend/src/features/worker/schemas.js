import { z } from 'zod'

export const shiftFormSchema = z
  .object({
    platform: z.string().min(1, 'Platform is required'),
    date: z.string().min(1, 'Date is required'),
    hours_worked: z.coerce
      .number({ invalid_type_error: 'Hours must be a number' })
      .gt(0, 'Hours must be greater than 0')
      .max(24, 'Hours cannot exceed 24'),
    gross_earned: z.coerce
      .number({ invalid_type_error: 'Gross earned must be a number' })
      .min(0, 'Gross earned cannot be negative'),
    deductions: z.coerce
      .number({ invalid_type_error: 'Deductions must be a number' })
      .min(0, 'Deductions cannot be negative'),
    net_received: z.coerce.number().min(0),
    screenshot_url: z.union([
      z.literal(''),
      z.string().url('Uploaded screenshot URL is invalid'),
    ]),
  })
  .refine((values) => values.deductions <= values.gross_earned, {
    path: ['deductions'],
    message: 'Deductions cannot exceed gross earned',
  })

export const grievanceFormSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().min(8, 'Description must be at least 8 characters'),
  tags: z.string().optional(),
})
