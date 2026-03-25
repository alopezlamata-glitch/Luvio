/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        luvio: {
          bg:      "#FAF5EE",
          surface: "#FFFDF9",
          warm100: "#F0E8DF",
          warm200: "#D6C5B5",
          warm500: "#8A7060",
          text:    "#2C1810",
          terra:   "#C4704F",
          blush:   "#E8C5B8",
          success: "#7FA87A",
          caution: "#D4A04A",
        },
      },
      fontFamily: {
        sans:    ["IBM Plex Sans", "system-ui", "sans-serif"],
        display: ["Cormorant Garamond", "Georgia", "serif"],
      },
      fontSize: {
        "balance-sm": ["1.5rem",  { lineHeight: "1.2", fontWeight: "300" }],
        "balance-md": ["2.5rem",  { lineHeight: "1.1", fontWeight: "300" }],
        "balance-lg": ["3.5rem",  { lineHeight: "1",   fontWeight: "300" }],
        "balance-xl": ["5rem",    { lineHeight: "1",   fontWeight: "300" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      animation: {
        "fade-up":      "fadeUp 0.4s ease-out",
        "slide-in":     "slideIn 0.3s ease-out",
        "timeline-in":  "timelineIn 0.45s ease-out forwards",
        "balance-fill": "balanceFill 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        timelineIn: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        balanceFill: {
          "0%":   { transform: "scaleX(0)", opacity: "0" },
          "100%": { transform: "scaleX(1)", opacity: "1" },
        },
      },
      boxShadow: {
        terra:   "0 8px 32px rgba(196,112,79,0.22)",
        surface: "0 2px 12px rgba(44,24,16,0.06)",
      },
    },
  },
  plugins: [],
};
