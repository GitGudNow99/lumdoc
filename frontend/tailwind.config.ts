import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // grandMA3 specific colors
        ma3: {
          yellow: "#FFD100",      // Signature yellow
          black: "#1A1A1A",       // Main background
          dark: "#0D0D0D",        // Darker background
          surface: "#212121",     // Card/panel background
          gray: {
            900: "#1A1A1A",       // Darkest
            800: "#262626",       // Very dark
            700: "#333333",       // Dark
            600: "#404040",       // Medium dark
            500: "#595959",       // Medium
            400: "#737373",       // Medium light
            300: "#8C8C8C",       // Light
            200: "#A6A6A6",       // Very light
            100: "#BFBFBF",       // Lightest
          },
          cyan: "#0099CC",        // Encoder/selection accent
          orange: "#FF6600",      // Warning/special
          red: "#E62E2E",         // Error/record
          green: "#00CC66",       // Active/go
          blue: "#0066CC",        // Info/cue
          purple: "#9933CC",      // Effect/special
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;