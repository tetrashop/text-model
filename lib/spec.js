export function emptySpec() {
  return {
    name: "",
    unit: null,
    primitives: [],
    material: null,
    tolerance: null,
    format: "stl",
    assumptions: [],
    criteria: []
  };
}

export function isReady(spec) {
  if (!spec || !spec.unit) return false;
  if (!spec.primitives || spec.primitives.length === 0) return false;
  for (const p of spec.primitives) {
    if (p.type === "box" && (!p.w || !p.h || !p.d)) return false;
    if (p.type === "cylinder" && (!p.r || !p.h)) return false;
    if (p.type === "sphere" && !p.r) return false;
  }
  if (!spec.format) return false;
  return true;
}
