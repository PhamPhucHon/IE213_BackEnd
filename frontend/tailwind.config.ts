import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#111827",
          soft: "#1f2937",
          inverse: "#ffffff"
        },
        muted: {
          DEFAULT: "#64748b",
          strong: "#475569",
          subtle: "#94a3b8"
        },
        line: {
          DEFAULT: "#e2e8f0",
          strong: "#cbd5e1",
          subtle: "#f1f5f9"
        },
        surface: {
          DEFAULT: "#f8fafc",
          raised: "#ffffff",
          sunken: "#f1f5f9",
          tint: "#f6f8fb"
        },
        brand: {
          50: "#eef6ff",
          100: "#d8ebff",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af"
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          600: "#059669",
          700: "#047857",
          800: "#065f46"
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e"
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b"
        },
        info: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "\"Segoe UI\"",
          "sans-serif"
        ]
      },
      fontSize: {
        "ui-xs": ["0.75rem", { lineHeight: "1rem" }],
        "ui-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "ui-base": ["1rem", { lineHeight: "1.625rem" }],
        "ui-title": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.01em" }],
        "ui-display": ["2.75rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }]
      },
      borderRadius: {
        ui: "0.5rem",
        panel: "0.75rem"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
        subtle: "0 1px 2px rgba(15, 23, 42, 0.06)",
        button: "0 8px 20px rgba(15, 23, 42, 0.12)",
        field: "inset 0 1px 1px rgba(15, 23, 42, 0.03)"
      },
      transitionTimingFunction: {
        ui: "cubic-bezier(0.2, 0, 0, 1)"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        }
      },
      animation: {
        shimmer: "shimmer 1.8s ease-in-out infinite"
      },
      zIndex: {
        overlay: "50",
        nav: "40"
      }
    }
  },
  plugins: []
};

export default config;
