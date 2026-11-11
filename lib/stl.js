import { primitives, booleans, transforms, serializers } from '@jscad/modeling';

export function specToSTL(spec) {
  let currentSolid = null;

  // استفاده از actions به جای primitives برای پشتیبانی از عملیات
  const actions = spec.actions || spec.primitives || [];

  for (const action of actions) {
    let solid;
    
    // ساخت شکل پایه
    if (action.type === "box") {
      solid = primitives.cuboid({ size: [action.w || 10, action.h || 10, action.d || 10], center: [0, 0, 0] });
    } else if (action.type === "cylinder") {
      solid = primitives.cylinder({ radius: action.r || 5, height: action.h || 10, segments: 32, center: [0, 0, 0] });
      // JSCAD از محور Z استفاده می‌کند، ما آن را به محور Y می‌چرخانیم تا با منطق قبلی هماهنگ باشد
      solid = transforms.rotateX(Math.PI / 2, solid); 
    } else if (action.type === "sphere") {
      solid = primitives.sphere({ radius: action.r || 5, segments: 32, center: [0, 0, 0] });
    }

    // جابه‌جایی در فضا
    if (solid) {
      solid = transforms.translate([action.x || 0, action.y || 0, action.z || 0], solid);

      // اعمال عملیات (جمع یا تفریق)
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
  
  // خروجی گرفتن به صورت STL (متن)
  return serializers.stl.serialize({ binary: false }, currentSolid);
}
