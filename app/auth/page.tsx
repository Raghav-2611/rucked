'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, MessageSquare } from 'lucide-react';

type Tab = 'signin' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('signin');

  // Sign In state
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siShowPw, setSiShowPw] = useState(false);

  // Sign Up state
  const [suEmail, setSuEmail] = useState('');
  const [suUsername, setSuUsername] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suShowPw, setSuShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ─── Sign In ────────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: siEmail.trim(),
      password: siPassword,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  // ─── Sign Up ────────────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (suPassword !== suConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (suPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    const usernameClean = suUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!usernameClean || usernameClean.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, underscores only).');
      return;
    }

    setLoading(true);

    // Sign up — username passed as metadata so the DB trigger picks it up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: suEmail.trim(),
      password: suPassword,
      options: {
        data: { username: usernameClean, display_name: usernameClean },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation OFF — session ready, go to app
      router.push('/');
      router.refresh();
    } else {
      // Email confirmation ON — prompt user to check inbox
      setLoading(false);
      setSuccess('Account created! Check your email to confirm, then sign in.');
      setTab('signin');
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#111B21] px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#00A884]/15 border border-[#00A884]/30 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-[#00A884]" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#E9EDEF] tracking-tight">rucked</h1>
            <p className="text-sm text-[#8696A0] mt-1">Your personal thought log</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#202C33] rounded-2xl border border-[#2A3942] overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-[#2A3942]">
            {(['signin', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  tab === t
                    ? 'text-[#00A884] border-b-2 border-[#00A884] bg-[#00A884]/5'
                    : 'text-[#8696A0] hover:text-[#E9EDEF]'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-[#00A884]/10 border border-[#00A884]/30 text-[#00A884] text-sm">
                {success}
              </div>
            )}

            {/* ── Sign In Form ── */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">Email</label>
                  <input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={siEmail}
                    onChange={(e) => setSiEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl px-4 py-3 text-sm text-[#E9EDEF] placeholder-[#4A5568] focus:outline-none focus:border-[#00A884] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input
                      id="signin-password"
                      type={siShowPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={siPassword}
                      onChange={(e) => setSiPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl px-4 py-3 pr-11 text-sm text-[#E9EDEF] placeholder-[#4A5568] focus:outline-none focus:border-[#00A884] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setSiShowPw(!siShowPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-[#E9EDEF] transition-colors"
                    >
                      {siShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="signin-submit"
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full py-3 rounded-xl bg-[#00A884] hover:bg-[#008f70] active:bg-[#007a5e] text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            )}

            {/* ── Sign Up Form ── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">Email</label>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl px-4 py-3 text-sm text-[#E9EDEF] placeholder-[#4A5568] focus:outline-none focus:border-[#00A884] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">Username</label>
                  <input
                    id="signup-username"
                    type="text"
                    autoComplete="username"
                    required
                    value={suUsername}
                    onChange={(e) => setSuUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="your_username"
                    className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl px-4 py-3 text-sm text-[#E9EDEF] placeholder-[#4A5568] focus:outline-none focus:border-[#00A884] transition-colors"
                  />
                  <p className="text-[11px] text-[#8696A0]">Letters, numbers, underscores only</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={suShowPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={suPassword}
                      onChange={(e) => setSuPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl px-4 py-3 pr-11 text-sm text-[#E9EDEF] placeholder-[#4A5568] focus:outline-none focus:border-[#00A884] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setSuShowPw(!suShowPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-[#E9EDEF] transition-colors"
                    >
                      {suShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">Confirm Password</label>
                  <input
                    id="signup-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={suConfirm}
                    onChange={(e) => setSuConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl px-4 py-3 text-sm text-[#E9EDEF] placeholder-[#4A5568] focus:outline-none focus:border-[#00A884] transition-colors"
                  />
                </div>

                <button
                  id="signup-submit"
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full py-3 rounded-xl bg-[#00A884] hover:bg-[#008f70] active:bg-[#007a5e] text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-[#4A5568] mt-6">
          Your data is stored securely in Supabase.
        </p>
      </div>
    </div>
  );
}
