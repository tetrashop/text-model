import { client, SYSTEM_PROMPT } from "@/lib/llm";
import { emptySpec, isReady } from "@/lib/spec";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { messages, spec } = await req.json();
    const openai = client();
    const currentSpec = spec || emptySpec();

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: "spec فعلی:\n" + JSON.stringify(currentSpec) },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      temperature: 0.2
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed;
    try { parsed = JSON.parse(raw); } catch { parsed = { action: "ask", question: "لطفاً ادامه دهید." }; }

    const nextSpec = parsed.spec || currentSpec;
    if (!nextSpec.format) nextSpec.format = "stl";
    parsed.spec = nextSpec;
    if (parsed.action !== "ask" && isReady(nextSpec)) parsed.action = "ready";

    return Response.json(parsed);
  } catch (e) {
    return Response.json({ action: "ask", question: "خطا: " + e.message }, { status: 500 });
  }
}
