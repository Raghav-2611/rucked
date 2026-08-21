import React from 'react';
import { supabase, getURL, isSupabaseConfigured } from '@/lib/supabase';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured()) {
      alert('Supabase not configured.');
      return;
    }
    const redirectTo = `${getURL()}auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      console.error('OAuth error:', error);
      alert('Failed to initiate Google login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111B21]">
      <button
        onClick={handleGoogleLogin}
        className="flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-gray-800 shadow-md transition-transform hover:scale-105"
      >
        {/* Google SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 533.5 544.3"
          className="h-5 w-5"
        >
          <path
            fill="#4285F4"
            d="M533.5 278.4c0-18.7-1.5-36.9-4.3-54.5H272v103h147.5c-6.4 34.5-25.5 63.7-54.5 83.2v68h88c51.5-47.5 81.5-117.5 81.5-199.7"
          />
          <path
            fill="#34A853"
            d="M272 544.3c73.2 0 134.6-24.2 179.5-65.9l-88-68c-24.5 16.5-55.8 26-91.5 26-70.5 0-130.3-47.6-151.7-111.5h-90v70.3c44.8 89.5 137.9 149.1 241.7 149.1"
          />
          <path
            fill="#FBBC04"
            d="M120.3 325.9c-10-30-10-62.3 0-92.3v-70.3h-90c-38.9 77-38.9 169.6 0 246.6l90-84.3"
          />
          <path
            fill="#EA4335"
            d="M272 107.6c39.6-.6 77.9 14.8 106.7 42.5l80-80C410.2 12.5 342.5-6.4 272 0 168.2 0 75.1 59.6 30.3 149.1l90 84.3C141.8 155.2 201.5 107.6 272 107.6"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
