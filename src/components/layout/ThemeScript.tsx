// src/components/layout/ThemeScript.tsx
// Script inline pour polyfills essentiels (WebKit iOS 15.1) et prévention du flash de thème au chargement
// Server Component — rendu côté serveur en HTML, pas de 'use client'

export function ThemeScript() {
  const script = `(function(){
    try {
      if (typeof Array.prototype.at !== 'function') {
        Array.prototype.at = function(n) {
          n = Math.trunc(n) || 0;
          if (n < 0) n += this.length;
          if (n < 0 || n >= this.length) return undefined;
          return this[n];
        };
      }
      if (typeof String.prototype.at !== 'function') {
        String.prototype.at = function(n) {
          n = Math.trunc(n) || 0;
          if (n < 0) n += this.length;
          if (n < 0 || n >= this.length) return undefined;
          return this[n];
        };
      }
      if (typeof Object.hasOwn !== 'function') {
        Object.hasOwn = function(o, p) {
          return Object.prototype.hasOwnProperty.call(o, p);
        };
      }
      if (typeof Array.prototype.findLast !== 'function') {
        Array.prototype.findLast = function(predicate, thisArg) {
          for (var i = this.length - 1; i >= 0; i--) {
            if (predicate.call(thisArg, this[i], i, this)) return this[i];
          }
          return undefined;
        };
      }
      if (typeof Array.prototype.findLastIndex !== 'function') {
        Array.prototype.findLastIndex = function(predicate, thisArg) {
          for (var i = this.length - 1; i >= 0; i--) {
            if (predicate.call(thisArg, this[i], i, this)) return i;
          }
          return -1;
        };
      }
      if (typeof window !== 'undefined' && (!window.crypto || typeof window.crypto.randomUUID !== 'function')) {
        if (!window.crypto) window.crypto = {};
        window.crypto.randomUUID = function() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (Math.random() * 16) | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };
      }
      if (typeof window !== 'undefined' && typeof window.structuredClone !== 'function') {
        window.structuredClone = function(obj) {
          return JSON.parse(JSON.stringify(obj));
        };
      }
    } catch (err) {}

    try {
      var t = localStorage.getItem('cinelyon_theme_mode');
      var p = localStorage.getItem('cinelyon_theme_primary') || 'violet';
      var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme:dark)').matches);
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
      }
      document.documentElement.setAttribute('data-primary', p);
    } catch(e) {}
  })();`;

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}



