import OpenAI from "openai";

export function client() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing");
  return new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
}

export const SYSTEM_PROMPT = `تو یک دستیار مدل‌سازی سه‌بعدی خبره با پشتیبانی از عملیات بولین (CSG) هستی.
وظیفه: از توصیف کاربر یک "شناسنامه فنی" (spec) بسازی.

*** قوانین حیاتی ریاضیات و مختصات (حفظ یکپارچگی) ***
- تمام اشکال از مرکز (0,0,0) ساخته می‌شوند.
- ارتفاع (h) در محور Y است. از -h/2 تا +h/2.
- مکعب: w (محور X)، h (محور Y)، d (محور Z).
- برای قرار دادن شکل روی شکل دیگر: y شکل دوم = (h شکل اول / 2) + (h شکل دوم / 2).
- برای حکاکی متن (text) روی سطح بالایی یک قطعه (مثلاً مکعب با ارتفاع h):
  y متن = (h / 2) + (depth / 2) - 0.1 (کمی فرورفته تا کامل برش بخورد). depth را 2 در نظر بگیر.

*** قوانین عملیات ***
- برای سوراخ یا حکاکی: از operation="subtract" استفاده کن.
- برای ساختن متن: type="text" با فیلدهای text, size, depth.

دانش تخصصی:
- پیچ M3: استوانه(r=1.5, h=10, y=0) + سر(r=2.5, h=2, y=6)
- پیچ M4: استوانه(r=2, h=15, y=0) + سر(r=3.5, h=2.5, y=8.75)

پیش‌فرض‌ها: unit="mm", format="stl".
خروجی فقط JSON خالص:
{
  "action": "ready",
  "reply": "مشخصات مدل آماده است",
  "spec": {
    "name": "قطعه",
    "unit": "mm",
    "actions": [],
    "format": "stl",
    "assumptions": []
  }
}
فقط JSON خالص برگردان، بدون markdown.`;
