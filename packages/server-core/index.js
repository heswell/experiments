var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/pure-uuid/uuid.js
var require_uuid = __commonJS({
  "../../node_modules/pure-uuid/uuid.js"(exports, module) {
    (function(root, name, factory) {
      if (typeof define === "function" && typeof define.amd !== "undefined")
        define(function() {
          return factory(root);
        });
      else if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory(root);
        module.exports.default = module.exports;
      } else
        root[name] = factory(root);
    })(exports, "UUID", function() {
      var a2hs = function(bytes, begin, end, uppercase, str, pos) {
        var mkNum = function(num, uppercase2) {
          var base16 = num.toString(16);
          if (base16.length < 2)
            base16 = "0" + base16;
          if (uppercase2)
            base16 = base16.toUpperCase();
          return base16;
        };
        for (var i = begin; i <= end; i++)
          str[pos++] = mkNum(bytes[i], uppercase);
        return str;
      };
      var hs2a = function(str, begin, end, bytes, pos) {
        for (var i = begin; i <= end; i += 2)
          bytes[pos++] = parseInt(str.substr(i, 2), 16);
      };
      var z85_encoder = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#".split("");
      var z85_decoder = [
        0,
        68,
        0,
        84,
        83,
        82,
        72,
        0,
        75,
        76,
        70,
        65,
        0,
        63,
        62,
        69,
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        64,
        0,
        73,
        66,
        74,
        71,
        81,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        77,
        0,
        78,
        67,
        0,
        0,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        79,
        0,
        80,
        0,
        0
      ];
      var z85_encode = function(data, size) {
        if (size % 4 !== 0)
          throw new Error("z85_encode: invalid input length (multiple of 4 expected)");
        var str = "";
        var i = 0;
        var value = 0;
        while (i < size) {
          value = value * 256 + data[i++];
          if (i % 4 === 0) {
            var divisor = 85 * 85 * 85 * 85;
            while (divisor >= 1) {
              var idx = Math.floor(value / divisor) % 85;
              str += z85_encoder[idx];
              divisor /= 85;
            }
            value = 0;
          }
        }
        return str;
      };
      var z85_decode = function(str, dest) {
        var l = str.length;
        if (l % 5 !== 0)
          throw new Error("z85_decode: invalid input length (multiple of 5 expected)");
        if (typeof dest === "undefined")
          dest = new Array(l * 4 / 5);
        var i = 0;
        var j = 0;
        var value = 0;
        while (i < l) {
          var idx = str.charCodeAt(i++) - 32;
          if (idx < 0 || idx >= z85_decoder.length)
            break;
          value = value * 85 + z85_decoder[idx];
          if (i % 5 === 0) {
            var divisor = 256 * 256 * 256;
            while (divisor >= 1) {
              dest[j++] = Math.trunc(value / divisor % 256);
              divisor /= 256;
            }
            value = 0;
          }
        }
        return dest;
      };
      var s2a = function(s, _options) {
        var options = { ibits: 8, obits: 8, obigendian: true };
        for (var opt in _options)
          if (typeof options[opt] !== "undefined")
            options[opt] = _options[opt];
        var a = [];
        var i = 0;
        var c, C;
        var ck = 0;
        var w;
        var wk = 0;
        var sl = s.length;
        for (; ; ) {
          if (ck === 0)
            C = s.charCodeAt(i++);
          c = C >> options.ibits - (ck + 8) & 255;
          ck = (ck + 8) % options.ibits;
          if (options.obigendian) {
            if (wk === 0)
              w = c << options.obits - 8;
            else
              w |= c << options.obits - 8 - wk;
          } else {
            if (wk === 0)
              w = c;
            else
              w |= c << wk;
          }
          wk = (wk + 8) % options.obits;
          if (wk === 0) {
            a.push(w);
            if (i >= sl)
              break;
          }
        }
        return a;
      };
      var a2s = function(a, _options) {
        var options = { ibits: 32, ibigendian: true };
        for (var opt in _options)
          if (typeof options[opt] !== "undefined")
            options[opt] = _options[opt];
        var s = "";
        var imask = 4294967295;
        if (options.ibits < 32)
          imask = (1 << options.ibits) - 1;
        var al = a.length;
        for (var i = 0; i < al; i++) {
          var w = a[i] & imask;
          for (var j = 0; j < options.ibits; j += 8) {
            if (options.ibigendian)
              s += String.fromCharCode(w >> options.ibits - 8 - j & 255);
            else
              s += String.fromCharCode(w >> j & 255);
          }
        }
        return s;
      };
      var UI64_DIGITS = 8;
      var UI64_DIGIT_BITS = 8;
      var UI64_DIGIT_BASE = 256;
      var ui64_d2i = function(d7, d6, d5, d4, d3, d2, d1, d0) {
        return [d0, d1, d2, d3, d4, d5, d6, d7];
      };
      var ui64_zero = function() {
        return ui64_d2i(0, 0, 0, 0, 0, 0, 0, 0);
      };
      var ui64_clone = function(x) {
        return x.slice(0);
      };
      var ui64_n2i = function(n) {
        var ui64 = ui64_zero();
        for (var i = 0; i < UI64_DIGITS; i++) {
          ui64[i] = Math.floor(n % UI64_DIGIT_BASE);
          n /= UI64_DIGIT_BASE;
        }
        return ui64;
      };
      var ui64_i2n = function(x) {
        var n = 0;
        for (var i = UI64_DIGITS - 1; i >= 0; i--) {
          n *= UI64_DIGIT_BASE;
          n += x[i];
        }
        return Math.floor(n);
      };
      var ui64_add = function(x, y) {
        var carry = 0;
        for (var i = 0; i < UI64_DIGITS; i++) {
          carry += x[i] + y[i];
          x[i] = Math.floor(carry % UI64_DIGIT_BASE);
          carry = Math.floor(carry / UI64_DIGIT_BASE);
        }
        return carry;
      };
      var ui64_muln = function(x, n) {
        var carry = 0;
        for (var i = 0; i < UI64_DIGITS; i++) {
          carry += x[i] * n;
          x[i] = Math.floor(carry % UI64_DIGIT_BASE);
          carry = Math.floor(carry / UI64_DIGIT_BASE);
        }
        return carry;
      };
      var ui64_mul = function(x, y) {
        var i, j;
        var zx = new Array(UI64_DIGITS + UI64_DIGITS);
        for (i = 0; i < UI64_DIGITS + UI64_DIGITS; i++)
          zx[i] = 0;
        var carry;
        for (i = 0; i < UI64_DIGITS; i++) {
          carry = 0;
          for (j = 0; j < UI64_DIGITS; j++) {
            carry += x[i] * y[j] + zx[i + j];
            zx[i + j] = carry % UI64_DIGIT_BASE;
            carry /= UI64_DIGIT_BASE;
          }
          for (; j < UI64_DIGITS + UI64_DIGITS - i; j++) {
            carry += zx[i + j];
            zx[i + j] = carry % UI64_DIGIT_BASE;
            carry /= UI64_DIGIT_BASE;
          }
        }
        for (i = 0; i < UI64_DIGITS; i++)
          x[i] = zx[i];
        return zx.slice(UI64_DIGITS, UI64_DIGITS);
      };
      var ui64_and = function(x, y) {
        for (var i = 0; i < UI64_DIGITS; i++)
          x[i] &= y[i];
        return x;
      };
      var ui64_or = function(x, y) {
        for (var i = 0; i < UI64_DIGITS; i++)
          x[i] |= y[i];
        return x;
      };
      var ui64_rorn = function(x, s) {
        var ov = ui64_zero();
        if (s % UI64_DIGIT_BITS !== 0)
          throw new Error("ui64_rorn: only bit rotations supported with a multiple of digit bits");
        var k = Math.floor(s / UI64_DIGIT_BITS);
        for (var i = 0; i < k; i++) {
          for (var j = UI64_DIGITS - 1 - 1; j >= 0; j--)
            ov[j + 1] = ov[j];
          ov[0] = x[0];
          for (j = 0; j < UI64_DIGITS - 1; j++)
            x[j] = x[j + 1];
          x[j] = 0;
        }
        return ui64_i2n(ov);
      };
      var ui64_ror = function(x, s) {
        if (s > UI64_DIGITS * UI64_DIGIT_BITS)
          throw new Error("ui64_ror: invalid number of bits to shift");
        var zx = new Array(UI64_DIGITS + UI64_DIGITS);
        var i;
        for (i = 0; i < UI64_DIGITS; i++) {
          zx[i + UI64_DIGITS] = x[i];
          zx[i] = 0;
        }
        var k1 = Math.floor(s / UI64_DIGIT_BITS);
        var k2 = s % UI64_DIGIT_BITS;
        for (i = k1; i < UI64_DIGITS + UI64_DIGITS - 1; i++) {
          zx[i - k1] = (zx[i] >>> k2 | zx[i + 1] << UI64_DIGIT_BITS - k2) & (1 << UI64_DIGIT_BITS) - 1;
        }
        zx[UI64_DIGITS + UI64_DIGITS - 1 - k1] = zx[UI64_DIGITS + UI64_DIGITS - 1] >>> k2 & (1 << UI64_DIGIT_BITS) - 1;
        for (i = UI64_DIGITS + UI64_DIGITS - 1 - k1 + 1; i < UI64_DIGITS + UI64_DIGITS; i++)
          zx[i] = 0;
        for (i = 0; i < UI64_DIGITS; i++)
          x[i] = zx[i + UI64_DIGITS];
        return zx.slice(0, UI64_DIGITS);
      };
      var ui64_rol = function(x, s) {
        if (s > UI64_DIGITS * UI64_DIGIT_BITS)
          throw new Error("ui64_rol: invalid number of bits to shift");
        var zx = new Array(UI64_DIGITS + UI64_DIGITS);
        var i;
        for (i = 0; i < UI64_DIGITS; i++) {
          zx[i + UI64_DIGITS] = 0;
          zx[i] = x[i];
        }
        var k1 = Math.floor(s / UI64_DIGIT_BITS);
        var k2 = s % UI64_DIGIT_BITS;
        for (i = UI64_DIGITS - 1 - k1; i > 0; i--) {
          zx[i + k1] = (zx[i] << k2 | zx[i - 1] >>> UI64_DIGIT_BITS - k2) & (1 << UI64_DIGIT_BITS) - 1;
        }
        zx[0 + k1] = zx[0] << k2 & (1 << UI64_DIGIT_BITS) - 1;
        for (i = 0 + k1 - 1; i >= 0; i--)
          zx[i] = 0;
        for (i = 0; i < UI64_DIGITS; i++)
          x[i] = zx[i];
        return zx.slice(UI64_DIGITS, UI64_DIGITS);
      };
      var ui64_xor = function(x, y) {
        for (var i = 0; i < UI64_DIGITS; i++)
          x[i] ^= y[i];
      };
      var ui32_add = function(x, y) {
        var lsw = (x & 65535) + (y & 65535);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return msw << 16 | lsw & 65535;
      };
      var ui32_rol = function(num, cnt) {
        return num << cnt & 4294967295 | num >>> 32 - cnt & 4294967295;
      };
      var sha1_core = function(x, len) {
        function sha1_ft(t2, b2, c2, d2) {
          if (t2 < 20)
            return b2 & c2 | ~b2 & d2;
          if (t2 < 40)
            return b2 ^ c2 ^ d2;
          if (t2 < 60)
            return b2 & c2 | b2 & d2 | c2 & d2;
          return b2 ^ c2 ^ d2;
        }
        function sha1_kt(t2) {
          return t2 < 20 ? 1518500249 : t2 < 40 ? 1859775393 : t2 < 60 ? -1894007588 : -899497514;
        }
        x[len >> 5] |= 128 << 24 - len % 32;
        x[(len + 64 >> 9 << 4) + 15] = len;
        var w = Array(80);
        var a = 1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d = 271733878;
        var e = -1009589776;
        for (var i = 0; i < x.length; i += 16) {
          var olda = a;
          var oldb = b;
          var oldc = c;
          var oldd = d;
          var olde = e;
          for (var j = 0; j < 80; j++) {
            if (j < 16)
              w[j] = x[i + j];
            else
              w[j] = ui32_rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
            var t = ui32_add(
              ui32_add(ui32_rol(a, 5), sha1_ft(j, b, c, d)),
              ui32_add(ui32_add(e, w[j]), sha1_kt(j))
            );
            e = d;
            d = c;
            c = ui32_rol(b, 30);
            b = a;
            a = t;
          }
          a = ui32_add(a, olda);
          b = ui32_add(b, oldb);
          c = ui32_add(c, oldc);
          d = ui32_add(d, oldd);
          e = ui32_add(e, olde);
        }
        return [a, b, c, d, e];
      };
      var sha1 = function(s) {
        return a2s(
          sha1_core(
            s2a(s, { ibits: 8, obits: 32, obigendian: true }),
            s.length * 8
          ),
          { ibits: 32, ibigendian: true }
        );
      };
      var md5_core = function(x, len) {
        function md5_cmn(q, a2, b2, x2, s, t) {
          return ui32_add(ui32_rol(ui32_add(ui32_add(a2, q), ui32_add(x2, t)), s), b2);
        }
        function md5_ff(a2, b2, c2, d2, x2, s, t) {
          return md5_cmn(b2 & c2 | ~b2 & d2, a2, b2, x2, s, t);
        }
        function md5_gg(a2, b2, c2, d2, x2, s, t) {
          return md5_cmn(b2 & d2 | c2 & ~d2, a2, b2, x2, s, t);
        }
        function md5_hh(a2, b2, c2, d2, x2, s, t) {
          return md5_cmn(b2 ^ c2 ^ d2, a2, b2, x2, s, t);
        }
        function md5_ii(a2, b2, c2, d2, x2, s, t) {
          return md5_cmn(c2 ^ (b2 | ~d2), a2, b2, x2, s, t);
        }
        x[len >> 5] |= 128 << len % 32;
        x[(len + 64 >>> 9 << 4) + 14] = len;
        var a = 1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d = 271733878;
        for (var i = 0; i < x.length; i += 16) {
          var olda = a;
          var oldb = b;
          var oldc = c;
          var oldd = d;
          a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
          d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
          c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
          b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
          a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
          d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
          c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
          b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
          a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
          d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
          c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
          b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
          a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
          d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
          c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
          b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);
          a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
          d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
          c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
          b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
          a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
          d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
          c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
          b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
          a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
          d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
          c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
          b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
          a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
          d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
          c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
          b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);
          a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
          d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
          c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
          b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
          a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
          d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
          c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
          b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
          a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
          d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
          c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
          b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
          a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
          d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
          c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
          b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);
          a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
          d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
          c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
          b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
          a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
          d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
          c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
          b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
          a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
          d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
          c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
          b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
          a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
          d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
          c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
          b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);
          a = ui32_add(a, olda);
          b = ui32_add(b, oldb);
          c = ui32_add(c, oldc);
          d = ui32_add(d, oldd);
        }
        return [a, b, c, d];
      };
      var md5 = function(s) {
        return a2s(
          md5_core(
            s2a(s, { ibits: 8, obits: 32, obigendian: false }),
            s.length * 8
          ),
          { ibits: 32, ibigendian: false }
        );
      };
      var PCG = function(seed) {
        this.mul = ui64_d2i(88, 81, 244, 45, 76, 149, 127, 45);
        this.inc = ui64_d2i(20, 5, 123, 126, 247, 103, 129, 79);
        this.mask = ui64_d2i(0, 0, 0, 0, 255, 255, 255, 255);
        this.state = ui64_clone(this.inc);
        this.next();
        ui64_and(this.state, this.mask);
        seed = ui64_n2i(seed !== void 0 ? seed >>> 0 : Math.random() * 4294967295 >>> 0);
        ui64_or(this.state, seed);
        this.next();
      };
      PCG.prototype.next = function() {
        var state = ui64_clone(this.state);
        ui64_mul(this.state, this.mul);
        ui64_add(this.state, this.inc);
        var output = ui64_clone(state);
        ui64_ror(output, 18);
        ui64_xor(output, state);
        ui64_ror(output, 27);
        var rot = ui64_clone(state);
        ui64_ror(rot, 59);
        ui64_and(output, this.mask);
        var k = ui64_i2n(rot);
        var output2 = ui64_clone(output);
        ui64_rol(output2, 32 - k);
        ui64_ror(output, k);
        ui64_xor(output, output2);
        return ui64_i2n(output);
      };
      var pcg = new PCG();
      var prng = function(len, radix) {
        var bytes = [];
        for (var i = 0; i < len; i++)
          bytes[i] = pcg.next() % radix;
        return bytes;
      };
      var time_last = 0;
      var time_seq = 0;
      var UUID2 = function() {
        if (arguments.length === 1 && typeof arguments[0] === "string")
          this.parse.apply(this, arguments);
        else if (arguments.length >= 1 && typeof arguments[0] === "number")
          this.make.apply(this, arguments);
        else if (arguments.length >= 1)
          throw new Error("UUID: constructor: invalid arguments");
        else
          for (var i = 0; i < 16; i++)
            this[i] = 0;
      };
      if (typeof Uint8Array !== "undefined")
        UUID2.prototype = new Uint8Array(16);
      else if (Buffer)
        UUID2.prototype = Buffer.alloc(16);
      else
        UUID2.prototype = new Array(16);
      UUID2.prototype.constructor = UUID2;
      UUID2.prototype.make = function(version) {
        var i;
        var uuid2 = this;
        if (version === 1) {
          var date = new Date();
          var time_now = date.getTime();
          if (time_now !== time_last)
            time_seq = 0;
          else
            time_seq++;
          time_last = time_now;
          var t = ui64_n2i(time_now);
          ui64_muln(t, 1e3 * 10);
          ui64_add(t, ui64_d2i(1, 178, 29, 210, 19, 129, 64, 0));
          if (time_seq > 0)
            ui64_add(t, ui64_n2i(time_seq));
          var ov;
          ov = ui64_rorn(t, 8);
          uuid2[3] = ov & 255;
          ov = ui64_rorn(t, 8);
          uuid2[2] = ov & 255;
          ov = ui64_rorn(t, 8);
          uuid2[1] = ov & 255;
          ov = ui64_rorn(t, 8);
          uuid2[0] = ov & 255;
          ov = ui64_rorn(t, 8);
          uuid2[5] = ov & 255;
          ov = ui64_rorn(t, 8);
          uuid2[4] = ov & 255;
          ov = ui64_rorn(t, 8);
          uuid2[7] = ov & 255;
          ov = ui64_rorn(t, 8);
          uuid2[6] = ov & 15;
          var clock = prng(2, 255);
          uuid2[8] = clock[0];
          uuid2[9] = clock[1];
          var node = prng(6, 255);
          node[0] |= 1;
          node[0] |= 2;
          for (i = 0; i < 6; i++)
            uuid2[10 + i] = node[i];
        } else if (version === 4) {
          var data = prng(16, 255);
          for (i = 0; i < 16; i++)
            this[i] = data[i];
        } else if (version === 3 || version === 5) {
          var input = "";
          var nsUUID = typeof arguments[1] === "object" && arguments[1] instanceof UUID2 ? arguments[1] : new UUID2().parse(arguments[1]);
          for (i = 0; i < 16; i++)
            input += String.fromCharCode(nsUUID[i]);
          input += arguments[2];
          var s = version === 3 ? md5(input) : sha1(input);
          for (i = 0; i < 16; i++)
            uuid2[i] = s.charCodeAt(i);
        } else
          throw new Error("UUID: make: invalid version");
        uuid2[6] &= 15;
        uuid2[6] |= version << 4;
        uuid2[8] &= 63;
        uuid2[8] |= 2 << 6;
        return uuid2;
      };
      UUID2.prototype.format = function(type) {
        var str, arr;
        if (type === "z85")
          str = z85_encode(this, 16);
        else if (type === "b16") {
          arr = Array(32);
          a2hs(this, 0, 15, true, arr, 0);
          str = arr.join("");
        } else if (type === void 0 || type === "std") {
          arr = new Array(36);
          a2hs(this, 0, 3, false, arr, 0);
          arr[8] = "-";
          a2hs(this, 4, 5, false, arr, 9);
          arr[13] = "-";
          a2hs(this, 6, 7, false, arr, 14);
          arr[18] = "-";
          a2hs(this, 8, 9, false, arr, 19);
          arr[23] = "-";
          a2hs(this, 10, 15, false, arr, 24);
          str = arr.join("");
        }
        return str;
      };
      UUID2.prototype.toString = function(type) {
        return this.format(type);
      };
      UUID2.prototype.toJSON = function() {
        return this.format("std");
      };
      UUID2.prototype.parse = function(str, type) {
        if (typeof str !== "string")
          throw new Error("UUID: parse: invalid argument (type string expected)");
        if (type === "z85")
          z85_decode(str, this);
        else if (type === "b16")
          hs2a(str, 0, 35, this, 0);
        else if (type === void 0 || type === "std") {
          var map2 = {
            "nil": "00000000-0000-0000-0000-000000000000",
            "ns:DNS": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            "ns:URL": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
            "ns:OID": "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
            "ns:X500": "6ba7b814-9dad-11d1-80b4-00c04fd430c8"
          };
          if (map2[str] !== void 0)
            str = map2[str];
          else if (!str.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/))
            throw new Error('UUID: parse: invalid string representation (expected "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")');
          hs2a(str, 0, 7, this, 0);
          hs2a(str, 9, 12, this, 4);
          hs2a(str, 14, 17, this, 6);
          hs2a(str, 19, 22, this, 8);
          hs2a(str, 24, 35, this, 10);
        }
        return this;
      };
      UUID2.prototype.export = function() {
        var arr = Array(16);
        for (var i = 0; i < 16; i++)
          arr[i] = this[i];
        return arr;
      };
      UUID2.prototype.import = function(arr) {
        if (!(typeof arr === "object" && arr instanceof Array))
          throw new Error("UUID: import: invalid argument (type Array expected)");
        if (arr.length !== 16)
          throw new Error("UUID: import: invalid argument (Array of length 16 expected)");
        for (var i = 0; i < 16; i++) {
          if (typeof arr[i] !== "number")
            throw new Error("UUID: import: invalid array element #" + i + " (type Number expected)");
          if (!(isFinite(arr[i]) && Math.floor(arr[i]) === arr[i]))
            throw new Error("UUID: import: invalid array element #" + i + " (Number with integer value expected)");
          if (!(arr[i] >= 0 && arr[i] <= 255))
            throw new Error("UUID: import: invalid array element #" + i + " (Number with integer value in range 0...255 expected)");
          this[i] = arr[i];
        }
        return this;
      };
      UUID2.prototype.compare = function(other) {
        if (typeof other !== "object")
          throw new Error("UUID: compare: invalid argument (type UUID expected)");
        if (!(other instanceof UUID2))
          throw new Error("UUID: compare: invalid argument (type UUID expected)");
        for (var i = 0; i < 16; i++) {
          if (this[i] < other[i])
            return -1;
          else if (this[i] > other[i])
            return 1;
        }
        return 0;
      };
      UUID2.prototype.equal = function(other) {
        return this.compare(other) === 0;
      };
      UUID2.prototype.fold = function(k) {
        if (typeof k === "undefined")
          throw new Error("UUID: fold: invalid argument (number of fold operations expected)");
        if (k < 1 || k > 4)
          throw new Error("UUID: fold: invalid argument (1-4 fold operations expected)");
        var n = 16 / Math.pow(2, k);
        var hash = new Array(n);
        for (var i = 0; i < n; i++) {
          var h = 0;
          for (var j = 0; i + j < 16; j += n)
            h ^= this[i + j];
          hash[i] = h;
        }
        return hash;
      };
      UUID2.PCG = PCG;
      return UUID2;
    });
  }
});

