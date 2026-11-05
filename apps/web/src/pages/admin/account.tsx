import { Shell } from '@/components/admin/shell';
import { Icon } from '@/components/icons';
import { Button } from '@/components/admin/ui';
import { useAuth } from '@/lib/auth';

export default function Account() {
  const { username, signOut } = useAuth();
  return <Shell title="Account">
    <div className="flex items-center gap-4 px-4 pt-6">
      <div className="grid size-14 place-items-center rounded-full bg-forest text-[22px] font-bold text-white uppercase">{username.slice(0, 1)}</div>
      <div><p className="text-[18px] font-bold capitalize">{username}</p><p className="text-[13px] text-muted">VagaGo admin</p></div>
    </div>
    <section className="mx-4 mt-6 rounded-2xl border border-line p-4">
      <p className="text-[15px] font-bold">Install on your phone</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[14px] leading-6 text-muted">
        <li>Open this page in Safari (iPhone) or Chrome (Android).</li>
        <li>Tap Share, then <b className="text-ink">Add to Home Screen</b> (Chrome: menu ⋮ → Install app).</li>
        <li>Open VagaGo Admin from your home screen.</li>
      </ol>
    </section>
    <div className="px-4 pt-6">
      <Button variant="danger" className="w-full" onClick={() => void signOut()}><span className="inline-flex items-center gap-2"><Icon name="logout" size={18} />Sign out</span></Button>
    </div>
  </Shell>;
}
