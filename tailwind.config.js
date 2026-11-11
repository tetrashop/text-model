/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#10b981', // سبز زمردی برای دکمه‌ها
        dark: '#0f172a',  // پس‌زمینه اصلی
        panel: '#1e293b', // پس‌زمینه پنل‌ها
      }
    },
  },
  plugins: [],
}