// ../../node_modules/async-limiter/index.js
var require_async_limiter = __commonJS({
  "../../node_modules/async-limiter/index.js"(exports, module) {
    "use strict";
    function Queue(options) {
      if (!(this instanceof Queue)) {
        return new Queue(options);
      }
      options = options || {};
      this.concurrency = options.concurrency || Infinity;
      this.pending = 0;
      this.jobs = [];
      this.cbs = [];
      this._done = done.bind(this);
    }
    var arrayAddMethods = [
      "push",
      "unshift",
      "splice"
    ];
    arrayAddMethods.forEach(function(method) {
      Queue.prototype[method] = function() {
        var methodResult = Array.prototype[method].apply(this.jobs, arguments);
        this._run();
        return methodResult;
      };
    });
    Object.defineProperty(Queue.prototype, "length", {
      get: function() {
        return this.pending + this.jobs.length;
      }
    });
    Queue.prototype._run = function() {
      if (this.pending === this.concurrency) {
        return;
      }
      if (this.jobs.length) {
        var job = this.jobs.shift();
        this.pending++;
        job(this._done);
        this._run();
      }
      if (this.pending === 0) {
        while (this.cbs.length !== 0) {
          var cb = this.cbs.pop();
          process.nextTick(cb);
        }
      }
    };
    Queue.prototype.onDone = function(cb) {
      if (typeof cb === "function") {
        this.cbs.push(cb);
        this._run();
      }
    };
    function done() {
      this.pending--;
      this._run();
    }
    module.exports = Queue;
  }
});

