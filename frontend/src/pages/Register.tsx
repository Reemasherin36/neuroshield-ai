import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { registerSchema, type RegisterForm } from '../lib/schemas'

export default function Register() {
  const { user, register: signUp } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await signUp(values.email, values.password)
      navigate('/dashboard', { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.code === 'email_taken') setError('email', { message: e.message })
      else setFormError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
    }
  })

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Only an email and a password are needed."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-teal-700 underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters."
          error={errors.password?.message}
          {...register('password')}
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-status-danger">
            {formError}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
