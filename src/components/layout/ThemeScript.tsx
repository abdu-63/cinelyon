// src/components/layout/ThemeScript.tsx
// Script inline pour éviter le flash de thème au chargement
// Server Component — rendu côté serveur en HTML, pas de 'use client'

export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem('cinelyon-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})();`;
  // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}

