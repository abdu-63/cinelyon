// src/components/ui/ChatBot.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User, Film, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const STARTER_PROMPTS = [
  { icon: '🍿', text: 'Quoi voir ce soir à Lyon ?' },
  { icon: '🏛️', text: 'Pépites Art & Essai recommandées' },
  { icon: '⚡', text: 'Meilleurs thrillers et suspense' },
  { icon: '🎟️', text: 'Films projetés en VOSTFR' },
];

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      content:
        'Salut ! Je suis **CinéBot**, ton guide cinéphile lyonnais 🎬. Dis-moi quel genre de film tu cherches ou demande-moi des conseils sur les séances du jour !',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('cinelyon:open-cinebot', handleOpen);
    return () => window.removeEventListener('cinelyon:open-cinebot', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const botMsg: Message = {
        id: String(Date.now() + 1),
        role: 'bot',
        content: data.reply || 'Désolé, je rencontre une petite difficulté pour te répondre.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'bot',
          content: 'Oups, impossible de joindre le serveur. Réessaie dans un instant !',
          timestamp: new Date(),
        },
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
      {/* Floating Action Button (Exactement comme sur cinelyon-app screenshot) */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#444cf7] text-white shadow-xl shadow-[#444cf7]/40 hover:shadow-2xl flex items-center justify-center border border-white/20 transition-transform"
        aria-label="Discuter avec CinéBot"
      >
        <Sparkles size={22} className="text-white" />
      </motion.button>

      {/* Modal Chat */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-lg h-[600px] max-h-[88vh] liquid-glass rounded-3xl shadow-2xl border border-white/15 dark:border-white/10 flex flex-col z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/30 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#444cf7] to-[#8b5cf6] flex items-center justify-center text-white shadow-md">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>CinéBot Lyon</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h3>
                    <p className="text-[11px] text-neutral-400">Recommandations en temps réel</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setMessages([
                        {
                          id: 'welcome',
                          role: 'bot',
                          content: 'Conversation réinitialisée ! Que souhaites-tu savoir ? 🍿',
                          timestamp: new Date(),
                        },
                      ])
                    }
                    className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                    title="Effacer l'historique"
                  >
                    <RefreshCw size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                    aria-label="Fermer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-[#444cf7] text-white'
                          : 'bg-neutral-800 border border-white/15 text-violet-300'
                      }`}
                    >
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div
                      className={`max-w-[82%] px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-[#444cf7] text-white rounded-tr-none shadow-md'
                          : 'bg-white/10 dark:bg-neutral-900/80 border border-white/10 text-neutral-100 rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-neutral-400 text-xs py-2 px-3 bg-white/5 rounded-xl w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#444cf7] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#444cf7] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#444cf7] animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1">CinéBot réfléchit...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Starter Chips */}
              {messages.length <= 2 && (
                <div className="px-4 py-2 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
                  {STARTER_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendMessage(prompt.text)}
                      className="shrink-0 text-[11px] px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <span>{prompt.icon}</span>
                      <span>{prompt.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Input Bar */}
              <div className="p-3 bg-black/40 border-t border-white/10">
                <div className="flex items-center gap-2 bg-white/5 border border-white/15 rounded-2xl px-3 py-1.5 focus-within:border-[#444cf7] transition-colors">
                  <input
                    type="text"
                    placeholder="Pose ta question sur le cinéma à Lyon..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none py-1"
                  />
                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className={`p-2 rounded-xl transition-all ${
                      input.trim() && !loading
                        ? 'bg-[#444cf7] text-white hover:bg-[#3339c4]'
                        : 'text-neutral-600 cursor-not-allowed'
                    }`}
                    aria-label="Envoyer"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
