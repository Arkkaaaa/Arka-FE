import { useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { healthcareTeamPhoto } from '../../../assets/index.ts';
import {
  AuthShell,
  Button,
  Field,
  GoogleAuthButton,
  PasswordVisibilityButton,
} from '../../../components/index.ts';
import { messageOf } from '../../../config/api-client.ts';
import { QUERY_KEYS } from '../../../constants/query-keys.ts';
import { ROUTES } from '../../../constants/routes.ts';
import { useAuthCapabilitiesQuery } from '../../../hooks/auth/use-auth-capabilities-query.ts';
import { useGoogleSignInMutation } from '../../../hooks/auth/use-google-sign-in-mutation.ts';
import { useSignUpMutation } from '../../../hooks/auth/use-sign-up-mutation.ts';

const RegisterFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama institusi minimal 2 karakter.')
    .max(120, 'Nama institusi terlalu panjang.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi.')
    .email('Format email belum sesuai.')
    .max(254, 'Email terlalu panjang.'),
  password: z
    .string()
    .min(8, 'Kata sandi minimal 8 karakter.')
    .max(128, 'Kata sandi terlalu panjang.'),
});

type FieldName = 'name' | 'email' | 'password';
type FieldErrors = Partial<Record<FieldName, string>>;

export function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const capabilities = useAuthCapabilitiesQuery();
  const signUp = useSignUpMutation();
  const googleSignIn = useGoogleSignInMutation();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');

  const busy = signUp.isPending || googleSignIn.isPending;
  const googleEnabled = capabilities.data?.socialProviders.google === true;

  function clearFieldError(field: FieldName) {
    if (!fieldErrors[field]) return;
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const parsed = RegisterFormSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if ((field === 'name' || field === 'email' || field === 'password') && !next[field]) {
          next[field] = issue.message;
        }
      }
      setFieldErrors(next);
      setFormError('Periksa kembali data yang diisi.');
      requestAnimationFrame(() => {
        if (next.name) nameRef.current?.focus();
        else if (next.email) emailRef.current?.focus();
        else passwordRef.current?.focus();
      });
      return;
    }

    setFieldErrors({});
    setFormError('');
    try {
      await signUp.mutateAsync(parsed.data);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session });
      navigate(ROUTES.landing, { replace: true });
    } catch (error) {
      setFormError(messageOf(error));
    }
  }

  async function handleGoogle() {
    if (busy) return;
    setFormError('');
    try {
      const url = await googleSignIn.mutateAsync();
      window.location.assign(url);
    } catch (error) {
      setFormError(messageOf(error));
    }
  }

  return (
    <AuthShell
      footer={
        <p className="m-0">
          Sudah memiliki akun?{' '}
          <Link className="font-black text-accent underline underline-offset-4" to={ROUTES.login}>
            Masuk
          </Link>
        </p>
      }
      photo={healthcareTeamPhoto}
      photoAlt="Tim tenaga kesehatan berdiskusi bersama"
      subtitle="Buat satu akun untuk mengelola latihan di institusi Anda."
      title="Daftarkan institusi"
      visualSide="left"
      visualText="Siapkan akun pendamping dan mulai latihan dengan alur yang jelas."
      visualTitle="Mulai pendampingan dalam satu akun."
    >
      <form className="grid gap-3" noValidate onSubmit={handleSubmit}>
        <Field
          autoComplete="organization"
          error={fieldErrors.name}
          inputRef={nameRef}
          label="Nama institusi"
          maxLength={120}
          name="name"
          onChange={(event) => {
            setName(event.target.value);
            clearFieldError('name');
          }}
          placeholder="Contoh: Panti Sejahtera"
          required
          value={name}
        />
        <Field
          autoComplete="email"
          error={fieldErrors.email}
          inputRef={emailRef}
          label="Email institusi"
          maxLength={254}
          name="email"
          onChange={(event) => {
            setEmail(event.target.value);
            clearFieldError('email');
          }}
          placeholder="nama@institusi.id"
          required
          type="email"
          value={email}
        />
        <Field
          autoComplete="new-password"
          error={fieldErrors.password}
          hint="Gunakan minimal 8 karakter."
          inputRef={passwordRef}
          label="Kata sandi"
          maxLength={128}
          name="password"
          onChange={(event) => {
            setPassword(event.target.value);
            clearFieldError('password');
          }}
          placeholder="Buat kata sandi"
          required
          trailing={
            <PasswordVisibilityButton
              onToggle={() => setShowPassword((visible) => !visible)}
              visible={showPassword}
            />
          }
          type={showPassword ? 'text' : 'password'}
          value={password}
        />

        {formError && (
          <p aria-live="polite" className="m-0 text-base font-bold leading-6 text-danger" role="alert">
            {formError}
          </p>
        )}

        <Button className="w-full" disabled={busy} type="submit">
          {signUp.isPending ? 'Mendaftarkan…' : 'Daftar'}
        </Button>

        <div className="flex items-center gap-3 py-1 text-base font-bold text-muted">
          <span className="h-px flex-1 bg-divider" />
          atau
          <span className="h-px flex-1 bg-divider" />
        </div>
        <GoogleAuthButton
          disabled={busy || !googleEnabled}
          label="Daftar dengan Google"
          loading={googleSignIn.isPending}
          loadingLabel="Menghubungkan ke Google…"
          onClick={() => void handleGoogle()}
        />
        {capabilities.isError ? (
          <p className="m-0 text-center text-base font-semibold leading-6 text-danger" role="alert">
            Layanan pendaftaran sedang tidak tersedia. Coba lagi beberapa saat lagi.
          </p>
        ) : (
          !capabilities.isPending &&
          !googleEnabled && (
            <p className="m-0 text-center text-base font-semibold leading-6 text-muted">
              Pendaftaran Google belum diaktifkan oleh administrator.
            </p>
          )
        )}
      </form>
    </AuthShell>
  );
}
