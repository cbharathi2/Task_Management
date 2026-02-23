export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f172a',
          sidebar: '#111827',
          card: '#1F2937',
          'card-hover': '#243041',
          border: 'rgba(255,255,255,0.05)',
        },
        accent: {
          teal: '#2DD4BF',
          'teal-hover': '#14B8A6',
        },
        status: {
          todo: '#3B82F6',
          'in-progress': '#F59E0B',
          completed: '#10B981',
          overdue: '#EF4444',
        },
        text: {
          primary: '#F9FAFB',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
