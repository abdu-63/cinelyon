// src/app/suggestions/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { InstagramIcon } from '@/components/ui/InstagramIcon';

export default function SuggestionsPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Fil d'Ariane */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Retour aux séances</span>
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <MessageSquare className="text-[#4f5af6]" size={28} />
          <span>Suggestions & Contact</span>
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Tu as remarqué une erreur dans les horaires, un film manquant, ou tu as une idée pour enrichir CinéLyon ?
          Partage-la avec nous !
        </p>
      </div>

      <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl">
        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Merci pour ton retour !</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Ton message a bien été transmis. Nous l&apos;étudierons rapidement pour continuer d&apos;améliorer CinéLyon.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-5"
          >
            <div>
              <label htmlFor="sugg-type" className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Type de message
              </label>
              <select
                id="sugg-type"
                name="type"
                required
                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-[#4f5af6]"
              >
                <option value="erreur">Erreur dans les horaires ou une salle</option>
                <option value="film-manquant">Film ou séance manquante</option>
                <option value="suggestion">Suggestion d&apos;amélioration ou de fonctionnalité</option>
                <option value="autre">Autre remarque</option>
              </select>
            </div>

            <div>
              <label htmlFor="sugg-msg" className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Votre Message
              </label>
              <textarea
                id="sugg-msg"
                name="message"
                rows={5}
                required
                placeholder="Décrivez votre idée, le cinéma concerné, ou le problème rencontré..."
                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#4f5af6] resize-vertical"
              />
            </div>

            <div>
              <label htmlFor="sugg-email" className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Email (optionnel)
              </label>
              <input
                type="email"
                id="sugg-email"
                name="email"
                placeholder="Pour qu'on puisse vous répondre si besoin"
                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#4f5af6]"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-[#4f5af6] hover:bg-[#3339c4] text-white font-bold text-sm shadow-lg shadow-[#4f5af6]/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Send size={15} />
              <span>Envoyer le message</span>
            </button>
          </form>
        )}
      </div>

      <div className="p-5 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between text-xs text-neutral-400">
        <span>Vous pouvez aussi nous écrire directement sur Instagram</span>
        <a
          href="https://www.instagram.com/cinelyon.fr/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-white font-semibold hover:text-[#e1306c] transition-colors"
        >
          <InstagramIcon size={14} />
          <span>@cinelyon.fr</span>
        </a>
      </div>
    </div>
  );
}
