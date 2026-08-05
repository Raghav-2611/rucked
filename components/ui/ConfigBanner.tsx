'use client';

import React from 'react';
import { Database, AlertCircle } from 'lucide-react';

export function ConfigBanner() {
  return (
    <div className="bg-[#00A884]/15 border-b border-[#00A884]/30 text-xs px-4 py-2 text-[#E9EDEF] flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-[#00A884] shrink-0" />
        <span>
          <strong className="text-[#00A884]">Demo Mode:</strong> Supabase env variables not configured yet. Using local memory storage. Add credentials in <code className="bg-[#111B21] px-1.5 py-0.5 rounded border border-[#2A3942] text-[#00A884]">.env.local</code> to persist to database.
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-[#8696A0] shrink-0 hidden sm:flex">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>See README.md for setup</span>
      </div>
    </div>
  );
}
