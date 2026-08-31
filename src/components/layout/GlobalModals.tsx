// src/components/layout/GlobalModals.tsx
'use client';

import React from 'react';
import { ChatBot } from '@/components/ui/ChatBot';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { FEATURES } from '@/lib/features';

export function GlobalModals() {
  return (
    <>
      {FEATURES.enableCineBot && <ChatBot />}
      <SettingsModal />
    </>
  );
}
