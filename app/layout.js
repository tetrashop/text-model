import "./globals.css";

export const metadata = { title: "text-model", description: "دستیار مدل سه‌بعدی" };

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
