import { useState } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { FoodEntry } from '../types';
import { parseFoodWithAI } from '../lib/ai';
import { CitrusIcon } from './decor';

interface LogInputProps { onLog: (entry: FoodEntry) => void; apiKey: string; model: string; }

export const LogInput = ({ onLog, apiKey, model }: LogInputProps) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    setError(null); setIsLoading(true);
    try {
      const macros = await parseFoodWithAI(text, apiKey, model);
      const newEntry: FoodEntry = { id: crypto.randomUUID(), timestamp: Date.now(), description: text, ...macros };
      onLog(newEntry); setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse food');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="w-full space-y-1.5">
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="flex items-center rounded-xl p-1.5 shadow-sm transition-shadow focus-within:shadow-md" style={{ background: 'var(--card)', border: '1px solid var(--outlineVariant)' }}>
          <div className="pl-2.5 pr-1 flex items-center shrink-0" style={{ color: 'var(--accent)' }}>
            <CitrusIcon className="w-5 h-5" />
          </div>
          <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="What did you eat? Try “2 eggs and toast”" disabled={isLoading} className="flex-1 min-w-0 bg-transparent border-none outline-none py-2.5 px-2.5 text-sm sm:text-base disabled:opacity-50" style={{ color: 'var(--onSurface)' }} />
          <button type="submit" disabled={isLoading || !text.trim()} className="mr-1 px-4 py-2.5 font-bold text-sm flex items-center gap-2 disabled:opacity-50 rounded-lg shadow-sm" style={{ background: '#243F83', color: '#FFFDF7' }}>
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="hidden sm:inline">Estimating</span></> : <><span className="hidden sm:inline">Add to log</span><Send className="w-4 h-4 sm:hidden" /></>}
          </button>
        </div>
      </form>
      {error && <div className="flex items-start gap-2 text-xs px-2" style={{ color: 'var(--error)' }}><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span className="break-all">{error}</span></div>}
      <p className="text-[10px] px-2" style={{ color: 'var(--onSurfaceVariant)' }}>AI-generated estimates. Tap any calorie value to adjust it.</p>
    </div>
  );
};