// ../../node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "../../node_modules/ws/lib/constants.js"(exports, module) {
    "use strict";
    module.exports = {
      BINARY_TYPES: ["nodebuffer", "arraybuffer", "fragments"],
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      kStatusCode: Symbol("status-code"),
      kWebSocket: Symbol("websocket"),
      EMPTY_BUFFER: Buffer.alloc(0),
      NOOP: () => {
      }
    };
  }
});

// ../../node_modules/node-gyp-build/index.js
var require_node_gyp_build = __commonJS({
  "../../node_modules/node-gyp-build/index.js"(exports, module) {
    var fs = __require("fs");
    var path = __require("path");
    var os = __require("os");
    var runtimeRequire = typeof __webpack_require__ === "function" ? __non_webpack_require__ : __require;
    var vars = process.config && process.config.variables || {};
    var prebuildsOnly = !!process.env.PREBUILDS_ONLY;
    var abi = process.versions.modules;
    var runtime = isElectron() ? "electron" : isNwjs() ? "node-webkit" : "node";
    var arch = process.env.npm_config_arch || os.arch();
    var platform = process.env.npm_config_platform || os.platform();
    var libc = process.env.LIBC || (isAlpine(platform) ? "musl" : "glibc");
    var armv = process.env.ARM_VERSION || (arch === "arm64" ? "8" : vars.arm_version) || "";
    var uv = (process.versions.uv || "").split(".")[0];
    module.exports = load;
    function load(dir) {
      return runtimeRequire(load.path(dir));
    }
    load.path = function(dir) {
      dir = path.resolve(dir || ".");
      try {
        var name = runtimeRequire(path.join(dir, "package.json")).name.toUpperCase().replace(/-/g, "_");
        if (process.env[name + "_PREBUILD"])
          dir = process.env[name + "_PREBUILD"];
      } catch (err) {
      }
      if (!prebuildsOnly) {
        var release = getFirst(path.join(dir, "build/Release"), matchBuild);
        if (release)
          return release;
        var debug = getFirst(path.join(dir, "build/Debug"), matchBuild);
        if (debug)
          return debug;
      }
      var prebuild = resolve(dir);
      if (prebuild)
        return prebuild;
      var nearby = resolve(path.dirname(process.execPath));
      if (nearby)
        return nearby;
      var target = [
        "platform=" + platform,
        "arch=" + arch,
        "runtime=" + runtime,
        "abi=" + abi,
        "uv=" + uv,
        armv ? "armv=" + armv : "",
        "libc=" + libc,
        "node=" + process.versions.node,
        process.versions.electron ? "electron=" + process.versions.electron : "",
        typeof __webpack_require__ === "function" ? "webpack=true" : ""
      ].filter(Boolean).join(" ");
      throw new Error("No native build was found for " + target + "\n    loaded from: " + dir + "\n");
      function resolve(dir2) {
        var tuples = readdirSync(path.join(dir2, "prebuilds")).map(parseTuple);
        var tuple = tuples.filter(matchTuple(platform, arch)).sort(compareTuples)[0];
        if (!tuple)
          return;
        var prebuilds = path.join(dir2, "prebuilds", tuple.name);
        var parsed = readdirSync(prebuilds).map(parseTags);
        var candidates = parsed.filter(matchTags(runtime, abi));
        var winner = candidates.sort(compareTags(runtime))[0];
        if (winner)
          return path.join(prebuilds, winner.file);
      }
    };
    function readdirSync(dir) {
      try {
        return fs.readdirSync(dir);
      } catch (err) {
        return [];
      }
    }
    function getFirst(dir, filter) {
      var files = readdirSync(dir).filter(filter);
      return files[0] && path.join(dir, files[0]);
    }
    function matchBuild(name) {
      return /\.node$/.test(name);
    }
    function parseTuple(name) {
      var arr = name.split("-");
      if (arr.length !== 2)
        return;
      var platform2 = arr[0];
      var architectures = arr[1].split("+");
      if (!platform2)
        return;
      if (!architectures.length)
        return;
      if (!architectures.every(Boolean))
        return;
      return { name, platform: platform2, architectures };
    }
    function matchTuple(platform2, arch2) {
      return function(tuple) {
        if (tuple == null)
          return false;
        if (tuple.platform !== platform2)
          return false;
        return tuple.architectures.includes(arch2);
      };
    }
    function compareTuples(a, b) {
      return a.architectures.length - b.architectures.length;
    }
    function parseTags(file) {
      var arr = file.split(".");
      var extension = arr.pop();
      var tags = { file, specificity: 0 };
      if (extension !== "node")
        return;
      for (var i = 0; i < arr.length; i++) {
        var tag = arr[i];
        if (tag === "node" || tag === "electron" || tag === "node-webkit") {
          tags.runtime = tag;
        } else if (tag === "napi") {
          tags.napi = true;
        } else if (tag.slice(0, 3) === "abi") {
          tags.abi = tag.slice(3);
        } else if (tag.slice(0, 2) === "uv") {
          tags.uv = tag.slice(2);
        } else if (tag.slice(0, 4) === "armv") {
          tags.armv = tag.slice(4);
        } else if (tag === "glibc" || tag === "musl") {
          tags.libc = tag;
        } else {
          continue;
        }
        tags.specificity++;
      }
      return tags;
    }
    function matchTags(runtime2, abi2) {
      return function(tags) {
        if (tags == null)
          return false;
        if (tags.runtime !== runtime2 && !runtimeAgnostic(tags))
          return false;
        if (tags.abi !== abi2 && !tags.napi)
          return false;
        if (tags.uv && tags.uv !== uv)
          return false;
        if (tags.armv && tags.armv !== armv)
          return false;
        if (tags.libc && tags.libc !== libc)
          return false;
        return true;
      };
    }
    function runtimeAgnostic(tags) {
      return tags.runtime === "node" && tags.napi;
    }
    function compareTags(runtime2) {
      return function(a, b) {
        if (a.runtime !== b.runtime) {
          return a.runtime === runtime2 ? -1 : 1;
        } else if (a.abi !== b.abi) {
          return a.abi ? -1 : 1;
        } else if (a.specificity !== b.specificity) {
          return a.specificity > b.specificity ? -1 : 1;
        } else {
          return 0;
        }
      };
    }
    function isNwjs() {
      return !!(process.versions && process.versions.nw);
    }
    function isElectron() {
      if (process.versions && process.versions.electron)
        return true;
      if (process.env.ELECTRON_RUN_AS_NODE)
        return true;
      return typeof window !== "undefined" && window.process && window.process.type === "renderer";
    }
    function isAlpine(platform2) {
      return platform2 === "linux" && fs.existsSync("/etc/alpine-release");
    }
    load.parseTags = parseTags;
    load.matchTags = matchTags;
    load.compareTags = compareTags;
    load.parseTuple = parseTuple;
    load.matchTuple = matchTuple;
    load.compareTuples = compareTuples;
  }
});

