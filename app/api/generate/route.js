import { specToSTL } from "@/lib/stl";
import { validateSpec } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { spec } = await req.json();
    const v = validateSpec(spec);
    if (!v.ok) return Response.json({ error: "spec نامعتبر", details: v.errors }, { status: 400 });

    const safe = (spec.name || "model").replace(/[^\w\-]+/g, "_").slice(0, 40) || "model";
    const stl = specToSTL(spec);
    return new Response(stl, {
      headers: {
        "Content-Type": "model/stl",
        "Content-Disposition": "attachment; filename=\"" + safe + ".stl\""
      }
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
