import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import ErrorBanner from '../components/ErrorBanner';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function loadMessages() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/chat/messages', { params: { conversationId: 'support', page: 1, limit: 100 } });
      setMessages(response.data.messages || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 7000);
    return () => clearInterval(interval);
  }, []);

  async function sendMessage() {
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      const response = await api.post('/api/chat/messages', { conversationId: 'support', message: text.trim() });
      setMessages((current) => [...current, response.data.message, response.data.reply].filter(Boolean));
      setText('');
    } catch (sendError) {
      setError(sendError.message || 'Failed to send message');
      toast.error(sendError.message || 'Send failed');
    } finally {
      setSending(false);
    }
  }

  const grouped = useMemo(() => messages, [messages]);

  return (
    <>
      <Helmet>
        <title>AI Concierge | StayBook AI</title>
      </Helmet>
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="glass-panel p-8">
          <p className="eyebrow">AI customer support</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">Ask about bookings, policies, prices, or destinations.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            The concierge uses context-aware responses for FAQs, cancellations, booking flow guidance, and budget-friendly suggestions.
          </p>
        </section>

        {error && <ErrorBanner message={error} />}

        <section className="glass-panel overflow-hidden p-0">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Support conversation</h2>
          </div>
          <div className="max-h-[560px] space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.6),rgba(238,242,255,0.8))] px-6 py-6">
            {loading ? (
              <p className="text-sm text-slate-500">Loading conversation...</p>
            ) : grouped.length === 0 ? (
              <div className="rounded-3xl bg-white/80 p-6 text-sm text-slate-500 shadow-soft">
                Start a conversation with the AI concierge. Example: “Can I cancel a confirmed booking?”
              </div>
            ) : (
              grouped.map((message) => {
                const isAI = message.fromRole === 'ai';
                return (
                  <div key={message._id} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-xl rounded-[24px] px-4 py-3 text-sm shadow-soft ${isAI ? 'bg-white text-slate-700' : 'bg-slate-900 text-white'}`}>
                      <div className="mb-2 text-[11px] uppercase tracking-[0.24em] opacity-60">
                        {isAI ? 'AI concierge' : message.fromUserId?.email || 'You'}
                      </div>
                      <p className="leading-7">{message.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t border-slate-100 bg-white px-6 py-5">
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="input h-14 flex-1"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Ask about pricing, cancellations, amenities, or destination ideas..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button className="btn-primary h-14 px-6" onClick={sendMessage} disabled={sending}>
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
