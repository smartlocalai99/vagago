import Head from 'next/head';
import { useRef, useState, type FormEvent } from 'react';
import { Button, Field, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function Login() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pinInput = useRef<HTMLInputElement>(null);

  async function submit(value = pin) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const message = await signIn(username, value);
    if (message) {
      setError(message);
      setPin('');
      pinInput.current?.focus();
    }
    setBusy(false);
  }

  function onPin(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setPin(digits);
    if (digits.length === 4 && username.trim()) void submit(digits);
  }

  return <main className="flex min-h-dvh flex-col px-6 pt-[calc(env(safe-area-inset-top)+56px)] pb-8">
    <Head><title>Sign in · VagaGo Admin</title></Head>
    <img src="/icons/icon-192.png" alt="VagaGo" width={64} height={64} className="rounded-2xl" />
    <h1 className="mt-6 text-[26px] leading-tight font-bold">VagaGo Admin</h1>
    <p className="mt-1 text-[15px] text-muted">Sign in to manage hotels and bookings.</p>
    <form className="mt-8 space-y-5" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(); }}>
      <Field label="Username">
        <Input value={username} onChange={(event) => setUsername(event.target.value)} autoCapitalize="none" autoCorrect="off"
          autoComplete="username" enterKeyHint="next" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); pinInput.current?.focus(); } }} />
      </Field>
      <Field label="PIN" error={error}>
        <div className="relative">
          <input ref={pinInput} value={pin} onChange={(event) => onPin(event.target.value)} inputMode="numeric" autoComplete="current-password"
            pattern="[0-9]*" maxLength={4} aria-label="4-digit PIN" className="absolute inset-0 opacity-0" />
          <div className="grid grid-cols-4 gap-3" aria-hidden="true" onClick={() => pinInput.current?.focus()}>
            {[0, 1, 2, 3].map((index) => <div key={index}
              className={`grid h-14 place-items-center rounded-xl border text-2xl ${pin.length === index ? 'border-forest ring-3 ring-forest/12' : 'border-line'}`}>
              {pin[index] ? '•' : ''}
            </div>)}
          </div>
        </div>
      </Field>
      <Button type="submit" className="w-full" disabled={busy || pin.length !== 4 || !username.trim()}>{busy ? 'Signing in…' : 'Sign in'}</Button>
    </form>
  </main>;
}
