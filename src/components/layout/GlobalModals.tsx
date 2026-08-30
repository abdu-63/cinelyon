// src/components/layout/GlobalModals.tsx
'use client';

import React from 'react';
import { ChatBot } from '@/components/ui/ChatBot';
import { SettingsModal } from '@/components/ui/SettingsModal';

export function GlobalModals() {
  return (
    <>
      <ChatBot />
      <SettingsModal />
    </>
  );
}
