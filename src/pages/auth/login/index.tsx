import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { seniorExercisePhoto } from '../../../assets/index.ts';
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
import { useSignInMutation } from '../../../hooks/auth/use-sign-in-mutation.ts';

const LoginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi.')
    .email('Format email belum sesuai.')
    .max(254, 'Email terlalu panjang.'),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi.')
    .min(8, 'Kata sandi minimal 8 karakter.')
    .max(128, 'Kata sandi terlalu panjang.'),
});

type FieldErrors = Partial<Record<'email' | 'password', string>>;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const capabilities = useAuthCapabilitiesQuery();
  const signIn = useSignInMutation();
  const googleSignIn = useGoogleSignInMutation();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState(() =>
    searchParams.has('oauthError') ? 'Login dengan Google dibatalkan atau belum dapat diselesaikan.' : '',
  );
  const registrationCompleted = searchParams.has('registered');

  const busy = signIn.isPending || googleSignIn.isPending;
  const googleEnabled = capabilities.data?.socialProviders.google === true;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const parsed = LoginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === 'email' || key === 'password') && !next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      setFormError('Periksa kembali data yang diisi.');
      requestAnimationFrame(() => (next.email ? emailRef.current : passwordRef.current)?.focus());
      return;
    }

    setFieldErrors({});
    setFormError('');
    try {
      await signIn.mutateAsync(parsed.data);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session });
       navigate(ROUTES.onboarding, { replace: true });
    } catch (error) {
      setFormError(messageOf(error));
    }
  }

  async function handleGoogle() {
    if (busy) return;
    setFormError('');
    try {
      const url = await googleSignIn.mutateAsync('login');
      window.location.assign(url);
    } catch (error) {
      setFormError(messageOf(error));
    }
  }

  return (
    <AuthShell
      footer={
        <p className="m-0">
          Belum memiliki akun?{' '}
          <Link
            className="font-black text-accent underline underline-offset-4"
            to={ROUTES.register}
          >
            Daftar
          </Link>
        </p>
      }
      photo={seniorExercisePhoto}
      photoAlt="Pendamping membantu lansia melakukan latihan"
      subtitle="Masuk dengan akun institusi untuk melanjutkan sesi latihan."
      title="Selamat datang kembali"
      visualSide="right"
      visualText="Kelola latihan peserta dan lihat hasil sesi dalam satu tempat."
      visualTitle="Dampingi setiap langkah dengan lebih mudah."
    >
      <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
        <Field
          autoComplete="email"
          error={fieldErrors.email}
          inputRef={emailRef}
          label="Email institusi"
          maxLength={254}
          name="email"
          onChange={(event) => {
            setEmail(event.target.value);
            if (fieldErrors.email) {
              setFieldErrors(({ email: _email, ...remaining }) => remaining);
            }
          }}
          placeholder="nama@institusi.id"
          required
          type="email"
          value={email}
        />

        <Field
          autoComplete="current-password"
          error={fieldErrors.password}
          inputRef={passwordRef}
          label="Kata sandi"
          maxLength={128}
          name="password"
          onChange={(event) => {
            setPassword(event.target.value);
            if (fieldErrors.password) {
              setFieldErrors(({ password: _password, ...remaining }) => remaining);
            }
          }}
          placeholder="Masukkan kata sandi"
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

        {registrationCompleted && !formError && (
          <p aria-live="polite" className="m-0 text-base font-bold leading-6 text-success" role="status">
            Pendaftaran berhasil. Silakan masuk dengan email dan kata sandi Anda.
          </p>
        )}
        {formError && (
          <p aria-live="polite" className="m-0 text-base font-bold leading-6 text-danger" role="alert">
            {formError}
          </p>
        )}

        <Button className="w-full" disabled={busy} type="submit">
          {signIn.isPending ? 'Memproses…' : 'Masuk'}
        </Button>

        <div className="flex items-center gap-3 py-1 text-base font-bold text-muted">
          <span className="h-px flex-1 bg-divider" />
          atau
          <span className="h-px flex-1 bg-divider" />
        </div>
        <GoogleAuthButton
          disabled={busy || !googleEnabled}
          label="Masuk dengan Google"
          loading={googleSignIn.isPending}
          loadingLabel="Menghubungkan ke Google…"
          onClick={() => void handleGoogle()}
        />
        {capabilities.isError ? (
          <p className="m-0 text-center text-base font-semibold leading-6 text-danger" role="alert">
            Layanan masuk sedang tidak tersedia. Coba lagi beberapa saat lagi.
          </p>
        ) : (
          !capabilities.isPending &&
          !googleEnabled && (
            <p className="m-0 text-center text-base font-semibold leading-6 text-muted">
              Login Google belum diaktifkan oleh administrator.
            </p>
          )
        )}
      </form>
    </AuthShell>
  );
}
