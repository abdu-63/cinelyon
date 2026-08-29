// src/components/ui/ChatBot.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowUp, Trash2, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const SUGGESTION_CARDS = [
  { icon: '🍿', title: 'Ce soir à Lyon', desc: 'Les pépites et séances...', query: 'Quels sont les meilleurs films à voir ce soir à Lyon ?' },
  { icon: '🏛️', title: 'Art & Essai', desc: 'Comoedia, Lumière, etc.', query: 'Quels films Art et Essai passent actuellement au Comoedia ou aux cinémas Lumière ?' },
  { icon: '⚡', title: 'Suspense & Frissons', desc: 'Thrillers et polars pren...', query: 'Recommande-moi des thrillers ou films à suspense à l\'affiche à Lyon.' },
  { icon: '🎟️', title: 'Films en VOSTFR', desc: 'Séances en version orig...', query: 'Quelles sont les séances en VOSTFR aujourd\'hui à Lyon ?' },
];

const QUICK_PROMPTS = [
  { icon: '🍿', text: 'Quoi voir ce soir ?', query: 'Quoi voir ce soir au cinéma à Lyon ?' },
  { icon: '🏛️', text: 'Pépites Art & Essai', query: 'Donne-moi les pépites Art et Essai à l\'affiche.' },
  { icon: '⚡', text: 'Suspense & Frissons', query: 'Quels thrillers sont à l\'affiche ?' },
  { icon: '🎟️', text: 'Séances VOST', query: 'Quelles sont les séances en VOSTFR ?' },
];

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: 'Bonjour ! Je suis **CinéBot** 🍿, ton assistant IA cinéma à Lyon. Que souhaites-tu regarder ou savoir aujourd\'hui ?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        content: data.reply || "Désolé, je n'ai pas pu récupérer les séances pour le moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'bot',
          content: 'Une erreur réseau est survenue. Réessaie dans quelques instants.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        content: 'Bonjour ! Je suis **CinéBot** 🍿, ton assistant IA cinéma à Lyon. Que souhaites-tu regarder ou savoir aujourd\'hui ?',
        timestamp: new Date(),
      },
    ]);
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

      {/* Modal Chat Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg h-[640px] max-h-[90vh] bg-white dark:bg-[#1c1c1e] rounded-[28px] shadow-2xl border border-black/10 dark:border-white/10 z-10 flex flex-col overflow-hidden my-auto"
            >
              {/* Header */}
              <div className="p-4 border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#444cf7] text-white flex items-center justify-center shadow-sm">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">CinéBot</h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      <span>Assistant IA • En direct</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/20 transition-colors"
                    title="Effacer l'historique"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-white/20 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Contenu Messages & Suggestions */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Hero CinéBot IA si aucun message utilisateur */}
                {messages.length <= 1 && (
                  <div className="text-center space-y-3 pt-2 pb-2">
                    <div className="w-16 h-16 rounded-full bg-[#444cf7] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#444cf7]/25">
                      <Sparkles size={28} />
                    </div>
                    <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
                      CinéBot IA
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                      Votre assistant cinéma à Lyon. Posez une question, cherchez une séance ou laissez-vous guider.
                    </p>

                    {/* Grille 2x2 des 4 Cartes de Suggestions */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 text-left">
                      {SUGGESTION_CARDS.map((card, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => sendMessage(card.query)}
                          className="p-3.5 rounded-[20px] bg-neutral-50 dark:bg-[#242428] border border-black/[0.06] dark:border-white/10 hover:border-[#444cf7] transition-all text-left shadow-sm group"
                        >
                          <span className="text-xl block mb-1">{card.icon}</span>
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-[#444cf7] transition-colors">
                            {card.title}
                          </h4>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                            {card.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages conversation */}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2 ${
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {m.role === 'bot' && (
                      <div className="w-7 h-7 rounded-full bg-[#444cf7] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={13} />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] px-4 py-3 rounded-[20px] text-xs sm:text-sm leading-relaxed shadow-sm ${
                        m.role === 'user'
                          ? 'bg-[#444cf7] text-white rounded-br-none'
                          : 'bg-neutral-100 dark:bg-[#242428] text-neutral-900 dark:text-white rounded-bl-none border border-transparent dark:border-white/5'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#444cf7] text-white flex items-center justify-center shrink-0">
                      <Sparkles size={13} />
                    </div>
                    <div className="px-4 py-3 rounded-[20px] bg-neutral-100 dark:bg-[#242428] text-neutral-500 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Pilules Rapides au dessus de l'input */}
              <div className="px-3 pt-1 pb-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-black/[0.04] dark:border-white/5">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(p.query)}
                    className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-[#242428] hover:bg-neutral-200 dark:hover:bg-white/10 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 shrink-0 border border-black/[0.04] dark:border-white/5 transition-colors"
                  >
                    <span>{p.icon}</span>
                    <span>{p.text}</span>
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-neutral-50/80 dark:bg-[#161618] border-t border-black/[0.06] dark:border-white/10">
                <div className="flex items-center gap-2 bg-white dark:bg-[#242428] border border-black/[0.08] dark:border-white/10 rounded-full px-3.5 py-1.5 shadow-sm focus-within:border-[#444cf7]">
                  <input
                    type="text"
                    placeholder="Poser une question à CinéBot..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none py-1"
                  />
                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      input.trim() && !loading
                        ? 'bg-[#444cf7] text-white shadow-sm hover:scale-105'
                        : 'bg-neutral-200 dark:bg-white/10 text-neutral-400 cursor-not-allowed'
                    }`}
                    aria-label="Envoyer"
                  >
                    <ArrowUp size={16} />
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
