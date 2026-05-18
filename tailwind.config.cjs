/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    extend: {
      colors: {
        chocobo: {
          yellow: '#F9A825',
          navy: '#1A237E',
          gold: '#FFC947',
          ink: '#111827',
          mist: '#F5F7FB'
        }
      },
      boxShadow: {
        shell: '0 10px 30px rgba(17, 24, 39, 0.08)'
      }
    }
  },
  plugins: []
};
