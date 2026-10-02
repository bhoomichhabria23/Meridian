import React, { useEffect, useRef, useState } from 'react';
import { Bot, Check, Clipboard, LoaderCircle, MessageCircle, Plus, Send, ThumbsDown, ThumbsUp, UserRound } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { sendChatMessage } from '../../services/chatService';

const LINKS = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/doctor/patients', label: 'Patients', icon: '👥' },
  { to: '/doctor/appointments', label: 'Appointments', icon: '📅' },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: '💊' },
  { to: '/doctor/safety-alerts', label: 'Safety Alerts', icon: '⚠️' },
  { to: '/doctor/ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { to: '/doctor/profile', label: 'Profile', icon: '👤' },
];

const time = (value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function Message({ message }) {
  const assistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`mb-6 flex gap-3 ${assistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] gap-3 ${assistant ? 'flex-row' : 'flex-row-reverse'}`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${assistant ? 'bg-[#eaf7ed] text-[#25854d]' : 'bg-[#315f46] text-white'}`}>
          {assistant ? <Bot size={16} /> : <UserRound size={16} />}
        </span>
        <div className={assistant ? '' : 'text-right'}>
          <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${assistant ? 'rounded-tl-md bg-[#f1f8f3] text-[#4e6658]' : 'rounded-tr-md bg-[#25854d] text-white'}`}>
            {message.content}
          </div>
          <div className={`mt-2 flex items-center gap-3 text-[10px] text-[#98a69e] ${assistant ? '' : 'justify-end'}`}>
            <span>{time(message.timestamp)}</span>
            {assistant && (
              <>
                <button type="button" onClick={copy} title="Copy response">{copied ? <Check size={13} /> : <Clipboard size={13} />}</button>
                <button type="button" title="Helpful"><ThumbsUp size={13} /></button>
                <button type="button" title="Not helpful"><ThumbsDown size={13} /></button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', content: 'Hello. I can help with clinical summaries, medication safety, lab interpretation, and patient-specific decision support. Ask anything medical and I will respond in context-aware detail.', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const newChat = () => {
    if (messages.length) {
      setHistory((current) => [{ id: Date.now(), title: messages.find((message) => message.role === 'user')?.content || 'Clinical conversation', messages }, ...current]);
    }
    setMessages([{ id: 'welcome', role: 'assistant', content: 'Hello. I can help with clinical summaries, medication safety, lab interpretation, and patient-specific decision support. Ask anything medical and I will respond in context-aware detail.', timestamp: Date.now() }]);
    setError('');
  };

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;

    const next = [...messages, { role: 'user', content, timestamp: Date.now() }];
    setMessages(next);
    setInput('');
    setSending(true);
    setError('');

    try {
      const result = await sendChatMessage(next);
      setMessages([...next, { role: 'assistant', content: result.message, timestamp: Date.now() }]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    send();
  };

  const keyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <Layout links={LINKS}>
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-7 sm:px-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-120px)] gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[#25854d]">
              <MessageCircle size={18} />
              <h2 className="font-bold">Conversation history</h2>
            </div>
            <button type="button" onClick={newChat} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25854d] px-3 py-2.5 text-xs font-bold text-white">
              <Plus size={15} /> New chat
            </button>
            <div className="mt-5 space-y-2">
              {history.length ? history.map((item) => (
                <button key={item.id} type="button" className="w-full rounded-xl border border-[#e1efe5] bg-[#f5faf6] px-3 py-2 text-left text-xs font-semibold text-[#315f46]">
                  {item.title}
                </button>
              )) : (
                <div className="rounded-xl border border-dashed border-[#dcebe0] bg-[#f8fbf9] p-4 text-sm text-[#6e8078]">No saved threads yet.</div>
              )}
            </div>
          </aside>

          <main className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-sm">
            <div className="rounded-2xl border border-[#edf3ee] bg-[#f9fcfa] p-4">
              <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
                {messages.map((message) => (
                  <Message key={`${message.role}-${message.timestamp}-${Math.random()}`} message={message} />
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-[#f1f8f3] px-4 py-3 text-sm text-[#4e6658]">
                      <LoaderCircle className="h-4 w-4 animate-spin text-[#25854d]" />
                      AI is analyzing...
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>

            <form onSubmit={submit} className="mt-5 flex gap-3">
              <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={keyDown} rows={1} placeholder="Ask about a patient, medication, lab trend, or treatment plan..." className="min-h-[52px] flex-1 resize-none rounded-2xl border border-[#dfeee3] bg-[#f9fcfa] px-4 py-3 text-sm text-[#183a28] outline-none focus:border-[#8ac79d]" />
              <button type="submit" disabled={sending || !input.trim()} className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#25854d] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                <Send size={16} /> Send
              </button>
            </form>

            {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
          </main>
        </div>
      </div>
    </Layout>
  );
}
