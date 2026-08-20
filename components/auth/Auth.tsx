'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NotebookPen, Key, Mail, User, ShieldAlert, Loader2 } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (signInError) throw signInError;
        onAuthSuccess();
      } else {
        // Sign Up
        if (!username.trim()) {
          throw new Error('Username is required for sign up.');
        }
        
        // Clean username to keep only alphanumeric + underscore
        const cleanedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (cleanedUsername.length < 3) {
          throw new Error('Username must be at least 3 alphanumeric characters/underscores.');
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              username: cleanedUsername,
              display_name: displayName.trim() || cleanedUsername,
            },
          },
        });
        
        if (signUpError) throw signUpError;
        
        // Let the user know they might need to confirm email if confirmation is enabled
        // but typically in Supabase standard setups, we sign in directly or ask them to check email.
        setError('Success! Please sign in with your credentials. (Confirm email if required)');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });
      if (googleError) throw googleError;
    } catch (err: any) {
      setError(err?.message || 'An error occurred during Google authentication.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#111B21] px-4">
      <div className="w-full max-w-md bg-[#202C33]/60 border border-[#2A3942] rounded-2xl p-8 shadow-xl backdrop-blur-md space-y-6">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#00A884] flex items-center justify-center text-white shadow-lg shadow-[#00A884]/20 animate-bounce">
            <NotebookPen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#E9EDEF] mt-3">
            rucked
          </h1>
          <p className="text-sm text-[#8696A0]">
            Your personal, private thought log & collaborative chat
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex rounded-lg bg-[#111B21] p-1 border border-[#2A3942]">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              isLogin
                ? 'bg-[#202C33] text-[#00A884] shadow-sm'
                : 'text-[#8696A0] hover:text-[#E9EDEF]'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${
              !isLogin
                ? 'bg-[#202C33] text-[#00A884] shadow-sm'
                : 'text-[#8696A0] hover:text-[#E9EDEF]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error / Success Banner */}
        {error && (
          <div
            className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs leading-relaxed ${
              error.startsWith('Success')
                ? 'bg-[#00A884]/10 border-[#00A884]/30 text-[#00A884]'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8696A0]" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884] transition-colors"
              />
            </div>
          </div>

          {/* Username (Only for Sign Up) */}
          {!isLogin && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8696A0]" htmlFor="username">
                  Username (Unique ID for others to add you)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]" />
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="john_doe"
                    className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884] transition-colors"
                  />
                </div>
              </div>

              {/* Display Name (Only for Sign Up, Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8696A0]" htmlFor="displayName">
                  Display Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]" />
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884] transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8696A0]" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-[#00A884] transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00A884] hover:bg-[#008f70] disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-[#00A884]/20 flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isLogin ? 'Log In' : 'Sign Up'}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2A3942]"></div>
          </div>
          <span className="relative px-3 bg-[#202C33]/60 text-xs font-semibold text-[#8696A0] uppercase tracking-wider backdrop-blur-md">
            Or
          </span>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-[#111B21] hover:bg-[#111B21]/80 border border-[#2A3942] hover:border-[#00A884]/50 disabled:opacity-50 text-[#E9EDEF] font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}
