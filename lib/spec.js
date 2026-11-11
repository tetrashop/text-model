export function emptySpec() {
  return { name: "", unit: null, actions: [], format: "stl", assumptions: [], criteria: [] };
}
export function isReady(spec) {
  if (!spec || !spec.unit) return false;
  if (!Array.isArray(spec.actions) || spec.actions.length === 0) return false;
  for (const p of spec.actions.filter(Boolean)) {
    if (p.type === "box" && (!p.w || !p.h || !p.d)) return false;
    if (p.type === "cylinder" && (!p.r || !p.h)) return false;
    if (p.type === "sphere" && !p.r) return false;
    if (p.type === "text" && !p.text) return false;
  }
  return !!spec.format;
}
