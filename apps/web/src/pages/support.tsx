import { useState, type FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { LegalPage } from '@/components/site/legal';
import { guest } from '@/lib/guest';

const input = 'mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[16px] outline-none focus:border-forest';

// Messages are stored for the VagaGo team, who reply by phone or email.
export default function Support() {
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const change = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return setError('Enter your name.');
    if (form.contact.trim().length < 5) return setError('Enter a phone number or email we can reply to.');
    if (form.message.trim().length < 10) return setError('Tell us a little more so we can help.');
    setState('sending');
    setError(null);
    const { error: insertError } = await guest().from('support_requests').insert({ name: form.name.trim(), contact: form.contact.trim(), message: form.message.trim(), source: 'website' });
    if (insertError) { setState('idle'); setError('Couldn’t send your message. Please try again.'); }
    else setState('sent');
  };

  return <LegalPage title="Contact support" description="Get help with a VagaGo booking, stay or account.">
    {state === 'sent' ? <div className="flex items-center gap-3 rounded-2xl bg-save-soft p-5 text-save"><Icon name="check" className="shrink-0" /><p>Thanks for writing. We’ll get back to you at {form.contact.trim()}.</p></div>
      : <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
        <p>Questions about a booking, a stay or your account? Send us a message and we’ll reply by phone or email, usually within a day.</p>
        <label className="block"><span className="text-[14px] font-bold">Your name</span><input value={form.name} onChange={change('name')} maxLength={100} className={input} /></label>
        <label className="block"><span className="text-[14px] font-bold">Phone number or email</span><input value={form.contact} onChange={change('contact')} maxLength={254} className={input} /></label>
        <label className="block"><span className="text-[14px] font-bold">How can we help?</span><textarea value={form.message} onChange={change('message')} rows={5} maxLength={2000} className={`${input} resize-none`} /></label>
        {error ? <p role="alert" className="text-[14px] text-danger">{error}</p> : null}
        <button type="submit" disabled={state === 'sending'} className="min-h-12 w-full rounded-xl bg-forest text-[15px] font-bold text-white disabled:opacity-50">{state === 'sending' ? 'Sending…' : 'Send message'}</button>
      </form>}
  </LegalPage>;
}
