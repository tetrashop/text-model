# text-model

دستیار گفت‌وگویی برای ساخت مدل سه‌بعدی علمی از توصیف و رسم.

## اجرا در Termux
```

pkg install nodejs-lts
npm install
echo "OPENAI_API_KEY=sk-..." > .env.local
npm run dev

```

## دیپلوی در Vercel
```

npm i -g vercel
vercel

```
سپس در داشبورد Vercel متغیر `OPENAI_API_KEY` را ست کنید.

## جریان کار
1. توصیف شیء یا آپلود رسم → OCR
2. LLM spec (شناسنامه فنی) می‌سازد
3. فقط ابهام‌های حیاتی (unit / ابعاد / format) سؤال می‌شوند — با پیش‌فرض پیشنهادی
4. اگر spec کامل شد → action = ready
5. دکمه «دانلود STL» فایل می‌سازد

## محدودیت‌ها
- primitive ها: box, cylinder, sphere
- OCR: GPT-4o-mini vision
- خروجی: STL (STEP/IGES در نسخه بعد)
