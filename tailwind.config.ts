import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        moai: {
          // 沖縄の海と太陽 + 仲間の温もり
          primary: {
            DEFAULT: "#0d9488",   // teal-600 メインアクション
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
            DEFAULT: "#f59e0b",   // amber-500 ハイライト
            50: "#fffbeb",
            100: "#fef3c7",
            200: "#fde68a",
            300: "#fcd34d",
            400: "#fbbf24",
            500: "#f59e0b",
            600: "#d97706",
          },
          coral: "#fb7185",       // 強調・通知
          ink: "#0f172a",
          paper: "#fafaf9",
          sand: "#fef9f0",        // 暖かい背景
          cloud: "#f1f5f9",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont",
          "Hiragino Sans", "Hiragino Kaku Gothic ProN",
          "Noto Sans JP", "Yu Gothic Medium",
          "Meiryo", "system-ui", "sans-serif",
        ],
        display: [
          "-apple-system", "BlinkMacSystemFont",
          "Hiragino Sans", "Noto Sans JP",
          "system-ui", "sans-serif",
        ],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 8px -1px rgb(15 23 42 / 0.06), 0 1px 3px -1px rgb(15 23 42 / 0.04)",
        card: "0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.04)",
        hover: "0 12px 24px -8px rgb(13 148 136 / 0.18), 0 4px 8px -4px rgb(15 23 42 / 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
