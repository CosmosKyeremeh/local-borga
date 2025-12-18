import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // Added standard pages path
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}', // Added src path just in case
  ],
  theme: {
    extend: {
      colors: {
        'gold': {
          500: '#D4AF37', 
        },
        'blue-black': {
          900: '#0B121E', 
        },
      },
    },
  },
  plugins: [],
}
export default config