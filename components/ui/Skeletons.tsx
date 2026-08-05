'use client';

import React from 'react';

export function TopicListSkeleton() {
  return (
    <div className="p-3 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-[#202C33]/50 animate-pulse rounded-xl p-3 flex items-center gap-3 border border-[#2A3942]/30"
        >
          <div className="w-10 h-10 rounded-full bg-[#2A3942]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#2A3942] rounded-xs w-2/3" />
            <div className="h-3 bg-[#2A3942]/60 rounded-xs w-5/6" />
          </div>
          <div className="w-10 h-3 bg-[#2A3942]/40 rounded-xs" />
        </div>
      ))}
    </div>
  );
}

export function StatementListSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[
        { width: 'w-2/3', align: 'items-start' },
        { width: 'w-1/2', align: 'items-start' },
        { width: 'w-3/4', align: 'items-start' },
        { width: 'w-2/5', align: 'items-start' },
      ].map((item, idx) => (
        <div key={idx} className={`flex flex-col ${item.align}`}>
          <div
            className={`bg-[#202C33]/70 border border-[#2A3942]/40 animate-pulse rounded-2xl p-4 space-y-2 ${item.width}`}
          >
            <div className="h-3 bg-[#2A3942] rounded-xs w-full" />
            <div className="h-3 bg-[#2A3942] rounded-xs w-4/5" />
            <div className="h-2 bg-[#2A3942]/60 rounded-xs w-1/4 pt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
