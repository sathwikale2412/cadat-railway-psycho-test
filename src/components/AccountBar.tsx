import React, { useEffect, useState } from 'react';
import { History, LogOut, Smartphone, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchLoginHistory, type LoginRecord } from '../lib/cloud';

export const AccountBar: React.FC = () => {
  const { userId, email, isGuest, cloudEnabled, signOut, exitGuest } = useAuth();
  const [open, setOpen] = useState(false);
  const [logins, setLogins] = useState<LoginRecord[]>([]);

  useEffect(() => {
    if (!userId || !open) return;
    let cancelled = false;
    fetchLoginHistory(userId).then((rows) => {
      if (!cancelled) setLogins(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, open]);

  if (!cloudEnabled) return null;

  if (isGuest && !userId) {
    return (
      <button
        type="button"
        onClick={exitGuest}
        title="Switch to a synced account"
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition-all"
      >
        <Smartphone className="w-4 h-4 text-amber-400" />
        <span className="hidden sm:inline">Guest mode</span>
      </button>
    );
  }

  if (!userId) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-all"
      >
        <UserRound className="w-4 h-4 text-cyan-400" />
        <span className="hidden sm:inline max-w-[110px] truncate">{email ?? 'Signed in'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50">
          <p className="text-[11px] font-bold text-white mb-1">Signed in</p>
          <p className="text-[11px] text-slate-400 break-all mb-3">{email}</p>

          <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase font-bold tracking-wider text-slate-500">
            <History className="w-3 h-3" />
            <span>Recent sign-ins</span>
          </div>

          <ul className="space-y-1 mb-3 max-h-40 overflow-y-auto">
            {logins.length === 0 && <li className="text-[11px] text-slate-500">No sign-ins recorded yet.</li>}
            {logins.map((row, idx) => (
              <li key={`${row.logged_at}-${idx}`} className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="text-slate-400">{new Date(row.logged_at).toLocaleString()}</span>
                <span className="font-mono text-cyan-400">this app</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountBar;
