export function validateSpec(spec) {
  const errors = [];
  if (!spec) return { ok: false, errors: ["spec خالی است"] };
  if (!spec.unit) errors.push("واحد مشخص نیست");
  const actions = (spec.actions || spec.primitives || []).filter(Boolean);
  if (actions.length === 0) errors.push("شکل هندسی تعریف نشده");
  return { ok: errors.length === 0, errors };
}
