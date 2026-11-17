import { useState, useEffect, FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { AnimatedModal } from './AnimatedModal';
import { supabase } from '../lib/supabaseClient';
import { Ornament } from './decor';

interface AuthModalProps { isOpen: boolean; onClose: () => void; onAuthChange: () => void; }

export const AuthModal = ({ isOpen, onClose, onAuthChange }: AuthModalProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const authPromise = mode === 'signin' ? supabase.auth.signInWithPassword({ email, password }) : supabase.auth.signUp({ email, password });
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Supabase is waking up (free tier). Please wait up to 2 min and try again.')), 30000));
      const { error: authError } = await Promise.race([authPromise, timeoutPromise]);
      if (authError) setError(authError.message);
      else { onAuthChange(); onClose(); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Connection failed'); }
    finally { setLoading(false); }
  };

  return (
    <AnimatedModal isOpen={isOpen} className="max-w-sm rounded-2xl p-6" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--outlineVariant)', boxShadow: '0 20px 60px rgba(30,40,65,.18)' }}>
      <div className="flex items-center justify-between mb-5">
        <div><p className="coastal-kicker mb-0.5 flex items-center gap-1.5"><Ornament className="w-2 h-2" style={{ color: '#A9C448' }} />Welcome to the table</p><h2 className="text-xl font-semibold">Your account</h2></div>
        <button onClick={onClose} style={{ color: 'var(--onSurfaceVariant)' }} aria-label="Close"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-xl px-3 py-3 text-sm focus:outline-none" style={{ background: 'var(--surfaceContainerLowest)', border: '1px solid var(--outlineVariant)', color: 'var(--onSurface)' }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full rounded-xl px-3 py-3 text-sm focus:outline-none" style={{ background: 'var(--surfaceContainerLowest)', border: '1px solid var(--outlineVariant)', color: 'var(--onSurface)' }} />
        {error && <p className="text-xs" style={{ color: 'var(--error)' }}>{error}</p>}
        <button type="submit" disabled={loading} className="w-full font-bold text-sm rounded-xl py-3 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#243F83', color: '#FFFDF7' }}>{loading && <Loader2 className="w-4 h-4 animate-spin" />}{mode === 'signin' ? 'Sign in' : 'Create account'}</button>
      </form>
      <p className="mt-5 text-center text-xs" style={{ color: 'var(--onSurfaceVariant)' }}>
        {mode === 'signin' ? <>New around here?{' '}<button onClick={() => { setMode('signup'); setError(''); }} className="underline font-semibold" style={{ color: 'var(--accent)' }}>Create an account</button></> : <>Already registered?{' '}<button onClick={() => { setMode('signin'); setError(''); }} className="underline font-semibold" style={{ color: 'var(--accent)' }}>Sign in</button></>}
      </p>
    </AnimatedModal>
  );
};
