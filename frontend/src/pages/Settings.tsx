import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { ConfirmButton } from '../components/ConfirmButton'
import { FormField } from '../components/FormField'
import { errorText } from '../components/StateNotice'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { formatDate } from '../lib/format'
import {
  deleteAccountSchema,
  passwordChangeSchema,
  type DeleteAccountForm,
  type PasswordChangeForm,
} from '../lib/schemas'

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p
      role={ok ? 'status' : 'alert'}
      className={`rounded-lg p-3 text-sm ${ok ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-status-danger'}`}
    >
      {text}
    </p>
  )
}

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [dataMsg, setDataMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [delMsg, setDelMsg] = useState<string | null>(null)

  const pw = useForm<PasswordChangeForm>({ resolver: zodResolver(passwordChangeSchema) })
  const del = useForm<DeleteAccountForm>({ resolver: zodResolver(deleteAccountSchema) })

  const changePassword = pw.handleSubmit(async (v) => {
    setPwMsg(null)
    try {
      await api.users.changePassword(v.current, v.next)
      pw.reset()
      setPwMsg({ ok: true, text: 'Password changed.' })
    } catch (e) {
      setPwMsg({ ok: false, text: errorText(e) })
    }
  })
  const deleteAccount = del.handleSubmit(async (v) => {
    setDelMsg(null)
    try {
      await api.users.remove(v.password)
      await logout()
      navigate('/', { replace: true })
    } catch (e) {
      setDelMsg(errorText(e))
    }
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Profile and settings</h1>

      <section className="card p-6" aria-labelledby="acct">
        <h2 id="acct" className="font-semibold text-navy-900">
          Account
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Email</dt>
            <dd className="font-medium text-navy-900">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Member since</dt>
            <dd className="font-medium text-navy-900">{user ? formatDate(user.created_at) : ''}</dd>
          </div>
        </dl>
      </section>

      <section className="card p-6" aria-labelledby="pw">
        <h2 id="pw" className="font-semibold text-navy-900">
          Change password
        </h2>
        <form onSubmit={changePassword} noValidate className="mt-4 space-y-4">
          <FormField
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={pw.formState.errors.current?.message}
            {...pw.register('current')}
          />
          <FormField
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 10 characters."
            error={pw.formState.errors.next?.message}
            {...pw.register('next')}
          />
          <FormField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={pw.formState.errors.confirm?.message}
            {...pw.register('confirm')}
          />
          {pwMsg && <Msg {...pwMsg} />}
          <button type="submit" className="btn-primary" disabled={pw.formState.isSubmitting}>
            Change password
          </button>
        </form>
      </section>

      <section className="card p-6" aria-labelledby="data">
        <h2 id="data" className="font-semibold text-navy-900">
          Saved assessments
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Delete every assessment you have saved. This cannot be undone.
        </p>
        {dataMsg && (
          <div className="mt-3">
            <Msg {...dataMsg} />
          </div>
        )}
        <div className="mt-4">
          <ConfirmButton
            label="Delete all saved assessments"
            confirmLabel="Yes, delete them all"
            onConfirm={async () => {
              try {
                await api.assessments.removeAll()
                setDataMsg({ ok: true, text: 'All saved assessments were deleted.' })
              } catch (e) {
                setDataMsg({ ok: false, text: errorText(e) })
              }
            }}
          />
        </div>
      </section>

      <section className="card p-6" aria-labelledby="privacy">
        <h2 id="privacy" className="font-semibold text-navy-900">
          How your data is handled
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink">
          <li>
            Stored: your email, a one-way password hash, and assessments you chose to save (inputs, result,
            model version, consent time).
          </li>
          <li>Not stored: results you get without saving, and request bodies are not logged.</li>
          <li>
            Retention: kept until you delete them or delete your account. Deleting your account also deletes
            your saved assessments.
          </li>
          <li>
            Limits: the local database is not encrypted at rest and this prototype is not production-grade. Do
            not enter real patient data.
          </li>
        </ul>
      </section>

      <section className="card border-red-200 p-6" aria-labelledby="danger">
        <h2 id="danger" className="font-semibold text-status-danger">
          Delete account
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Permanently removes your account and all saved assessments. Enter your password to confirm.
        </p>
        <form onSubmit={deleteAccount} noValidate className="mt-4 space-y-4">
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            error={del.formState.errors.password?.message}
            {...del.register('password')}
          />
          {delMsg && <Msg ok={false} text={delMsg} />}
          <button
            type="submit"
            className="btn bg-status-danger text-white hover:bg-red-800"
            disabled={del.formState.isSubmitting}
          >
            Delete my account
          </button>
        </form>
      </section>
    </div>
  )
}
