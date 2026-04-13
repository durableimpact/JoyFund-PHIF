import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1DB1DB',
        secondary: '#1D38DB',
        hover: '#1D75DB',
        success: '#1CDBC9',
        admin: '#471DDB',
        background: '#F9FAFB',
        'text-dark': '#1A1A2E',
      },
      borderRadius: {
        'sm': '12px',
        'lg': '24px',
        'xl': '32px',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