// ../../node_modules/bufferutil/fallback.js
var require_fallback = __commonJS({
  "../../node_modules/bufferutil/fallback.js"(exports, module) {
    "use strict";
    var mask = (source, mask2, output, offset, length) => {
      for (var i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask2[i & 3];
      }
    };
    var unmask = (buffer, mask2) => {
      const length = buffer.length;
      for (var i = 0; i < length; i++) {
        buffer[i] ^= mask2[i & 3];
      }
    };
    module.exports = { mask, unmask };
  }
});

// ../../node_modules/bufferutil/index.js
var require_bufferutil = __commonJS({
  "../../node_modules/bufferutil/index.js"(exports, module) {
    "use strict";
    try {
      module.exports = require_node_gyp_build()(__dirname);
    } catch (e) {
      module.exports = require_fallback();
    }
  }
});

// ../../node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "../../node_modules/ws/lib/buffer-util.js"(exports, module) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    function concat(list, totalLength) {
      if (list.length === 0)
        return EMPTY_BUFFER;
      if (list.length === 1)
        return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      var offset = 0;
      for (var i = 0; i < list.length; i++) {
        const buf = list[i];
        buf.copy(target, offset);
        offset += buf.length;
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (var i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      const length = buffer.length;
      for (var i = 0; i < length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.byteLength === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data))
        return data;
      var buf;
      if (data instanceof ArrayBuffer) {
        buf = Buffer.from(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = viewToBuffer(data);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    function viewToBuffer(view) {
      const buf = Buffer.from(view.buffer);
      if (view.byteLength !== view.buffer.byteLength) {
        return buf.slice(view.byteOffset, view.byteOffset + view.byteLength);
      }
      return buf;
    }
    try {
      const bufferUtil = require_bufferutil();
      const bu = bufferUtil.BufferUtil || bufferUtil;
      module.exports = {
        concat,
        mask(source, mask, output, offset, length) {
          if (length < 48)
            _mask(source, mask, output, offset, length);
          else
            bu.mask(source, mask, output, offset, length);
        },
        toArrayBuffer,
        toBuffer,
        unmask(buffer, mask) {
          if (buffer.length < 32)
            _unmask(buffer, mask);
          else
            bu.unmask(buffer, mask);
        }
      };
    } catch (e) {
      module.exports = {
        concat,
        mask: _mask,
        toArrayBuffer,
        toBuffer,
        unmask: _unmask
      };
    }
  }
});

// ../../node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "../../node_modules/ws/lib/permessage-deflate.js"(exports, module) {
    "use strict";
    var Limiter = require_async_limiter();
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var { kStatusCode, NOOP } = require_constants();
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var EMPTY_BLOCK = Buffer.from([0]);
    var kPerMessageDeflate = Symbol("permessage-deflate");
    var kTotalLength = Symbol("total-length");
    var kCallback = Symbol("callback");
    var kBuffers = Symbol("buffers");
    var kError = Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate = class {
      constructor(options, isServer, maxPayload) {
        this._maxPayload = maxPayload | 0;
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._isServer = !!isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter({ concurrency });
        }
      }
      static get extensionName() {
        return "permessage-deflate";
      }
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          this._deflate.close();
          this._deflate = null;
        }
      }
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            var value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      decompress(data, fin, callback) {
        zlibLimiter.push((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      compress(data, fin, callback) {
        zlibLimiter.push((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw(
            Object.assign({}, this._options.zlibInflateOptions, { windowBits })
          );
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin)
          this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
          }
          callback(null, data2);
        });
      }
      _compress(data, fin, callback) {
        if (!data || data.length === 0) {
          process.nextTick(callback, null, EMPTY_BLOCK);
          return;
        }
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw(
            Object.assign({}, this._options.zlibDeflateOptions, { windowBits })
          );
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("error", NOOP);
          this._deflate.on("data", deflateOnData);
        }
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          var data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin)
            data2 = data2.slice(0, data2.length - 4);
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.close();
            this._deflate = null;
          } else {
            this._deflate[kTotalLength] = 0;
            this._deflate[kBuffers] = [];
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// ../../node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "../../node_modules/ws/lib/event-target.js"(exports, module) {
    "use strict";
    var Event = class {
      constructor(type, target) {
        this.target = target;
        this.type = type;
      }
    };
    var MessageEvent = class extends Event {
      constructor(data, target) {
        super("message", target);
        this.data = data;
      }
    };
    var CloseEvent = class extends Event {
      constructor(code, reason, target) {
        super("close", target);
        this.wasClean = target._closeFrameReceived && target._closeFrameSent;
        this.reason = reason;
        this.code = code;
      }
    };
    var OpenEvent = class extends Event {
      constructor(target) {
        super("open", target);
      }
    };
    var ErrorEvent = class extends Event {
      constructor(error, target) {
        super("error", target);
        this.message = error.message;
        this.error = error;
      }
    };
    var EventTarget = {
      addEventListener(method, listener) {
        if (typeof listener !== "function")
          return;
        function onMessage(data) {
          listener.call(this, new MessageEvent(data, this));
        }
        function onClose(code, message) {
          listener.call(this, new CloseEvent(code, message, this));
        }
        function onError(error) {
          listener.call(this, new ErrorEvent(error, this));
        }
        function onOpen() {
          listener.call(this, new OpenEvent(this));
        }
        if (method === "message") {
          onMessage._listener = listener;
          this.on(method, onMessage);
        } else if (method === "close") {
          onClose._listener = listener;
          this.on(method, onClose);
        } else if (method === "error") {
          onError._listener = listener;
          this.on(method, onError);
        } else if (method === "open") {
          onOpen._listener = listener;
          this.on(method, onOpen);
        } else {
          this.on(method, listener);
        }
      },
      removeEventListener(method, listener) {
        const listeners = this.listeners(method);
        for (var i = 0; i < listeners.length; i++) {
          if (listeners[i] === listener || listeners[i]._listener === listener) {
            this.removeListener(method, listeners[i]);
          }
        }
      }
    };
    module.exports = EventTarget;
  }
});

