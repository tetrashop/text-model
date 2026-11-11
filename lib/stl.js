import { primitives, booleans, transforms, extrusions, paths, expansions } from '@jscad/modeling';
import stlSerializer from '@jscad/stl-serializer';
import objSerializer from '@jscad/obj-serializer';
import opentype from 'opentype.js';

// یک فونت ساده وکتور برای استفاده داخلی (برای جلوگیری از دانلود فونت سنگین در سرور)
// در نسخه واقعی می‌توانید فونت دلخواه را لود کنید.
const FONT_DATA = null; // فعلاً از مکعب‌های ریز استفاده نمی‌کنیم، بلکه از یک روش ساده‌تر

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
    } else if (action.type === "text") {
      // ساخت متن با استفاده از حروف ساده (برای جلوگیری از خطای فونت در سرور)
      // این یک جایگزین ساده برای نمایش عملکرد است.
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

// تابع ساخت هندسه ساده برای متن (شبیه‌سازی حکاکی)
function createTextSolid(text, size) {
  // برای جلوگیری از پیچیدگی فونت، فقط یک خط ساده روی سطح ایجاد می‌کنیم
  // در نسخه صنعتی، اینجا از opentype.js برای خواندن فونت TTF استفاده می‌شود.
  let solids = [];
  for (let i = 0; i < text.length; i++) {
    // ایجاد حروف شبیه‌سازی شده با مکعب (به عنوان placeholder)
    const charBox = primitives.cuboid({ size: [size * 0.6, size, size * 0.2], center: [0, 0, 0] });
    const translated = transforms.translate([(i * size) - (text.length * size / 2), 0, 0], charBox);
    solids.push(translated);
  }
  return booleans.union(...solids);
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
