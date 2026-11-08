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
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: "متن، اعداد، واحدها، تلرانس‌ها و نمادهای مهندسی را از این رسم استخراج کن. فقط متن استخراجی را برگردان." },
        { role: "user", content: [
          { type: "text", text: "این رسم را بخوان:" },
          { type: "image_url", image_url: { url: "data:" + mime + ";base64," + base64 } }
        ]}
      ],
      temperature: 0
    });

    return Response.json({ text: completion.choices[0]?.message?.content || "" });
  } catch (e) {
    return Response.json({ text: "", error: e.message }, { status: 500 });
  }
}
