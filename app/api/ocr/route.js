import { client } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file) return Response.json({ text: "" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const base64 = buf.toString("base64");
    const mime = file.type || "image/png";

    const openai = client();
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct", // مدل رایگان و بینایی Groq
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "متن، اعداد، واحدها، ابعاد و توضیحات مهندسی این نقشه را استخراج کن. به فارسی و به صورت متنی روان بنویس که بتوان از آن برای مدل‌سازی سه‌بعدی استفاده کرد (مثلا: مکعب ۴۰ در ۳۰)." },
            { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } }
          ]
        }
      ],
      temperature: 0
    });

    return Response.json({ text: completion.choices[0]?.message?.content || "" });
  } catch (e) {
    return Response.json({ text: "", error: e.message }, { status: 500 });
  }
}
