import { primitives, booleans, transforms } from '@jscad/modeling';
import stlSerializer from '@jscad/stl-serializer';
import objSerializer from '@jscad/obj-serializer';

export function specToSolid(spec) {
  let currentSolid = null;
  // فیلتر کردن مقادیر null یا undefined
  const actions = (spec.actions || spec.primitives || []).filter(Boolean);

  for (const action of actions) {
    let solid;
    if (action.type === "box") {
      solid = primitives.cuboid({ size: [action.w || 10, action.h || 10, action.d || 10], center: [0, 0, 0] });
    } else if (action.type === "cylinder") {
      solid = primitives.cylinder({ radius: action.r || 5, height: action.h || 10, segments: 32, center: [0, 0, 0] });
      solid = transforms.rotateX(Math.PI / 2, solid); 
    } else if (action.type === "sphere") {
      solid = primitives.sphere({ radius: action.r || 5, segments: 32, center: [0, 0, 0] });
    } else if (action.type === "text") {
      solid = createTextSolid(action.text || "TEXT", action.size || 5);
    }

    if (solid) {
      solid = transforms.translate([action.x || 0, action.y || 0, action.z || 0], solid);
      if (!currentSolid) {
        currentSolid = solid;
      } else {
        const op = action.operation || "add";
        if (op === "add") currentSolid = booleans.union(currentSolid, solid);
        else if (op === "subtract") currentSolid = booleans.subtract(currentSolid, solid);
        else if (op === "intersect") currentSolid = booleans.intersect(currentSolid, solid);
      }
    }
  }
  return currentSolid;
}

function createTextSolid(text, size) {
  const actualText = String(text) || "TEXT";
  const actualSize = Number(size) || 5;
  let solids = [];
  for (let i = 0; i < actualText.length; i++) {
    const charBox = primitives.cuboid({ size: [actualSize * 0.6, actualSize, actualSize * 0.2], center: [0, 0, 0] });
    const translated = transforms.translate([(i * actualSize) - (actualText.length * actualSize / 2), 0, 0], charBox);
    solids.push(translated);
  }
  return solids.length > 0 ? booleans.union(...solids) : null;
}

export function generateFile(spec, format = "stl") {
  const solid = specToSolid(spec);
  if (!solid) return "solid empty\nendsolid empty\n";
  
  if (format === "obj") {
    const rawData = objSerializer.serialize({ binary: false }, solid);
    return rawData[0];
  } else {
    const rawData = stlSerializer.serialize({ binary: false }, solid);
    return rawData[0];
  }
}
