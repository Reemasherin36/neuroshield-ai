import { z } from 'zod'

const email = z.string().trim().min(1, 'Enter your email').email('Enter a valid email address').max(254)

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password').max(128),
})

export const registerSchema = z
  .object({
    email,
    password: z.string().min(10, 'Use at least 10 characters').max(128, 'Use at most 128 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>

const num = (label: string, min: number, max: number, unit: string) =>
  z
    .number({ invalid_type_error: `Enter ${label}`, required_error: `Enter ${label}` })
    .min(min, `${label[0].toUpperCase()}${label.slice(1)} must be at least ${min} ${unit}`)
    .max(max, `${label[0].toUpperCase()}${label.slice(1)} must be at most ${max} ${unit}`)

/** Ranges mirror the backend validation exactly. The server validates again. */
export const assessmentSchema = z.object({
  age: num('age', 0, 120, 'years'),
  gender: z.enum(['Male', 'Female', 'Other'], { errorMap: () => ({ message: 'Choose an option' }) }),
  hypertension: z.enum(['0', '1'], { errorMap: () => ({ message: 'Choose yes or no' }) }),
  heart_disease: z.enum(['0', '1'], { errorMap: () => ({ message: 'Choose yes or no' }) }),
  ever_married: z.enum(['Yes', 'No'], { errorMap: () => ({ message: 'Choose an option' }) }),
  work_type: z.enum(['Private', 'Self-employed', 'Govt_job', 'children', 'Never_worked'], {
    errorMap: () => ({ message: 'Choose an option' }),
  }),
  Residence_type: z.enum(['Urban', 'Rural'], { errorMap: () => ({ message: 'Choose an option' }) }),
  avg_glucose_level: num('average glucose', 40, 500, 'mg/dL'),
  bmi: num('BMI', 10, 80, 'kg/m²'),
  smoking_status: z.enum(['never smoked', 'formerly smoked', 'smokes', 'Unknown'], {
    errorMap: () => ({ message: 'Choose an option' }),
  }),
  consent: z.boolean(),
})
export type AssessmentForm = z.infer<typeof assessmentSchema>

export const passwordChangeSchema = z
  .object({
    current: z.string().min(1, 'Enter your current password'),
    next: z.string().min(10, 'Use at least 10 characters').max(128, 'Use at most 128 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
export type PasswordChangeForm = z.infer<typeof passwordChangeSchema>

export const deleteAccountSchema = z.object({ password: z.string().min(1, 'Enter your password to confirm') })
export type DeleteAccountForm = z.infer<typeof deleteAccountSchema>

import type { AssessmentInput } from './api'
export const toInput = (f: AssessmentForm): AssessmentInput => ({
  age: f.age,
  gender: f.gender,
  hypertension: Number(f.hypertension) as 0 | 1,
  heart_disease: Number(f.heart_disease) as 0 | 1,
  ever_married: f.ever_married,
  work_type: f.work_type,
  Residence_type: f.Residence_type,
  avg_glucose_level: f.avg_glucose_level,
  bmi: f.bmi,
  smoking_status: f.smoking_status,
})
