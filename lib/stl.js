import { primitives, booleans, transforms } from '@jscad/modeling';
import stlSerializer from '@jscad/stl-serializer';

export function specToSTL(spec) {
  let currentSolid = null;

  const actions = spec.actions || spec.primitives || [];

  for (const action of actions) {
    let solid;
    
    if (action.type === "box") {
      // JSCAD: size=[X, Y, Z]
      solid = primitives.cuboid({ size: [action.w || 10, action.h || 10, action.d || 10], center: [0, 0, 0] });
    } else if (action.type === "cylinder") {
      solid = primitives.cylinder({ radius: action.r || 5, height: action.h || 10, segments: 32, center: [0, 0, 0] });
      // JSCAD از محور Z استفاده می‌کند، ما آن را به محور Y می‌چرخانیم تا با منطق ما هماهنگ شود
      solid = transforms.rotateX(Math.PI / 2, solid); 
    } else if (action.type === "sphere") {
      solid = primitives.sphere({ radius: action.r || 5, segments: 32, center: [0, 0, 0] });
    }

    if (solid) {
      solid = transforms.translate([action.x || 0, action.y || 0, action.z || 0], solid);

      if (!currentSolid) {
        currentSolid = solid;
      } else {
        const op = action.operation || "add";
        if (op === "add") {
          currentSolid = booleans.union(currentSolid, solid);
        } else if (op === "subtract") {
          currentSolid = booleans.subtract(currentSolid, solid);
        } else if (op === "intersect") {
          currentSolid = booleans.intersect(currentSolid, solid);
        }
      }
    }
  }

  if (!currentSolid) return "solid empty\nendsolid empty\n";
  
  // خروجی گرفتن با کتابخانه اختصاصی
  const rawData = stlSerializer.serialize({ binary: false }, currentSolid);
  return rawData[0];
}
