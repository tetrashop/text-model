import "./globals.css";

export const metadata = { title: "Text-to-CAD | حرفه‌ای‌ترین دستیار طراحی", description: "تولید مدل سه‌بعدی از متن" };

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased overflow-hidden">{children}</body>
    </html>
  );
}
