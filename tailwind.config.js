/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Luvio palette
        coral: {
          300: "#FCA5A1",
          400: "#F97066",
          500: "#EF4444",
        },
        violet: {
          400: "#7C6EF6",
          500: "#6D5FE7",
        },
        teal: {
          400: "#36B5A0",
          500: "#2DA08D",
        },
        amber: {
          400: "#F5A524",
        },
        // Dark backgrounds
        luvio: {
          bg: "#0a0a12",
          card: "#12121c",
          surface: "#1a1a28",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "1.75rem",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
