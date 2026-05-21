import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/profile');
  }

  const email = user.email ?? 'your account';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">Profile</p>
        <h1 className="text-xl font-semibold text-white mb-2">Profile</h1>
        <p className="text-slate-400 text-sm">Signed in as {email}.</p>
      </div>
    </div>
  );
}
