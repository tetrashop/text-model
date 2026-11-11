import { generateFile } from "@/lib/stl";
import { validateSpec } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { spec, format } = await req.json();
    const v = validateSpec(spec);
    if (!v.ok) return Response.json({ error: "spec نامعتبر", details: v.errors }, { status: 400 });

    const outFormat = format || spec.format || "stl";
    const safe = (spec.name || "model").replace(/[^\w\-]+/g, "_").slice(0, 40) || "model";
    
    const fileData = await generateFile(spec, outFormat);
    
    return new Response(fileData, {
      headers: {
        "Content-Type": outFormat === "obj" ? "text/plain" : "model/stl",
        "Content-Disposition": `attachment; filename="${safe}.${outFormat}"`
      }
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
