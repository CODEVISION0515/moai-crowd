import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        moai: {
          primary: {
            DEFAULT: "#0f766e",
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
            DEFAULT: "#0f766e",
            50: "#f0fdfa",
            100: "#ccfbf1",
            500: "#14b8a6",
            600: "#0d9488",
          },
          ink: "#111827",
          paper: "#ffffff",
          cloud: "#f8fafc",       // slate-50 — よりクールなセクション背景
          muted: "#64748b",       // slate-500 — よりモダンなサブテキスト
          border: "#e2e8f0",      // slate-200 — よりソフトなボーダー
          // セマンティックカラー
          warning: "#f59e0b",     // amber-500 — 締切間近・緊急
          success: "#10b981",     // emerald-500 — 完了・認証済み
          danger: "#ef4444",      // red-500 — エラー・破壊的操作
          gold: "#eab308",        // yellow-500 — プレミアム・トップレート
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
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.03)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        hover: "0 8px 24px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)",
        lg: "0 12px 32px -4px rgb(0 0 0 / 0.10), 0 4px 12px -2px rgb(0 0 0 / 0.05)",
        xl: "0 20px 48px -8px rgb(0 0 0 / 0.12), 0 8px 16px -4px rgb(0 0 0 / 0.06)",
        glow: "0 0 20px -4px rgb(15 118 110 / 0.25)",
        "inner-soft": "inset 0 1px 2px 0 rgb(0 0 0 / 0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 2s linear infinite",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
        "bounce-subtle": "bounceSubtle 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "progress-fill": "progressFill 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        float: "float 3s ease-in-out infinite",
        "count-up": "fadeIn 0.6s ease-out",
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
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.2)" },
        },
        bounceSubtle: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
        progressFill: {
          "0%": { width: "0%" },
          "100%": { width: "var(--progress, 0%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      backgroundImage: {
        "gradient-hero": "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
        "gradient-hero-light": "linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #f8fafc 100%)",
        "gradient-card": "linear-gradient(135deg, rgba(15,118,110,0.04) 0%, rgba(15,118,110,0) 100%)",
        "gradient-gold": "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
        "gradient-shimmer": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
        "gradient-subtle": "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
      },
      fontSize: {
        "display-lg": ["3rem", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "700" }],
        "display-md": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-sm": ["1.875rem", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
      transitionTimingFunction: {
        "out-back": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
