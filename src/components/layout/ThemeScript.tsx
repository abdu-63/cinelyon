// src/components/layout/ThemeScript.tsx
// Script inline pour polyfills universels (WebKit iOS 15.1) et prévention du flash de thème au chargement
// Server Component — rendu côté serveur en HTML

export function ThemeScript() {
  const script = `(function(){
    // 1. Polyfill Array.prototype.at & String.prototype.at & TypedArrays
    try {
      if (typeof Array.prototype.at !== 'function') {
        Array.prototype.at = function(n) {
          n = Math.trunc(n) || 0;
          if (n < 0) n += this.length;
          if (n < 0 || n >= this.length) return undefined;
          return this[n];
        };
      }
    } catch(e) {}

    try {
      if (typeof String.prototype.at !== 'function') {
        String.prototype.at = function(n) {
          n = Math.trunc(n) || 0;
          if (n < 0) n += this.length;
          if (n < 0 || n >= this.length) return undefined;
          return this[n];
        };
      }
    } catch(e) {}

    try {
      var typedArrays = [
        typeof Int8Array !== 'undefined' ? Int8Array : null,
        typeof Uint8Array !== 'undefined' ? Uint8Array : null,
        typeof Uint8ClampedArray !== 'undefined' ? Uint8ClampedArray : null,
        typeof Int16Array !== 'undefined' ? Int16Array : null,
        typeof Uint16Array !== 'undefined' ? Uint16Array : null,
        typeof Int32Array !== 'undefined' ? Int32Array : null,
        typeof Uint32Array !== 'undefined' ? Uint32Array : null,
        typeof Float32Array !== 'undefined' ? Float32Array : null,
        typeof Float64Array !== 'undefined' ? Float64Array : null
      ];
      for (var i = 0; i < typedArrays.length; i++) {
        var T = typedArrays[i];
        if (T && T.prototype && typeof T.prototype.at !== 'function') {
          T.prototype.at = function(n) {
            n = Math.trunc(n) || 0;
            if (n < 0) n += this.length;
            if (n < 0 || n >= this.length) return undefined;
            return this[n];
          };
        }
      }
    } catch(e) {}

    // 2. Polyfill Object.hasOwn
    try {
      if (typeof Object.hasOwn !== 'function') {
        Object.hasOwn = function(o, p) {
          return Object.prototype.hasOwnProperty.call(o, p);
        };
      }
    } catch(e) {}

    // 3. Polyfill Array.prototype.findLast & findLastIndex
    try {
      if (typeof Array.prototype.findLast !== 'function') {
        Array.prototype.findLast = function(predicate, thisArg) {
          for (var i = this.length - 1; i >= 0; i--) {
            if (predicate.call(thisArg, this[i], i, this)) return this[i];
          }
          return undefined;
        };
      }
    } catch(e) {}

    try {
      if (typeof Array.prototype.findLastIndex !== 'function') {
        Array.prototype.findLastIndex = function(predicate, thisArg) {
          for (var i = this.length - 1; i >= 0; i--) {
            if (predicate.call(thisArg, this[i], i, this)) return i;
          }
          return -1;
        };
      }
    } catch(e) {}

    // 4. Polyfill ES2023 Array methods: toReversed, toSorted, toSpliced, with
    try {
      if (typeof Array.prototype.toReversed !== 'function') {
        Array.prototype.toReversed = function() {
          return this.slice().reverse();
        };
      }
      if (typeof Array.prototype.toSorted !== 'function') {
        Array.prototype.toSorted = function(compareFn) {
          return this.slice().sort(compareFn);
        };
      }
      if (typeof Array.prototype.toSpliced !== 'function') {
        Array.prototype.toSpliced = function(start, deleteCount) {
          var copy = this.slice();
          var args = [start, deleteCount];
          for (var j = 2; j < arguments.length; j++) {
            args.push(arguments[j]);
          }
          copy.splice.apply(copy, args);
          return copy;
        };
      }
      if (typeof Array.prototype.with !== 'function') {
        Array.prototype.with = function(index, value) {
          var n = Math.trunc(index) || 0;
          if (n < 0) n += this.length;
          if (n < 0 || n >= this.length) throw new RangeError('Invalid index');
          var copy = this.slice();
          copy[n] = value;
          return copy;
        };
      }
    } catch(e) {}

    // 5. Polyfill crypto.randomUUID (Compatible WebKit iOS 15.1)
    try {
      var genUUID = function() {
        if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
          try {
            var buf = new Uint8Array(16);
            crypto.getRandomValues(buf);
            buf[6] = (buf[6] & 0x0f) | 0x40;
            buf[8] = (buf[8] & 0x3f) | 0x80;
            var s = '';
            for (var k = 0; k < 16; k++) {
              var hex = buf[k].toString(16);
              if (hex.length === 1) hex = '0' + hex;
              s += hex;
              if (k === 3 || k === 5 || k === 7 || k === 9) s += '-';
            }
            return s;
          } catch(e) {}
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (Math.random() * 16) | 0;
          var v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      if (typeof Crypto !== 'undefined' && Crypto.prototype && typeof Crypto.prototype.randomUUID !== 'function') {
        try {
          Object.defineProperty(Crypto.prototype, 'randomUUID', {
            value: genUUID,
            writable: true,
            configurable: true,
            enumerable: false
          });
        } catch(e) {}
      }

      if (typeof window !== 'undefined') {
        if (!window.crypto) {
          try {
            window.crypto = { randomUUID: genUUID };
          } catch(e) {}
        } else if (typeof window.crypto.randomUUID !== 'function') {
          try {
            window.crypto.randomUUID = genUUID;
          } catch(e) {
            try {
              Object.defineProperty(window.crypto, 'randomUUID', {
                value: genUUID,
                writable: true,
                configurable: true,
                enumerable: false
              });
            } catch(e2) {}
          }
        }
      }
    } catch(e) {}

    // 6. Polyfill structuredClone
    try {
      if (typeof window !== 'undefined' && typeof window.structuredClone !== 'function') {
        window.structuredClone = function(obj) {
          if (obj === undefined) return undefined;
          return JSON.parse(JSON.stringify(obj));
        };
      }
    } catch(e) {}

    // 7. Polyfill requestIdleCallback
    try {
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback !== 'function') {
        window.requestIdleCallback = function(cb) {
          var start = Date.now();
          return setTimeout(function() {
            cb({
              didTimeout: false,
              timeRemaining: function() {
                return Math.max(0, 50 - (Date.now() - start));
              }
            });
          }, 1);
        };
        window.cancelIdleCallback = function(id) {
          clearTimeout(id);
        };
      }
    } catch(e) {}

    // 8. Polyfill Promise.withResolvers (React 19 / ES2024)
    try {
      if (typeof Promise.withResolvers !== 'function') {
        Promise.withResolvers = function() {
          var resolve, reject;
          var promise = new Promise(function(res, rej) {
            resolve = res;
            reject = rej;
          });
          return { promise: promise, resolve: resolve, reject: reject };
        };
      }
    } catch(e) {}

    // 9. MediaQueryList addEventListener fallback pour anciens WebKit
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        var mqlProto = Object.getPrototypeOf(window.matchMedia('(min-width: 0px)'));
        if (mqlProto && typeof mqlProto.addEventListener !== 'function' && typeof mqlProto.addListener === 'function') {
          mqlProto.addEventListener = function(type, listener) {
            if (type === 'change') this.addListener(listener);
          };
          mqlProto.removeEventListener = function(type, listener) {
            if (type === 'change') this.removeListener(listener);
          };
        }
      }
    } catch(e) {}

    // 10. Initialisation du thème sans flash (FOUC)
    try {
      var t = localStorage.getItem('cinelyon_theme_mode');
      var p = localStorage.getItem('cinelyon_theme_primary') || 'violet';
      var isDark = t === 'dark' || (t === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches);
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
      id="cinelyon-legacy-polyfills"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
