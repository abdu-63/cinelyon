// src/components/layout/ThemeScript.tsx
// Script inline pour éviter le flash de thème au chargement
// Server Component — rendu côté serveur en HTML, pas de 'use client'

export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem('cinelyon_theme_mode');var p=localStorage.getItem('cinelyon_theme_primary')||'violet';var isDark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(isDark){document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.add('dark');}else{document.documentElement.setAttribute('data-theme','light');document.documentElement.classList.remove('dark');}document.documentElement.setAttribute('data-primary',p);}catch(e){}})();`;
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}


