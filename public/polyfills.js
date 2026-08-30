// Polyfills universels pour WebKit iOS 15.1 (Safari 15.1)
// Ce fichier est chargé AVANT React via <Script strategy="beforeInteractive">
// Chaque polyfill est isolé dans son propre try/catch pour éviter toute interruption

(function () {
  'use strict';

  // 1. Array.prototype.at
  try {
    if (typeof Array.prototype.at !== 'function') {
      Array.prototype.at = function (n) {
        n = Math.trunc(n) || 0;
        if (n < 0) n += this.length;
        if (n < 0 || n >= this.length) return undefined;
        return this[n];
      };
    }
  } catch (e) {}

  // 2. String.prototype.at
  try {
    if (typeof String.prototype.at !== 'function') {
      String.prototype.at = function (n) {
        n = Math.trunc(n) || 0;
        if (n < 0) n += this.length;
        if (n < 0 || n >= this.length) return undefined;
        return this[n];
      };
    }
  } catch (e) {}

  // 3. TypedArray.prototype.at
  try {
    var TypedArrayProto = Object.getPrototypeOf(Uint8Array).prototype;
    if (TypedArrayProto && typeof TypedArrayProto.at !== 'function') {
      TypedArrayProto.at = function (n) {
        n = Math.trunc(n) || 0;
        if (n < 0) n += this.length;
        if (n < 0 || n >= this.length) return undefined;
        return this[n];
      };
    }
  } catch (e) {}

  // 4. Object.hasOwn
  try {
    if (typeof Object.hasOwn !== 'function') {
      Object.hasOwn = function (o, p) {
        return Object.prototype.hasOwnProperty.call(o, p);
      };
    }
  } catch (e) {}

  // 5. Array.prototype.findLast
  try {
    if (typeof Array.prototype.findLast !== 'function') {
      Array.prototype.findLast = function (predicate, thisArg) {
        for (var i = this.length - 1; i >= 0; i--) {
          if (predicate.call(thisArg, this[i], i, this)) return this[i];
        }
        return undefined;
      };
    }
  } catch (e) {}

  // 6. Array.prototype.findLastIndex
  try {
    if (typeof Array.prototype.findLastIndex !== 'function') {
      Array.prototype.findLastIndex = function (predicate, thisArg) {
        for (var i = this.length - 1; i >= 0; i--) {
          if (predicate.call(thisArg, this[i], i, this)) return i;
        }
        return -1;
      };
    }
  } catch (e) {}

  // 7. Array.prototype.toReversed / toSorted / toSpliced / with
  try {
    if (typeof Array.prototype.toReversed !== 'function') {
      Array.prototype.toReversed = function () { return this.slice().reverse(); };
    }
  } catch (e) {}
  try {
    if (typeof Array.prototype.toSorted !== 'function') {
      Array.prototype.toSorted = function (fn) { return this.slice().sort(fn); };
    }
  } catch (e) {}
  try {
    if (typeof Array.prototype.toSpliced !== 'function') {
      Array.prototype.toSpliced = function () {
        var copy = this.slice();
        copy.splice.apply(copy, arguments);
        return copy;
      };
    }
  } catch (e) {}
  try {
    if (typeof Array.prototype.with !== 'function') {
      Array.prototype.with = function (index, value) {
        var n = Math.trunc(index) || 0;
        if (n < 0) n += this.length;
        var copy = this.slice();
        copy[n] = value;
        return copy;
      };
    }
  } catch (e) {}

  // 8. structuredClone
  try {
    if (typeof structuredClone !== 'function') {
      self.structuredClone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
      };
    }
  } catch (e) {}

  // 9. crypto.randomUUID — méthode sécurisée pour WebKit iOS 15.1
  try {
    var genUUID = function () {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        try {
          var buf = new Uint8Array(16);
          crypto.getRandomValues(buf);
          buf[6] = (buf[6] & 0x0f) | 0x40;
          buf[8] = (buf[8] & 0x3f) | 0x80;
          var s = '';
          for (var k = 0; k < 16; k++) {
            var h = buf[k].toString(16);
            if (h.length === 1) h = '0' + h;
            s += h;
            if (k === 3 || k === 5 || k === 7 || k === 9) s += '-';
          }
          return s;
        } catch (e) {}
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    };

    if (typeof Crypto !== 'undefined' && Crypto.prototype && typeof Crypto.prototype.randomUUID !== 'function') {
      try {
        Object.defineProperty(Crypto.prototype, 'randomUUID', { value: genUUID, writable: true, configurable: true });
      } catch (e) {}
    }
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
      try { crypto.randomUUID = genUUID; } catch (e) {
        try {
          Object.defineProperty(crypto, 'randomUUID', { value: genUUID, writable: true, configurable: true });
        } catch (e2) {}
      }
    }
  } catch (e) {}

  // 10. requestIdleCallback
  try {
    if (typeof requestIdleCallback !== 'function') {
      self.requestIdleCallback = function (cb) {
        var t = Date.now();
        return setTimeout(function () {
          cb({ didTimeout: false, timeRemaining: function () { return Math.max(0, 50 - (Date.now() - t)); } });
        }, 1);
      };
      self.cancelIdleCallback = function (id) { clearTimeout(id); };
    }
  } catch (e) {}

  // 11. Promise.withResolvers (React 19 l'utilise dans certains builds)
  try {
    if (typeof Promise.withResolvers !== 'function') {
      Promise.withResolvers = function () {
        var resolve, reject;
        var promise = new Promise(function (res, rej) {
          resolve = res;
          reject = rej;
        });
        return { promise: promise, resolve: resolve, reject: reject };
      };
    }
  } catch (e) {}

  // 12. MediaQueryList.addEventListener fallback (WebKit < 14)
  try {
    var mql = window.matchMedia && window.matchMedia('(min-width:0px)');
    if (mql) {
      var proto = Object.getPrototypeOf(mql);
      if (proto && typeof proto.addEventListener !== 'function' && typeof proto.addListener === 'function') {
        proto.addEventListener = function (t, fn) { if (t === 'change') this.addListener(fn); };
        proto.removeEventListener = function (t, fn) { if (t === 'change') this.removeListener(fn); };
      }
    }
  } catch (e) {}
})();
