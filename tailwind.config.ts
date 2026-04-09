import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        moai: {
          // Linear/Notion風: ニュートラル基調 + 深いティールアクセント
          primary: {
            DEFAULT: "#0f766e",   // teal-700 — 落ち着いたメインカラー
            50: "#f0fdfa",
            100: "#ccfbf1",
            200: "#99f6e4",
            300: "#5eead4",
            400: "#2dd4bf",
            500: "#14b8a6",
            600: "#0d9488",
            700: "#0f766e",
            800: "#115e59",
            900: "#134e4a",
          },
          accent: {
            DEFAULT: "#0f766e",   // アクセントもプライマリに統一（1色展開）
            50: "#f0fdfa",
            100: "#ccfbf1",
            500: "#14b8a6",
            600: "#0d9488",
          },
          ink: "#111827",         // gray-900 — テキスト
          paper: "#ffffff",       // 白背景
          cloud: "#f9fafb",       // gray-50 — セクション背景
          muted: "#6b7280",       // gray-500 — サブテキスト
          border: "#e5e7eb",      // gray-200 — ボーダー
        },
      },
      fontFamily: {
        sans: [
          "Inter", "-apple-system", "BlinkMacSystemFont",
          "Hiragino Sans", "Hiragino Kaku Gothic ProN",
          "Noto Sans JP", "system-ui", "sans-serif",
        ],
        display: [
          "Inter", "-apple-system", "BlinkMacSystemFont",
          "Hiragino Sans", "Noto Sans JP",
          "system-ui", "sans-serif",
        ],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06)",
        hover: "0 4px 12px -2px rgb(0 0 0 / 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
