export function validateSpec(spec) {
  const errors = [];
  if (!spec) return { ok: false, errors: ["spec خالی است"] };
  if (!spec.unit) errors.push("واحد مشخص نیست");
  if (!spec.primitives || spec.primitives.length === 0) errors.push("شکل هندسی تعریف نشده");
  if (spec.primitives) {
    spec.primitives.forEach((p, i) => {
      if (p.type === "box" && (p.w <= 0 || p.h <= 0 || p.d <= 0)) errors.push(`box[${i}] ابعاد نامعتبر`);
      if (p.type === "cylinder" && (p.r <= 0 || p.h <= 0)) errors.push(`cylinder[${i}] ابعاد نامعتبر`);
      if (p.type === "sphere" && p.r <= 0) errors.push(`sphere[${i}] شعاع نامعتبر`);
    });
  }
  return { ok: errors.length === 0, errors };
}
