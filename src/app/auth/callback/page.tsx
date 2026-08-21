"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured');
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (!code) {
        console.error('No code found in callback URL');
        return;
      }
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Error exchanging code:', error);
        return;
      }
      // Session is now set in Supabase client; redirect to home or dashboard
      router.replace('/');
    };
    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111B21] text-white">
      <p>Processing authentication...</p>
    </div>
  );
}
"
