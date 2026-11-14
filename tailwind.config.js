/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medibg: "#DCEDF8",
        mediprimary: "#1479BD",
        medidark: "#0F2E4C",
        medisecondary: "#2F6A94",
        medilightblue: "#BFE0F5",
        mediamber: "#F2A65A",
        medidanger: "#D14343",
        medicamera: "#17406A",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'hero': '28px',
        'card': '22px',
        'input': '14px',
        'avatar': '16px',
        'nav': '24px',
      }
    },
  },
  plugins: [],
}
