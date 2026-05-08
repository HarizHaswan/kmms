/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#EBF4FF',
          DEFAULT: '#4F9CF9', // Soft Sky Blue
          dark: '#3B82F6',
        },
        secondary: {
          light: '#F0FFF4',
          DEFAULT: '#6ED6A0', // Mint Green
          dark: '#48BB78',
        },
        accent: {
          light: '#FFFBEB',
          DEFAULT: '#FFD166', // Warm Yellow
          dark: '#F59E0B',
        },
        brand: {
          bg: '#F5F7FA',      // Background Light Gray
          text: '#2D3748',    // Dark Gray Text
          textSecondary: '#718096', // Secondary Gray Text
        },
        status: {
          success: '#38A169',
          warning: '#DD6B20',
          error: '#E53E3E',
        }
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'premium': '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};
