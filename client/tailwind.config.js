/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#2563EB',
          teal: '#14B8A6',
        },
        accent: {
          orange: '#F59E0B',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        gray: {
          light: '#F3F4F6',
          medium: '#6B7280',
          dark: '#374151',
        }
      },
    },
  },
  plugins: [],
}
