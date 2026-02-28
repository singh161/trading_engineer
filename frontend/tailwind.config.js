/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0e27',
        'dark-card': '#131829',
        'dark-border': '#1e2330',
        'dark-text': '#e2e8f0',
        'dark-text-secondary': '#94a3b8',
        'green-buy': '#10b981',
        'red-sell': '#ef4444',
        'yellow-neutral': '#f59e0b',
        'blue-accent': '#3b82f6',
      },
    },
  },
  plugins: [],
}