// ../../node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "../../node_modules/ws/lib/extension.js"(exports, module) {
    "use strict";
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
    ];
    function push(dest, name, elem) {
      if (Object.prototype.hasOwnProperty.call(dest, name))
        dest[name].push(elem);
      else
        dest[name] = [elem];
    }
    function parse(header) {
      const offers = {};
      if (header === void 0 || header === "")
        return offers;
      var params = {};
      var mustUnescape = false;
      var isEscaping = false;
      var inQuotes = false;
      var extensionName;
      var paramName;
      var start2 = -1;
      var end = -1;
      for (var i = 0; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start2 === -1)
              start2 = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start2 !== -1)
              end = i;
          } else if (code === 59 || code === 44) {
            if (start2 === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1)
              end = i;
            const name = header.slice(start2, end);
            if (code === 44) {
              push(offers, name, params);
              params = {};
            } else {
              extensionName = name;
            }
            start2 = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start2 === -1)
              start2 = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start2 !== -1)
              end = i;
          } else if (code === 59 || code === 44) {
            if (start2 === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1)
              end = i;
            push(params, header.slice(start2, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = {};
              extensionName = void 0;
            }
            start2 = end = -1;
          } else if (code === 61 && start2 !== -1 && end === -1) {
            paramName = header.slice(start2, i);
            start2 = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start2 === -1)
              start2 = i;
            else if (!mustUnescape)
              mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start2 === -1)
                start2 = i;
            } else if (code === 34 && start2 !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start2 === -1)
              start2 = i;
          } else if (start2 !== -1 && (code === 32 || code === 9)) {
            if (end === -1)
              end = i;
          } else if (code === 59 || code === 44) {
            if (start2 === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1)
              end = i;
            var value = header.slice(start2, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = {};
              extensionName = void 0;
            }
            paramName = void 0;
            start2 = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start2 === -1 || inQuotes) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1)
        end = i;
      const token = header.slice(start2, end);
      if (extensionName === void 0) {
        push(offers, token, {});
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension) => {
        var configurations = extensions[extension];
        if (!Array.isArray(configurations))
          configurations = [configurations];
        return configurations.map((params) => {
          return [extension].concat(
            Object.keys(params).map((k) => {
              var values = params[k];
              if (!Array.isArray(values))
                values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module.exports = { format, parse };
  }
});

// ../../node_modules/utf-8-validate/fallback.js
var require_fallback2 = __commonJS({
  "../../node_modules/utf-8-validate/fallback.js"(exports, module) {
    "use strict";
    function isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    module.exports = isValidUTF8;
  }
});

// ../../node_modules/utf-8-validate/index.js
var require_utf_8_validate = __commonJS({
  "../../node_modules/utf-8-validate/index.js"(exports, module) {
    "use strict";
    try {
      module.exports = require_node_gyp_build()(__dirname);
    } catch (e) {
      module.exports = require_fallback2();
    }
  }
});

// ../../node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "../../node_modules/ws/lib/validation.js"(exports) {
    "use strict";
    try {
      const isValidUTF8 = require_utf_8_validate();
      exports.isValidUTF8 = typeof isValidUTF8 === "object" ? isValidUTF8.Validation.isValidUTF8 : isValidUTF8;
    } catch (e) {
      exports.isValidUTF8 = () => true;
    }
    exports.isValidStatusCode = (code) => {
      return code >= 1e3 && code <= 1013 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    };
  }
});

// ../../node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "../../node_modules/ws/lib/receiver.js"(exports, module) {
    "use strict";
    var { Writable } = __require("stream");
    var PerMessageDeflate = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var Receiver = class extends Writable {
      constructor(binaryType, extensions, maxPayload) {
        super();
        this._binaryType = binaryType || BINARY_TYPES[0];
        this[kWebSocket] = void 0;
        this._extensions = extensions || {};
        this._maxPayload = maxPayload | 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragments = [];
        this._state = GET_INFO;
        this._loop = false;
      }
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO)
          return cb();
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length)
          return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = buf.slice(n);
          return buf.slice(0, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          if (n >= buf.length) {
            this._buffers.shift().copy(dst, dst.length - n);
          } else {
            buf.copy(dst, dst.length - n, 0, n);
            this._buffers[0] = buf.slice(n);
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      startLoop(cb) {
        var err;
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              err = this.getInfo();
              break;
            case GET_PAYLOAD_LENGTH_16:
              err = this.getPayloadLength16();
              break;
            case GET_PAYLOAD_LENGTH_64:
              err = this.getPayloadLength64();
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              err = this.getData(cb);
              break;
            default:
              this._loop = false;
              return;
          }
        } while (this._loop);
        cb(err);
      }
      getInfo() {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          this._loop = false;
          return error(RangeError, "RSV2 and RSV3 must be clear", true, 1002);
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          this._loop = false;
          return error(RangeError, "RSV1 must be clear", true, 1002);
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            this._loop = false;
            return error(RangeError, "RSV1 must be clear", true, 1002);
          }
          if (!this._fragmented) {
            this._loop = false;
            return error(RangeError, "invalid opcode 0", true, 1002);
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            this._loop = false;
            return error(RangeError, `invalid opcode ${this._opcode}`, true, 1002);
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            this._loop = false;
            return error(RangeError, "FIN must be set", true, 1002);
          }
          if (compressed) {
            this._loop = false;
            return error(RangeError, "RSV1 must be clear", true, 1002);
          }
          if (this._payloadLength > 125) {
            this._loop = false;
            return error(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002
            );
          }
        } else {
          this._loop = false;
          return error(RangeError, `invalid opcode ${this._opcode}`, true, 1002);
        }
        if (!this._fin && !this._fragmented)
          this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._payloadLength === 126)
          this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127)
          this._state = GET_PAYLOAD_LENGTH_64;
        else
          return this.haveLength();
      }
      getPayloadLength16() {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        return this.haveLength();
      }
      getPayloadLength64() {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          this._loop = false;
          return error(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009
          );
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        return this.haveLength();
      }
      haveLength() {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            this._loop = false;
            return error(RangeError, "Max payload size exceeded", false, 1009);
          }
        }
        if (this._masked)
          this._state = GET_MASK;
        else
          this._state = GET_DATA;
      }
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      getData(cb) {
        var data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked)
            unmask(data, this._mask);
        }
        if (this._opcode > 7)
          return this.controlMessage(data);
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        return this.dataMessage();
      }
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err)
            return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              return cb(
                error(RangeError, "Max payload size exceeded", false, 1009)
              );
            }
            this._fragments.push(buf);
          }
          const er = this.dataMessage();
          if (er)
            return cb(er);
          this.startLoop(cb);
        });
      }
      dataMessage() {
        if (this._fin) {
          const messageLength = this._messageLength;
          const fragments = this._fragments;
          this._totalPayloadLength = 0;
          this._messageLength = 0;
          this._fragmented = 0;
          this._fragments = [];
          if (this._opcode === 2) {
            var data;
            if (this._binaryType === "nodebuffer") {
              data = concat(fragments, messageLength);
            } else if (this._binaryType === "arraybuffer") {
              data = toArrayBuffer(concat(fragments, messageLength));
            } else {
              data = fragments;
            }
            this.emit("message", data);
          } else {
            const buf = concat(fragments, messageLength);
            if (!isValidUTF8(buf)) {
              this._loop = false;
              return error(Error, "invalid UTF-8 sequence", true, 1007);
            }
            this.emit("message", buf.toString());
          }
        }
        this._state = GET_INFO;
      }
      controlMessage(data) {
        if (this._opcode === 8) {
          this._loop = false;
          if (data.length === 0) {
            this.emit("conclude", 1005, "");
            this.end();
          } else if (data.length === 1) {
            return error(RangeError, "invalid payload length 1", true, 1002);
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              return error(RangeError, `invalid status code ${code}`, true, 1002);
            }
            const buf = data.slice(2);
            if (!isValidUTF8(buf)) {
              return error(Error, "invalid UTF-8 sequence", true, 1007);
            }
            this.emit("conclude", code, buf.toString());
            this.end();
          }
        } else if (this._opcode === 9) {
          this.emit("ping", data);
        } else {
          this.emit("pong", data);
        }
        this._state = GET_INFO;
      }
    };
    module.exports = Receiver;
    function error(ErrorCtor, message, prefix, statusCode) {
      const err = new ErrorCtor(
        prefix ? `Invalid WebSocket frame: ${message}` : message
      );
      Error.captureStackTrace(err, error);
      err[kStatusCode] = statusCode;
      return err;
    }
  }
});

// ../../node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "../../node_modules/ws/lib/sender.js"(exports, module) {
    "use strict";
    var { randomBytes } = __require("crypto");
    var PerMessageDeflate = require_permessage_deflate();
    var { EMPTY_BUFFER } = require_constants();
    var { isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var Sender = class {
      constructor(socket, extensions) {
        this._extensions = extensions || {};
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._deflating = false;
        this._queue = [];
      }
      static frame(data, options) {
        const merge = options.mask && options.readOnly;
        var offset = options.mask ? 6 : 2;
        var payloadLength = data.length;
        if (data.length >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (data.length > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? data.length + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1)
          target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(data.length, 2);
        } else if (payloadLength === 127) {
          target.writeUInt32BE(0, 2);
          target.writeUInt32BE(data.length, 6);
        }
        if (!options.mask)
          return [target, data];
        const mask = randomBytes(4);
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (merge) {
          applyMask(data, mask, target, offset, data.length);
          return [target];
        }
        applyMask(data, mask, data, 0, data.length);
        return [target, data];
      }
      close(code, data, mask, cb) {
        var buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || data === "") {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          buf = Buffer.allocUnsafe(2 + Buffer.byteLength(data));
          buf.writeUInt16BE(code, 0);
          buf.write(data, 2);
        }
        if (this._deflating) {
          this.enqueue([this.doClose, buf, mask, cb]);
        } else {
          this.doClose(buf, mask, cb);
        }
      }
      doClose(data, mask, cb) {
        this.sendFrame(
          Sender.frame(data, {
            fin: true,
            rsv1: false,
            opcode: 8,
            mask,
            readOnly: false
          }),
          cb
        );
      }
      ping(data, mask, cb) {
        const buf = toBuffer(data);
        if (this._deflating) {
          this.enqueue([this.doPing, buf, mask, toBuffer.readOnly, cb]);
        } else {
          this.doPing(buf, mask, toBuffer.readOnly, cb);
        }
      }
      doPing(data, mask, readOnly, cb) {
        this.sendFrame(
          Sender.frame(data, {
            fin: true,
            rsv1: false,
            opcode: 9,
            mask,
            readOnly
          }),
          cb
        );
      }
      pong(data, mask, cb) {
        const buf = toBuffer(data);
        if (this._deflating) {
          this.enqueue([this.doPong, buf, mask, toBuffer.readOnly, cb]);
        } else {
          this.doPong(buf, mask, toBuffer.readOnly, cb);
        }
      }
      doPong(data, mask, readOnly, cb) {
        this.sendFrame(
          Sender.frame(data, {
            fin: true,
            rsv1: false,
            opcode: 10,
            mask,
            readOnly
          }),
          cb
        );
      }
      send(data, options, cb) {
        const buf = toBuffer(data);
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        var opcode = options.binary ? 2 : 1;
        var rsv1 = options.compress;
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate) {
            rsv1 = buf.length >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin)
          this._firstFragment = true;
        if (perMessageDeflate) {
          const opts = {
            fin: options.fin,
            rsv1,
            opcode,
            mask: options.mask,
            readOnly: toBuffer.readOnly
          };
          if (this._deflating) {
            this.enqueue([this.dispatch, buf, this._compress, opts, cb]);
          } else {
            this.dispatch(buf, this._compress, opts, cb);
          }
        } else {
          this.sendFrame(
            Sender.frame(buf, {
              fin: options.fin,
              rsv1: false,
              opcode,
              mask: options.mask,
              readOnly: toBuffer.readOnly
            }),
            cb
          );
        }
      }
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        this._deflating = true;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          this._deflating = false;
          options.readOnly = false;
          this.sendFrame(Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      dequeue() {
        while (!this._deflating && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[1].length;
          params[0].apply(this, params.slice(1));
        }
      }
      enqueue(params) {
        this._bufferedBytes += params[1].length;
        this._queue.push(params);
      }
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender;
  }
});

