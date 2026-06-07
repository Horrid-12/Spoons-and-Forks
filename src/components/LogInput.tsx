import { useState } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { FoodEntry } from '../types';
import { parseFoodWithAI } from '../lib/ai';

interface LogInputProps {
  onLog: (entry: FoodEntry) => void;
  apiKey: string;
}

export const LogInput = ({ onLog, apiKey }: LogInputProps) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);
    try {
      const macros = await parseFoodWithAI(text, apiKey);
      const newEntry: FoodEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        description: text,
        ...macros,
      };
      onLog(newEntry);
      setText('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse food';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="flex items-center bg-[var(--card)] border border-zinc-800 focus-within:border-[var(--accent)] transition-colors rounded-full p-1 shadow-md">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Log macro... (e.g. '2 eggs and a slice of toast')"
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-600 py-3 sm:py-3.5 px-5 font-mono text-sm sm:text-base disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="mr-1 px-5 sm:px-7 py-2.5 bg-[var(--accent)] text-zinc-950 font-bold uppercase tracking-widest text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity rounded-full shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Parsing</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Log</span>
                <Send className="w-4 h-4 sm:hidden" />
              </>
            )}
          </button>
        </div>
      </form>
      {error && (
        <div className="flex items-start gap-2 text-xs text-rose-400 font-mono px-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}
    </div>
  );
};
