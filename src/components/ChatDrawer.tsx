import { useState, type FormEvent } from 'react';
import { Bot, Loader as Loader2, Send, X } from 'lucide-react';

type ChatMessage = { role: 'user' | 'assistant'; text: string };

type ChatDrawerProps = {
  movieId: number;
  movieTitle: string;
  accessToken: string;
  onClose: () => void;
};

const SUGGESTIONS = [
  'What is it about?',
  'Explain the ending',
  'Is it worth watching?',
  'Who are the main characters?',
  'What awards did it win?',
];

export default function ChatDrawer({ movieId, movieTitle, accessToken, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setQuestion('');
    setError(null);
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setBusy(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId, question: trimmed }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.answer !== 'string') {
        throw new Error(typeof data.error === 'string' ? data.error : 'The movie guide could not answer');
      }
      setMessages((current) => [...current, { role: 'assistant', text: data.answer }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The movie guide could not answer');
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(question);
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/75 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-md bg-navy-900 border-l border-white/10 shadow-2xl flex flex-col animate-fade-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-accent-purple/20 text-accent-purple flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100">Ask AI</p>
              <p className="text-xs text-slate-500 truncate">About {movieTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition" aria-label="Close chat">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-300">Your movie guide is ready.</p>
              <p className="text-xs text-slate-500 mt-1">Ask about this movie only.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-accent-purple text-white rounded-br-md'
                    : 'bg-navy-850 text-slate-300 border border-white/5 rounded-bl-md'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking about {movieTitle}…
            </div>
          )}
          {error && (
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>
          )}
        </div>

        <div className="px-5 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => ask(suggestion)}
                disabled={busy}
                className="shrink-0 rounded-full border border-white/10 bg-navy-850 px-3 py-2 text-xs text-slate-400 hover:text-slate-100 hover:border-accent-purple/40 disabled:opacity-50 transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 rounded-2xl bg-navy-850 border border-white/10 p-2 focus-within:border-accent-purple/50 transition">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              disabled={busy}
              placeholder="Ask about this movie…"
              maxLength={500}
              className="flex-1 bg-transparent px-2 text-sm text-slate-100 placeholder-slate-500 outline-none"
            />
            <button
              type="submit"
              disabled={busy || !question.trim()}
              className="w-9 h-9 rounded-xl bg-accent-purple text-white flex items-center justify-center disabled:opacity-40 transition"
              aria-label="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
