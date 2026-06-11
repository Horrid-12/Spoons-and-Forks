import { useState, useEffect, FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthChange: () => void;
}

export const AuthModal = ({ isOpen, onClose, onAuthChange }: AuthModalProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const authPromise = mode === 'signin'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase is waking up (free tier). Please wait up to 2 min and try again.')), 30000)
      );

      const { error: authError } = await Promise.race([authPromise, timeoutPromise]);

      if (authError) {
        setError(authError.message);
      } else {
        onAuthChange();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--background, #202225) 80%, transparent)' }}>
      <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl" style={{ backgroundColor: 'var(--card, #2f3136)', border: '1px solid var(--outlineVariant, #44464E)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs uppercase tracking-widest font-mono font-bold" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
            Account
          </h2>
          <button onClick={onClose} style={{ color: 'var(--onSurfaceVariant, #8e9297)' }} className="hover:opacity-80 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none"
            style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)', color: 'var(--onSurface, #dcddde)' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none"
            style={{ backgroundColor: 'var(--surfaceContainerLowest, #0C0E14)', border: '1px solid var(--outlineVariant, #44464E)', color: 'var(--onSurface, #dcddde)' }}
          />

          {error && (
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--error, #F2B8B5)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold text-sm rounded-xl py-2.5 font-mono uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--accent, #5865F2)', color: 'var(--onPrimary, #FFFFFF)' }}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-[10px] font-mono" style={{ color: 'var(--onSurfaceVariant, #8e9297)' }}>
          {mode === 'signin' ? (
            <>No account?{' '}<button onClick={() => { setMode('signup'); setError(''); }} style={{ color: 'var(--accent, #5865F2)' }} className="underline">Sign up</button></>
          ) : (
            <>Already have one?{' '}<button onClick={() => { setMode('signin'); setError(''); }} style={{ color: 'var(--accent, #5865F2)' }} className="underline">Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
};