// ../../node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "../../node_modules/ws/lib/websocket.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var crypto = __require("crypto");
    var https = __require("https");
    var http2 = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var url = __require("url");
    var PerMessageDeflate = require_permessage_deflate();
    var EventTarget = require_event_target();
    var extension = require_extension();
    var Receiver = require_receiver();
    var Sender = require_sender();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      GUID,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var protocolVersions = [8, 13];
    var closeTimeout = 30 * 1e3;
    var WebSocket2 = class extends EventEmitter {
      constructor(address, protocols, options) {
        super();
        this.readyState = WebSocket2.CONNECTING;
        this.protocol = "";
        this._binaryType = BINARY_TYPES[0];
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = "";
        this._closeTimer = null;
        this._closeCode = 1006;
        this._extensions = {};
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._isServer = false;
          this._redirects = 0;
          if (Array.isArray(protocols)) {
            protocols = protocols.join(", ");
          } else if (typeof protocols === "object" && protocols !== null) {
            options = protocols;
            protocols = void 0;
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._isServer = true;
        }
      }
      get CONNECTING() {
        return WebSocket2.CONNECTING;
      }
      get CLOSING() {
        return WebSocket2.CLOSING;
      }
      get CLOSED() {
        return WebSocket2.CLOSED;
      }
      get OPEN() {
        return WebSocket2.OPEN;
      }
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type))
          return;
        this._binaryType = type;
        if (this._receiver)
          this._receiver._binaryType = type;
      }
      get bufferedAmount() {
        if (!this._socket)
          return 0;
        return (this._socket.bufferSize || 0) + this._sender._bufferedBytes;
      }
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      setSocket(socket, head, maxPayload) {
        const receiver = new Receiver(
          this._binaryType,
          this._extensions,
          maxPayload
        );
        this._sender = new Sender(socket, this._extensions);
        this._receiver = receiver;
        this._socket = socket;
        receiver[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        socket.setTimeout(0);
        socket.setNoDelay();
        if (head.length > 0)
          socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this.readyState = WebSocket2.OPEN;
        this.emit("open");
      }
      emitClose() {
        this.readyState = WebSocket2.CLOSED;
        if (!this._socket) {
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this.emit("close", this._closeCode, this._closeMessage);
      }
      close(code, data) {
        if (this.readyState === WebSocket2.CLOSED)
          return;
        if (this.readyState === WebSocket2.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          return abortHandshake(this, this._req, msg);
        }
        if (this.readyState === WebSocket2.CLOSING) {
          if (this._closeFrameSent && this._closeFrameReceived)
            this._socket.end();
          return;
        }
        this.readyState = WebSocket2.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err)
            return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived)
            this._socket.end();
        });
        this._closeTimer = setTimeout(
          this._socket.destroy.bind(this._socket),
          closeTimeout
        );
      }
      ping(data, mask, cb) {
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (this.readyState !== WebSocket2.OPEN) {
          const err = new Error(
            `WebSocket is not open: readyState ${this.readyState} (${readyStates[this.readyState]})`
          );
          if (cb)
            return cb(err);
          throw err;
        }
        if (typeof data === "number")
          data = data.toString();
        if (mask === void 0)
          mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      pong(data, mask, cb) {
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (this.readyState !== WebSocket2.OPEN) {
          const err = new Error(
            `WebSocket is not open: readyState ${this.readyState} (${readyStates[this.readyState]})`
          );
          if (cb)
            return cb(err);
          throw err;
        }
        if (typeof data === "number")
          data = data.toString();
        if (mask === void 0)
          mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      send(data, options, cb) {
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (this.readyState !== WebSocket2.OPEN) {
          const err = new Error(
            `WebSocket is not open: readyState ${this.readyState} (${readyStates[this.readyState]})`
          );
          if (cb)
            return cb(err);
          throw err;
        }
        if (typeof data === "number")
          data = data.toString();
        const opts = Object.assign(
          {
            binary: typeof data !== "string",
            mask: !this._isServer,
            compress: true,
            fin: true
          },
          options
        );
        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      terminate() {
        if (this.readyState === WebSocket2.CLOSED)
          return;
        if (this.readyState === WebSocket2.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          return abortHandshake(this, this._req, msg);
        }
        if (this._socket) {
          this.readyState = WebSocket2.CLOSING;
          this._socket.destroy();
        }
      }
    };
    readyStates.forEach((readyState, i) => {
      WebSocket2[readyState] = i;
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        get() {
          const listeners = this.listeners(method);
          for (var i = 0; i < listeners.length; i++) {
            if (listeners[i]._listener)
              return listeners[i]._listener;
          }
          return void 0;
        },
        set(listener) {
          const listeners = this.listeners(method);
          for (var i = 0; i < listeners.length; i++) {
            if (listeners[i]._listener)
              this.removeListener(method, listeners[i]);
          }
          this.addEventListener(method, listener);
        }
      });
    });
    WebSocket2.prototype.addEventListener = EventTarget.addEventListener;
    WebSocket2.prototype.removeEventListener = EventTarget.removeEventListener;
    module.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = Object.assign(
        {
          protocolVersion: protocolVersions[1],
          maxPayload: 100 * 1024 * 1024,
          perMessageDeflate: true,
          followRedirects: false,
          maxRedirects: 10
        },
        options,
        {
          createConnection: void 0,
          socketPath: void 0,
          hostname: void 0,
          protocol: void 0,
          timeout: void 0,
          method: void 0,
          auth: void 0,
          host: void 0,
          path: void 0,
          port: void 0
        }
      );
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      var parsedUrl;
      if (typeof address === "object" && address.href !== void 0) {
        parsedUrl = address;
        websocket.url = address.href;
      } else {
        parsedUrl = url.URL ? new url.URL(address) : url.parse(address);
        websocket.url = address;
      }
      const isUnixSocket = parsedUrl.protocol === "ws+unix:";
      if (!parsedUrl.host && (!isUnixSocket || !parsedUrl.pathname)) {
        throw new Error(`Invalid URL: ${websocket.url}`);
      }
      const isSecure = parsedUrl.protocol === "wss:" || parsedUrl.protocol === "https:";
      const defaultPort = isSecure ? 443 : 80;
      const key = crypto.randomBytes(16).toString("base64");
      const get = isSecure ? https.get : http2.get;
      const path = parsedUrl.search ? `${parsedUrl.pathname || "/"}${parsedUrl.search}` : parsedUrl.pathname || "/";
      var perMessageDeflate;
      opts.createConnection = isSecure ? tlsConnect : netConnect;
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = Object.assign(
        {
          "Sec-WebSocket-Version": opts.protocolVersion,
          "Sec-WebSocket-Key": key,
          Connection: "Upgrade",
          Upgrade: "websocket"
        },
        opts.headers
      );
      opts.path = path;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate(
          opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
          false,
          opts.maxPayload
        );
        opts.headers["Sec-WebSocket-Extensions"] = extension.format({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols) {
        opts.headers["Sec-WebSocket-Protocol"] = protocols;
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.auth) {
        opts.auth = parsedUrl.auth;
      } else if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isUnixSocket) {
        const parts = path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      var req = websocket._req = get(opts);
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (websocket._req.aborted)
          return;
        req = websocket._req = null;
        websocket.readyState = WebSocket2.CLOSING;
        websocket.emit("error", err);
        websocket.emitClose();
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          const addr = url.URL ? new url.URL(location, address) : url.resolve(address, location);
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING)
          return;
        req = websocket._req = null;
        const digest = crypto.createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        const protList = (protocols || "").split(/, */);
        var protError;
        if (!protocols && serverProt) {
          protError = "Server sent a subprotocol but none was requested";
        } else if (protocols && !serverProt) {
          protError = "Server sent no subprotocol";
        } else if (serverProt && !protList.includes(serverProt)) {
          protError = "Server sent an invalid subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt)
          websocket.protocol = serverProt;
        if (perMessageDeflate) {
          try {
            const extensions = extension.parse(
              res.headers["sec-websocket-extensions"]
            );
            if (extensions[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
              websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            abortHandshake(
              websocket,
              socket,
              "Invalid Sec-WebSocket-Extensions header"
            );
            return;
          }
        }
        websocket.setSocket(socket, head, opts.maxPayload);
      });
    }
    function netConnect(options) {
      if (options.protocolVersion)
        options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      options.servername = options.servername || options.host;
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket.readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream.abort();
        stream.once("abort", websocket.emitClose.bind(websocket));
        websocket.emit("error", err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._socket.removeListener("data", socketOnData);
      websocket._socket.resume();
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (code === 1005)
        websocket.close();
      else
        websocket.close(code, reason);
    }
    function receiverOnDrain() {
      this[kWebSocket]._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      websocket._socket.removeListener("data", socketOnData);
      websocket.readyState = WebSocket2.CLOSING;
      websocket._closeCode = err[kStatusCode];
      websocket.emit("error", err);
      websocket._socket.destroy();
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data) {
      this[kWebSocket].emit("message", data);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      websocket.pong(data, !websocket._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("end", socketOnEnd);
      websocket.readyState = WebSocket2.CLOSING;
      websocket._socket.read();
      websocket._receiver.end();
      this.removeListener("data", socketOnData);
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket.readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      websocket.readyState = WebSocket2.CLOSING;
      this.destroy();
    }
  }
});

