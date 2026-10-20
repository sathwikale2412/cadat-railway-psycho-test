import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, Smartphone, Train, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'signin' | 'signup';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        const hint = await signUp(email.trim(), password, name.trim());
        setNotice(hint ?? 'Account ready. You are signed in.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const labelCls = 'block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5';
  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 transition-colors';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
            <Train className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white">CADAT SIMULATOR</h1>
            <p className="text-[11px] text-slate-400">RDSO psycho battery practice</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError('');
                  setNotice('');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === m ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-5 -mt-2.5">
            Your practice attempts and T-scores sync to this account, so the same history follows you between phone and
            laptop.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label htmlFor="cadat-name" className={labelCls}>
                  Name
                </label>
                <input
                  id="cadat-name"
                  className={inputCls}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ale Sathwik"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label htmlFor="cadat-email" className={labelCls}>
                Email
              </label>
              <input
                id="cadat-email"
                type="email"
                required
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="cadat-password" className={labelCls}>
                Password
              </label>
              <input
                id="cadat-password"
                type="password"
                required
                minLength={8}
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <p className="flex items-start gap-2 text-xs text-red-400 bg-red-950/50 border border-red-500/30 rounded-xl p-2.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </p>
            )}

            {notice && (
              <p className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{notice}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 active:scale-95 disabled:opacity-60 text-white text-sm shadow-lg shadow-cyan-600/25 transition-all flex items-center justify-center gap-2"
            >
              {mode === 'signin' ? <Mail className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>
                {busy ? 'Working…' : mode === 'signin' ? 'Sign in and continue' : 'Create my account'}
              </span>
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-800">
            <button
              type="button"
              onClick={continueAsGuest}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>Continue as guest (this device only)</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 text-center mt-4 leading-relaxed">
          Practice scores are stored against your account with row-level security — no other signed-in user can read
          them.
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
