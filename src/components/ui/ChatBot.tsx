'use client';
// src/components/ui/ChatBot.tsx
// CinéBot — assistant chatbot flottant (sans aucun émoji)

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

const INITIAL_MSG: Message = {
  role: 'bot',
  text: 'Bonjour ! Je suis CinéBot. Posez-moi une question sur les films ou cinémas à Lyon !',
};

export default function ChatBot({ showGoTop = false }: { showGoTop?: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply || 'Désolé, une erreur est survenue.' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Impossible de vous répondre pour l\'instant. Réessayez dans quelques instants.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {open && (
        <div className="chatbot-panel" role="dialog" aria-label="CinéBot assistant" aria-modal="true">
          <div className="chatbot-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
              </svg>
              CinéBot
            </span>
            <button
              className="chatbot-close"
              onClick={() => setOpen(false)}
              aria-label="Fermer le chatbot"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="chatbot-messages" ref={messagesRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg ${msg.role}`} style={{ whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg bot" style={{ opacity: 0.6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                <span>CinéBot réfléchit…</span>
              </div>
            )}
          </div>

          <div className="chatbot-input-row">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Quoi voir ce soir ?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Message pour CinéBot"
              maxLength={1200}
              disabled={loading}
            />
            <button
              className="chatbot-send"
              onClick={sendMessage}
              aria-label="Envoyer"
              disabled={loading || !input.trim()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        className="chatbot-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Fermer CinéBot' : 'Ouvrir CinéBot'}
        title="CinéBot — Assistant IA"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {open ? (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12c0-2.76 1.12-5.26 2.93-7.07L12 2z" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        )}
      </button>
    </>
  );
}