// ../../node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "../../node_modules/ws/lib/websocket-server.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var crypto = __require("crypto");
    var http2 = __require("http");
    var PerMessageDeflate = require_permessage_deflate();
    var extension = require_extension();
    var WebSocket2 = require_websocket();
    var { GUID } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var WebSocketServer = class extends EventEmitter {
      constructor(options, callback) {
        super();
        options = Object.assign(
          {
            maxPayload: 100 * 1024 * 1024,
            perMessageDeflate: false,
            handleProtocols: null,
            clientTracking: true,
            verifyClient: null,
            noServer: false,
            backlog: null,
            server: null,
            host: null,
            path: null,
            port: null
          },
          options
        );
        if (options.port == null && !options.server && !options.noServer) {
          throw new TypeError(
            'One of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http2.createServer((req, res) => {
            const body = http2.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, (ws) => {
                this.emit("connection", ws, req);
              });
            }
          });
        }
        if (options.perMessageDeflate === true)
          options.perMessageDeflate = {};
        if (options.clientTracking)
          this.clients = /* @__PURE__ */ new Set();
        this.options = options;
      }
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server)
          return null;
        return this._server.address();
      }
      close(cb) {
        if (cb)
          this.once("close", cb);
        if (this.clients) {
          for (const client of this.clients)
            client.terminate();
        }
        const server = this._server;
        if (server) {
          this._removeListeners();
          this._removeListeners = this._server = null;
          if (this.options.port != null) {
            server.close(() => this.emit("close"));
            return;
          }
        }
        process.nextTick(emitClose, this);
      }
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path)
            return false;
        }
        return true;
      }
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"] !== void 0 ? req.headers["sec-websocket-key"].trim() : false;
        const version = +req.headers["sec-websocket-version"];
        const extensions = {};
        if (req.method !== "GET" || req.headers.upgrade.toLowerCase() !== "websocket" || !key || !keyRegex.test(key) || version !== 8 && version !== 13 || !this.shouldHandle(req)) {
          return abortHandshake(socket, 400);
        }
        if (this.options.perMessageDeflate) {
          const perMessageDeflate = new PerMessageDeflate(
            this.options.perMessageDeflate,
            true,
            this.options.maxPayload
          );
          try {
            const offers = extension.parse(req.headers["sec-websocket-extensions"]);
            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            return abortHandshake(socket, 400);
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.connection.authorized || req.connection.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(key, extensions, req, socket, head, cb);
            });
            return;
          }
          if (!this.options.verifyClient(info))
            return abortHandshake(socket, 401);
        }
        this.completeUpgrade(key, extensions, req, socket, head, cb);
      }
      completeUpgrade(key, extensions, req, socket, head, cb) {
        if (!socket.readable || !socket.writable)
          return socket.destroy();
        const digest = crypto.createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new WebSocket2(null);
        var protocol = req.headers["sec-websocket-protocol"];
        if (protocol) {
          protocol = protocol.trim().split(/ *, */);
          if (this.options.handleProtocols) {
            protocol = this.options.handleProtocols(protocol, req);
          } else {
            protocol = protocol[0];
          }
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws.protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = extension.format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, this.options.maxPayload);
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => this.clients.delete(ws));
        }
        cb(ws);
      }
    };
    module.exports = WebSocketServer;
    function addListeners(server, map2) {
      for (const event of Object.keys(map2))
        server.on(event, map2[event]);
      return function removeListeners() {
        for (const event of Object.keys(map2)) {
          server.removeListener(event, map2[event]);
        }
      };
    }
    function emitClose(server) {
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      if (socket.writable) {
        message = message || http2.STATUS_CODES[code];
        headers = Object.assign(
          {
            Connection: "close",
            "Content-type": "text/html",
            "Content-Length": Buffer.byteLength(message)
          },
          headers
        );
        socket.write(
          `HTTP/1.1 ${code} ${http2.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
        );
      }
      socket.removeListener("error", socketOnError);
      socket.destroy();
    }
  }
});

// ../../node_modules/ws/index.js
var require_ws = __commonJS({
  "../../node_modules/ws/index.js"(exports, module) {
    "use strict";
    var WebSocket2 = require_websocket();
    WebSocket2.Server = require_websocket_server();
    WebSocket2.Receiver = require_receiver();
    WebSocket2.Sender = require_sender();
    module.exports = WebSocket2;
  }
});

// src/requestHandlers.js
var services = {};
var serviceAPI = {};
function configure(config) {
  console.log(`requestHandler.configure ${JSON.stringify(config, null, 2)}`);
  config.services.forEach(async ({ name, module, API }) => {
    console.log(`about to import ${module}`);
    const service = await import(module);
    services[name] = service;
    API.forEach((messageType) => serviceAPI[messageType] = name);
    console.log(`configure service ${name} `);
    await service.configure(config);
  });
}
function findHandler(type) {
  const serviceName = serviceAPI[type];
  if (serviceName) {
    return services[serviceName][type];
  }
}
function killSubscriptions(clientId, queue) {
  Object.keys(services).forEach((name) => {
    const killSubscription = services[name]["unsubscribeAll"];
    if (killSubscription) {
      killSubscription(clientId, queue);
    }
  });
}

// src/uuid.js
var import_pure_uuid = __toESM(require_uuid(), 1);

// ../data/index.js
function ascending_default(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}
function bisector_default(f) {
  let delta = f;
  let compare = f;
  if (f.length === 1) {
    delta = (d, x) => f(d) - x;
    compare = ascendingComparator(f);
  }
  function left(a, x, lo, hi) {
    if (lo == null)
      lo = 0;
    if (hi == null)
      hi = a.length;
    while (lo < hi) {
      const mid = lo + hi >>> 1;
      if (compare(a[mid], x) < 0)
        lo = mid + 1;
      else
        hi = mid;
    }
    return lo;
  }
  function right(a, x, lo, hi) {
    if (lo == null)
      lo = 0;
    if (hi == null)
      hi = a.length;
    while (lo < hi) {
      const mid = lo + hi >>> 1;
      if (compare(a[mid], x) > 0)
        hi = mid;
      else
        lo = mid + 1;
    }
    return lo;
  }
  function center(a, x, lo, hi) {
    if (lo == null)
      lo = 0;
    if (hi == null)
      hi = a.length;
    const i = left(a, x, lo, hi - 1);
    return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
  }
  return { left, center, right };
}
function ascendingComparator(f) {
  return (d, x) => ascending_default(f(d), x);
}
function number_default(x) {
  return x === null ? NaN : +x;
}
var ascendingBisect = bisector_default(ascending_default);
var bisectRight = ascendingBisect.right;
var bisectLeft = ascendingBisect.left;
var bisectCenter = bisector_default(number_default).center;
var array = Array.prototype;
var slice = array.slice;
var map = array.map;
var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);
var SET_FILTER_DATA_COLUMNS = [
  { name: "name", key: 0 },
  { name: "count", key: 1, width: 40, type: "number" },
  { name: "totalCount", key: 2, width: 40, type: "number" }
];
var BIN_FILTER_DATA_COLUMNS = [
  { name: "bin" },
  { name: "count" },
  { name: "bin-lo" },
  { name: "bin-hi" }
];
var setFilterColumnMeta = metaData(SET_FILTER_DATA_COLUMNS);
var binFilterColumnMeta = metaData(BIN_FILTER_DATA_COLUMNS);
function metaData(columns) {
  const start2 = columns.length === 0 ? -1 : Math.max(...columns.map((column, idx) => typeof column.key === "number" ? column.key : idx));
  return {
    IDX: start2 + 1,
    RENDER_IDX: start2 + 2,
    DEPTH: start2 + 3,
    COUNT: start2 + 4,
    KEY: start2 + 5,
    SELECTED: start2 + 6,
    PARENT_IDX: start2 + 7,
    IDX_POINTER: start2 + 8,
    FILTER_COUNT: start2 + 9,
    NEXT_FILTER_IDX: start2 + 10,
    count: start2 + 11
  };
}
var DataTypes = {
  ROW_DATA: "rowData",
  FILTER_DATA: "filterData",
  FILTER_BINS: "filterBins"
};
function resetRange({ lo, hi, bufferSize = 0 }) {
  return {
    lo: 0,
    hi: hi - lo,
    bufferSize,
    reset: true
  };
}
function getFullRange({ lo, hi, bufferSize = 0 }) {
  return {
    lo: Math.max(0, lo - bufferSize),
    hi: hi + bufferSize
  };
}
var SAME = 0;
var FWD = 2;
var BWD = 4;
var CONTIGUOUS = 8;
var OVERLAP = 16;
var REDUCE = 32;
var EXPAND = 64;
var NULL = 128;
var RangeFlags = {
  SAME,
  FWD,
  BWD,
  CONTIGUOUS,
  OVERLAP,
  REDUCE,
  EXPAND,
  NULL
};
RangeFlags.GAP = ~(CONTIGUOUS | OVERLAP | REDUCE);
var CHECKBOX = "checkbox";
var SINGLE_ROW = "single-row";
var MULTIPLE_ROW = "multiple-row";
var SelectionModelType = {
  Checkbox: CHECKBOX,
  SingleRow: SINGLE_ROW,
  MultipleRow: MULTIPLE_ROW
};
var { Checkbox, SingleRow, MultipleRow } = SelectionModelType;
var rangeUtils = {
  getFullRange,
  resetRange
};
var DataTypes2 = DataTypes;

// src/message-queue.js
var EMPTY_ARRAY = [];
var ROWSET = "rowset";
var UPDATE = "update";
var FILTER_DATA = "filterData";
var MessageQueue = class {
  constructor() {
    this._queue = [];
  }
  get length() {
    return this._queue.length;
  }
  set length(val) {
    this._queue.length = val;
  }
  get queue() {
    const q = this._queue.slice();
    this._queue.length = 0;
    return q;
  }
  push(message, meta) {
    const { type, data } = message;
    if (type === UPDATE) {
      mergeAndPurgeUpdates(this._queue, message);
    } else if (type === ROWSET) {
      if (message.data.rows.length === 0 && message.size > 0) {
        return;
      }
      mergeAndPurgeRowset(this._queue, message, meta);
    } else if (type === FILTER_DATA && data.type !== DataTypes2.FILTER_BINS) {
      mergeAndPurgeFilterData(this._queue, message, meta);
    } else {
    }
    if (message.type === "rowset") {
      console.log(`[${Date.now()}] message queue push message ${JSON.stringify(message.data.range)}`);
    }
    this._queue.push(message);
  }
  purgeViewport(viewport) {
    this._queue = this._queue.filter((batch) => batch.viewport !== viewport);
  }
  extract(test) {
    if (this._queue.length === 0) {
      return EMPTY_ARRAY;
    } else {
      return extractMessages(this._queue, test);
    }
  }
};
function mergeAndPurgeFilterData(queue, message, meta) {
  const { IDX } = meta;
  const { viewport, data: filterData } = message;
  const { range } = filterData;
  const { lo, hi } = rangeUtils.getFullRange(range);
  for (var i = queue.length - 1; i >= 0; i--) {
    let { type, viewport: vp, data } = queue[i];
    if (vp === viewport && type === FILTER_DATA) {
      var { lo: lo1, hi: hi1 } = rangeUtils.getFullRange(queue[i].data.range);
      var overlaps = data.rows.filter(
        (row) => row[IDX] >= lo && row[IDX] < hi
      );
      if (lo < lo1) {
        message.data = {
          ...message.data,
          rows: filterData.rows.concat(overlaps)
        };
      } else {
        message.data = {
          ...message.data,
          rows: overlaps.concat(filterData.rows)
        };
      }
      queue.splice(i, 1);
    }
  }
}
function mergeAndPurgeRowset(queue, message, meta) {
  const { viewport, data: { rows, size, range, offset = 0 } } = message;
  const { lo, hi } = rangeUtils.getFullRange(range);
  const low = lo + offset;
  const high = hi + offset;
  if (rows.length === 0) {
    console.log(`MESSAGE PUSHED TO MESAGEQ WITH NO ROWS`);
    return;
  }
  const { IDX } = meta;
  for (var i = queue.length - 1; i >= 0; i--) {
    let { type, viewport: vp, data } = queue[i];
    if (vp === viewport) {
      if (type === ROWSET) {
        var { range: { lo: lo1, hi: hi1 } } = queue[i].data;
        if (lo1 >= hi || hi1 < lo) {
        } else {
          var overlaps = data.rows.filter(
            (row) => row[IDX] >= low && row[IDX] < high
          );
          if (lo < lo1) {
            message.data.rows = rows.concat(overlaps);
          } else {
            message.data.rows = overlaps.concat(rows);
          }
        }
        queue.splice(i, 1);
      } else if (type === UPDATE) {
        let validUpdates = queue[i].updates.filter((u) => {
          let idx = u[IDX];
          if (typeof rows[IDX] === "undefined") {
            console.warn(`MessageQueue:about to error, these are the rows that have been passed `);
            console.warn(`[${rows.map((r) => r[IDX]).join(",")}]`);
          }
          let min = rows[0][IDX];
          let max = rows[rows.length - 1][IDX];
          return idx >= low && idx < high && idx < size && (idx < min || idx >= max);
        });
        if (validUpdates.length) {
          queue[i].updates = validUpdates;
        } else {
          queue.splice(i, 1);
        }
      }
    }
  }
}
function mergeAndPurgeUpdates(queue, message) {
  var { viewport, range: { lo, hi } } = message;
  for (var i = queue.length - 1; i >= 0; i--) {
    if (queue[i].type === message.type && queue[i].viewport === viewport) {
      var { lo: lo1, hi: hi1 } = queue[i].updates;
      if (lo1 >= hi || hi1 < lo) {
      } else {
      }
      console.log(`merging rowset current range [${lo},${hi}] [${queue[i].rows.lo},${queue[i].rows.hi}]`);
      queue.splice(i, 1);
    }
  }
}
function extractMessages(queue, test) {
  var extract = [];
  for (var i = queue.length - 1; i >= 0; i--) {
    if (test(queue[i])) {
      extract.push(queue.splice(i, 1)[0]);
    }
  }
  extract.reverse();
  return extract;
}

// src/xhrHandler.js
var Frequency;
function configure2({
  PRIORITY_UPDATE_FREQUENCY: PRIORITY = 100,
  CLIENT_UPDATE_FREQUENCY: UPDATE2 = 250,
  HEARTBEAT_FREQUENCY: HEARTBEAT = 5e3,
  TIMEOUT_PERIOD: TIMEOUT = 1e4
}) {
  Frequency = {
    PRIORITY,
    UPDATE: UPDATE2,
    HEARTBEAT,
    TIMEOUT
  };
}

// src/updateLoop.js
function updateLoop(name, connection, interval, fn) {
  let _keepGoing = true;
  let _timeoutHandle = null;
  function beat() {
    const message = fn();
    if (message !== null) {
      connection.send(message);
    }
    if (_keepGoing) {
      _timeoutHandle = setTimeout(beat, interval);
    }
  }
  beat();
  function stopper() {
    console.log(`stopping updateLoop ${name}`);
    if (_timeoutHandle) {
      clearTimeout(_timeoutHandle);
    }
    _keepGoing = false;
  }
  return stopper;
}

// src/handlers/viewserverRequestHandler.js
var _clientId = 0;
var requestHandler = (options, logger2) => (localWebsocketConnection) => {
  const { HEARTBEAT_FREQUENCY: HEARTBEAT_FREQUENCY2, PRIORITY_UPDATE_FREQUENCY: PRIORITY_UPDATE_FREQUENCY2, CLIENT_UPDATE_FREQUENCY: CLIENT_UPDATE_FREQUENCY2 } = options;
  let server_clientId = ++_clientId;
  console.log(`Server.websocketRequestHandler: connection request from new client #${server_clientId}`);
  localWebsocketConnection.send(JSON.stringify(
    { type: "Welcome", clientId: ++_clientId }
  ));
  const _update_queue = new MessageQueue();
  const HEARTBEAT = JSON.stringify({ type: "HB", vsHostName: "localhost" });
  const stopHeartBeats = updateLoop("HeartBeat", localWebsocketConnection, HEARTBEAT_FREQUENCY2, () => HEARTBEAT);
  const stopPriorityUpdates = updateLoop("Priority Updates", localWebsocketConnection, PRIORITY_UPDATE_FREQUENCY2, priorityQueueReader);
  const stopUpdates = updateLoop("Regular Updates", localWebsocketConnection, CLIENT_UPDATE_FREQUENCY2, queueReader);
  localWebsocketConnection.on("message", function(msg) {
    const json = JSON.parse(msg);
    const message = json.message;
    const msgType = message.type;
    const handler = findHandler(msgType);
    if (handler) {
      handler(server_clientId, message, _update_queue);
    } else {
      console.log("server: dont know how to handle " + msg);
    }
  });
  localWebsocketConnection.on("close", function(msg) {
    console.log(">>> viewserver, local CONNECTION closed");
    stopHeartBeats();
    stopPriorityUpdates();
    stopUpdates();
    killSubscriptions(server_clientId, _update_queue);
  });
  function PRIORITY1(msg) {
    return msg.priority === 1;
  }
  function priorityQueueReader() {
    const queue = _update_queue.extract(PRIORITY1);
    if (queue.length > 0) {
      queue.forEach((msg2) => {
        if (msg2.data && msg2.data.range) {
          console.log(`[${Date.now()}]<<<<<<<<< ${msg2.type} ${JSON.stringify(msg2.data.range)}`);
        }
      });
      const msg = JSON.stringify(queue);
      return msg;
    } else {
      return null;
    }
  }
  function queueReader() {
    if (_update_queue.length > 0) {
      const msg = JSON.stringify(_update_queue.queue);
      return msg;
    } else {
      return null;
    }
  }
};

// src/server.js
var import_ws = __toESM(require_ws(), 1);
import http from "http";
var logger = console;
var SubscriptionCounter = class {
  constructor() {
    this._count = 0;
  }
  next() {
    this._count += 1;
    return this._count;
  }
};
var port = 9090;
var PRIORITY_UPDATE_FREQUENCY = 20;
var CLIENT_UPDATE_FREQUENCY = 50;
var HEARTBEAT_FREQUENCY = 5e3;
function start(config) {
  configure({
    ...config,
    subscriptionCounter: new SubscriptionCounter()
  });
  const msgConfig = {
    CLIENT_UPDATE_FREQUENCY,
    HEARTBEAT_FREQUENCY,
    PRIORITY_UPDATE_FREQUENCY
  };
  configure2(msgConfig);
  const httpServer = http.createServer(function(request, response) {
    if (request.url === "/xhr") {
      handleXhrRequest(request, response);
    } else if (request.url.match(/\/ws\/stomp\/info/)) {
      const HTTP_HEADERS = {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": request.headers["origin"],
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Content-type": "application/json;charset=UTF-8"
      };
      response.writeHead(200, HTTP_HEADERS);
      response.end(JSON.stringify({ entropy: 9006110, origins: ["*:*"], "cookie_needed": true, websocket: true }));
    } else {
      console.log(new Date() + " received request for " + request.url);
      request.addListener("end", function() {
      }).resume();
    }
  });
  const wss = new import_ws.default.Server({ server: httpServer });
  const requestHandler2 = requestHandler;
  wss.on("connection", requestHandler2(msgConfig, logger));
  httpServer.listen(port, function() {
    console.log(`HTTP Server is listening on port ${port}`);
  });
}
function handleXhrRequest(request, response) {
  let content = "";
  request.on("data", (data) => content += data);
  request.on("end", () => {
    console.log(`got a client request ${content}`);
    let { clientId, message } = JSON.parse(content);
  });
}
export {
  start as default
};
/*!
**  Pure-UUID -- Pure JavaScript Based Universally Unique Identifier (UUID)
**  Copyright (c) 2004-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
//# sourceMappingURL=index.js.map
