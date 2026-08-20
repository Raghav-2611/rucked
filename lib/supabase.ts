import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = () => {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'
  );
};

export const getURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/';
  }
  // Server-side environment
  let url = process.env.NEXT_PUBLIC_SITE_URL || 'https://rucked.vercel.app';
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  return url.endsWith('/') ? url : `${url}/`;
};

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
