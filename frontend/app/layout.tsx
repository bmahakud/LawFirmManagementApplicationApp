import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LawFirm",
  description: "LawFirm Management System",
};

import { Toaster } from 'react-hot-toast';
import GlobalErrorHandler from '@/components/platform/GlobalErrorHandler';
import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="lawfirm-compat-polyfills"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function(g){
  if (!g) return;
  var HEX_TABLE = [];
  for (var i = 0; i < 256; i++) {
    HEX_TABLE[i] = (i < 16 ? "0" : "") + i.toString(16);
  }
  if (typeof g.Uint8Array !== "undefined") {
    if (!g.Uint8Array.prototype.toHex) {
      Object.defineProperty(g.Uint8Array.prototype, "toHex", {
        value: function toHex() {
          var hex = "";
          for (var i = 0; i < this.length; i++) {
            hex += HEX_TABLE[this[i]];
          }
          return hex;
        },
        writable: true, configurable: true, enumerable: false
      });
    }
    if (!g.Uint8Array.fromHex) {
      Object.defineProperty(g.Uint8Array, "fromHex", {
        value: function fromHex(hexStr) {
          if (typeof hexStr !== "string") throw new TypeError("Expected string");
          if (hexStr.length % 2 !== 0) throw new SyntaxError("Invalid hex string length");
          var out = new g.Uint8Array(hexStr.length / 2);
          for (var i = 0; i < hexStr.length; i += 2) {
            out[i / 2] = parseInt(hexStr.substring(i, i + 2), 16);
          }
          return out;
        },
        writable: true, configurable: true, enumerable: false
      });
    }
    if (!g.Uint8Array.prototype.toBase64) {
      Object.defineProperty(g.Uint8Array.prototype, "toBase64", {
        value: function toBase64() {
          var binary = "";
          for (var i = 0; i < this.length; i++) {
            binary += String.fromCharCode(this[i]);
          }
          return typeof g.btoa === "function" ? g.btoa(binary) : "";
        },
        writable: true, configurable: true, enumerable: false
      });
    }
  }
  if (typeof g.Map !== "undefined") {
    if (!g.Map.prototype.getOrInsert) {
      Object.defineProperty(g.Map.prototype, "getOrInsert", {
        value: function(k, v) { if (this.has(k)) return this.get(k); this.set(k, v); return v; },
        writable: true, configurable: true, enumerable: false
      });
    }
    if (!g.Map.prototype.getOrInsertComputed) {
      Object.defineProperty(g.Map.prototype, "getOrInsertComputed", {
        value: function(k, fn) { if (this.has(k)) return this.get(k); var v = fn(k); this.set(k, v); return v; },
        writable: true, configurable: true, enumerable: false
      });
    }
  }
  if (typeof g.Promise !== "undefined" && !g.Promise.withResolvers) {
    Object.defineProperty(g.Promise, "withResolvers", {
      value: function() {
        var res, rej;
        var p = new g.Promise(function(a, b) { res = a; rej = b; });
        return { promise: p, resolve: res, reject: rej };
      },
      writable: true, configurable: true, enumerable: false
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this);
            `
          }}
        />
        {children}
        <GlobalErrorHandler />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#071526',
              color: '#fff',
              borderRadius: '16px',
              fontWeight: '600',
              fontSize: '14px',
              padding: '16px 20px',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
