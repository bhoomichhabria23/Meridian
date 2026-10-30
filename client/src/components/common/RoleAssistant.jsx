import { useEffect, useRef, useState } from "react";
import { Bot, Check, Clipboard, LoaderCircle, MessageCircle, Paperclip, Plus, RefreshCw, Send, Sparkles, ThumbsDown, ThumbsUp, UserRound } from "lucide-react";
import { fetchChatHistory, sendChatMessage } from "../../services/chatService";

const time = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

function Message({ message }) {
  const assistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`mb-6 flex gap-3 ${assistant ? "justify-start" : "justify-end"}`}>
      <div className={`flex max-w-[85%] gap-3 ${assistant ? "flex-row" : "flex-row-reverse"}`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${assistant ? "bg-[#eaf7ed] text-[#25854d]" : "bg-[#315f46] text-white"}`}>
          {assistant ? <Bot size={16} /> : <UserRound size={16} />}
        </span>
        <div className={assistant ? "" : "text-right"}>
          <div className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${assistant ? "rounded-tl-md bg-[#f1f8f3] text-[#4e6658]" : "rounded-tr-md bg-[#25854d] text-white"}`}>
            {message.content}
          </div>
          <div className={`mt-2 flex items-center gap-3 text-[10px] text-[#98a69e] ${assistant ? "" : "justify-end"}`}>
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

export default function RoleAssistant({ links, role, title, subtitle, welcome, placeholder, prompts }) {
  const [messages, setMessages] = useState([]);
  const [savedMessages, setSavedMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetchChatHistory()
      .then((history) => {
        if (!active) return;
        const current = history.messages || [];
        setConversations(history.conversations || []);
        setSavedMessages(current);
        setMessages(current);
        if (history.conversationId) setConversationId(history.conversationId);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load conversation history.");
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => { active = false; };
  }, [role]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const newChat = () => {
    setConversationId(crypto.randomUUID());
    setMessages([]);
    setError("");
  };

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    const userMessage = { role: "user", content, timestamp: new Date().toISOString() };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setSending(true);
    setError("");

    try {
      const result = await sendChatMessage(next, { conversationId });
      const updated = [...next, { role: "assistant", content: result.message, category: result.category, timestamp: new Date().toISOString() }];
      setMessages(updated);
      setSavedMessages((current) => [...current, userMessage, updated.at(-1)]);
    } catch (requestError) {
      setError(requestError.message || "MERIDIAN AI is unavailable right now.");
    } finally {
      setSending(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    send();
  };

  const keyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const firstQuestion = savedMessages.find((message) => message.role === "user")?.content;

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#f5faf7]">
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-[1500px] gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#25854d]">
            <MessageCircle size={18} />
            <h2 className="font-bold">Conversation history</h2>
          </div>
          <button type="button" onClick={newChat} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25854d] px-3 py-2.5 text-xs font-bold text-white">
            <Plus size={15} /> New chat
          </button>
          <div className="mt-5 space-y-2">
            {loadingHistory ? (
              <p className="rounded-xl bg-[#f7fbf8] p-3 text-xs text-[#87958d]">Loading history...</p>
            ) : conversations.length ? (
              conversations.map((conversation) => {
                const question = conversation.messages?.find((message) => message.role === "user")?.content || "Clinical conversation";
                return <button key={conversation.conversationId} type="button" onClick={() => { setConversationId(conversation.conversationId); setMessages(conversation.messages || []); }} className="w-full truncate rounded-xl bg-[#f1f8f3] px-3 py-2.5 text-left text-xs text-[#648071]">{question}</button>;
              })
            ) : (
              <p className="rounded-xl bg-[#f7fbf8] p-3 text-xs leading-5 text-[#87958d]">Your conversations will appear here.</p>
            )}
          </div>
        </aside>

        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-[#deece1] bg-white shadow-[0_10px_35px_rgba(31,105,59,0.06)]">
          <header className="flex items-center justify-between border-b border-[#edf3ee] bg-[#f5fbf6] px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#dff1e3] text-[#25854d]"><Sparkles size={21} /></span>
              <div><h1 className="font-bold text-[#173a28]">{title}</h1><p className="text-xs text-[#75887c]">{subtitle}</p></div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#25854d]"><span className="h-2 w-2 rounded-full bg-[#4eaf6c]" /> Online</span>
          </header>

          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {messages.length === 0 && (
              <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eaf7ed] text-[#25854d]"><Bot size={29} /></span>
                <h2 className="mt-5 text-2xl font-bold text-[#173a28]">{welcome}</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#819087]">Ask about information available to your role in MERIDIAN. The assistant will not invent missing records.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => setInput(prompt)} className="rounded-full border border-[#dbe9df] px-3 py-2 text-xs text-[#648071] hover:bg-[#f1f8f3]">{prompt}</button>)}
                </div>
              </div>
            )}
            {messages.map((message, index) => <Message key={`${message.timestamp}-${index}`} message={message} />)}
            {sending && <div className="mt-5 flex items-center gap-3 text-sm text-[#71857a]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf7ed] text-[#25854d]"><Bot size={17} /></span><span className="flex items-center gap-1">MERIDIAN AI is thinking <LoaderCircle size={14} className="animate-spin" /></span></div>}
            {error && <div className="mt-5 flex items-center justify-between rounded-xl bg-[#fff7f5] p-3 text-xs text-[#9c5b54]"><span>{error}</span><button type="button" onClick={() => setError("")}><RefreshCw size={14} /></button></div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="border-t border-[#edf3ee] p-4 sm:p-5">
            <div className="flex items-end gap-2 rounded-2xl border border-[#dbe9df] bg-[#fbfdfb] p-2 focus-within:border-[#76b888]">
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#789087] hover:bg-[#eef7f0]" title="Attachments are not enabled for chat yet"><Paperclip size={17} /></button>
              <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={keyDown} placeholder={placeholder} rows={1} className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-[#a0ada5]" />
              <button type="submit" disabled={!input.trim() || sending} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25854d] text-white transition hover:bg-[#176b3d] disabled:cursor-not-allowed disabled:opacity-50" title="Send"><Send size={17} /></button>
            </div>
            <p className="mt-2 text-center text-[10px] text-[#9aaa9f]">Enter to send · Shift + Enter for a new line</p>
          </form>
        </section>
      </div>
    </div>
  );
}
