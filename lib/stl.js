import { primitives, booleans, transforms } from '@jscad/modeling';
import stlSerializer from '@jscad/stl-serializer';
import objSerializer from '@jscad/obj-serializer';

export function specToSolid(spec) {
  let currentSolid = null;
  const actions = spec.actions || spec.primitives || [];

  for (const action of actions) {
    let solid;
    if (action.type === "box") {
      solid = primitives.cuboid({ size: [action.w || 10, action.h || 10, action.d || 10], center: [0, 0, 0] });
    } else if (action.type === "cylinder") {
      solid = primitives.cylinder({ radius: action.r || 5, height: action.h || 10, segments: 32, center: [0, 0, 0] });
      solid = transforms.rotateX(Math.PI / 2, solid); 
    } else if (action.type === "sphere") {
      solid = primitives.sphere({ radius: action.r || 5, segments: 32, center: [0, 0, 0] });
    } else if (action.type === "cone") {
      solid = primitives.cylinderElliptic({ startRadius: [action.r1 || 0, action.r1 || 0], endRadius: [action.r2 || 5, action.r2 || 5], height: action.h || 10, segments: 32, center: [0, 0, 0] });
      solid = transforms.rotateX(Math.PI / 2, solid);
    } else if (action.type === "torus") {
      solid = primitives.torus({ innerRadius: action.innerR || 10, outerRadius: action.outerR || 15, innerSegments: 32, outerSegments: 32 });
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

export function generateFile(spec, format = "stl") {
  const solid = specToSolid(spec);
  if (!solid) return "";
  
  if (format === "obj") {
    const rawData = objSerializer.serialize({ binary: false }, solid);
    return rawData[0];
  } else {
    const rawData = stlSerializer.serialize({ binary: false }, solid);
    return rawData[0];
  }
}
