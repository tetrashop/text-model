import { primitives, booleans, transforms, extrusions, measurements } from '@jscad/modeling';
import stlSerializer from '@jscad/stl-serializer';
import objSerializer from '@jscad/obj-serializer';
import svgDeserializer from '@jscad/svg-deserializer';
import opentype from 'opentype.js';

let cachedFont = null;

async function getFont() {
  if (cachedFont) return cachedFont;
  try {
    // دریافت فونت از سرور گوگل (پایدارتر)
    const res = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff'); // woff/ttf parser usually handles both, but let's use ttf to be safe
    // Using a reliable TTF CDN
    const ttfRes = await fetch('https://cdn.jsdelivr.net/gh/google/fonts@main/apache/roboto/static/Roboto-Regular.ttf');
    if (!ttfRes.ok) throw new Error("Font fetch failed");
    const buffer = await ttfRes.arrayBuffer();
    cachedFont = opentype.parse(buffer);
    return cachedFont;
  } catch (e) {
    console.error("Font load error:", e);
    return null;
  }
}

function createTextSolid(font, text, size, depth) {
  try {
    const path = font.getPath(text, 0, 0, size);
    const svgPathStr = path.toPathData(3);
    // ساخت یک ساختار SVG ساده برای پارس کردن
    const svgString = `<svg width="${size * text.length}" height="${size}" xmlns="http://www.w3.org/2000/svg"><path d="${svgPathStr}" /></svg>`;
    
    // پارس کردن SVG به شکل‌های دو بعدی
    const shapes = svgDeserializer.deserialize({ output: 'geometry', target: 'path' }, svgString);
    if (!shapes || shapes.length === 0) return null;

    // اکسترود کردن (سه‌بعدی کردن) و جمع کردن حروف
    const extrusionsList = shapes.map(shape => extrusions.extrudeLinear({ height: depth || 2 }, shape));
    let solid = booleans.union(...extrusionsList);

    // چرخش به صورتی که روی صفحه XZ (افقی) بخوابد
    solid = transforms.rotateX(-Math.PI / 2, solid);

    // وسط‌چین کردن دقیق متن
    const bounds = measurements.measureBoundingBox(solid);
    const center = [
      (bounds[0][0] + bounds[1][0]) / 2,
      (bounds[0][1] + bounds[1][1]) / 2,
      (bounds[0][2] + bounds[1][2]) / 2
    ];
    return transforms.translate([-center[0], -center[1], -center[2]], solid);
  } catch (e) {
    console.error("Text to SVG parse error:", e);
    return null;
  }
}

function fallbackText(text, size) {
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

export async function specToSolid(spec) {
  let currentSolid = null;
  const actions = (spec.actions || spec.primitives || []).filter(Boolean);

  for (const action of actions) {
    let solid;
    try {
      if (action.type === "box") {
        solid = primitives.cuboid({ size: [action.w || 10, action.h || 10, action.d || 10], center: [0, 0, 0] });
      } else if (action.type === "cylinder") {
        solid = primitives.cylinder({ radius: action.r || 5, height: action.h || 10, segments: 32, center: [0, 0, 0] });
        solid = transforms.rotateX(Math.PI / 2, solid); 
      } else if (action.type === "sphere") {
        solid = primitives.sphere({ radius: action.r || 5, segments: 32, center: [0, 0, 0] });
      } else if (action.type === "text") {
        const font = await getFont();
        if (font) {
          solid = createTextSolid(font, action.text || "TEXT", action.size || 10, action.depth || 2);
        }
        if (!solid) solid = fallbackText(action.text || "TEXT", action.size || 10);
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
    } catch (err) {
      console.error("Action failed:", action.type, err);
    }
  }
  return currentSolid;
}

export async function generateFile(spec, format = "stl") {
  const solid = await specToSolid(spec);
  if (!solid) return "solid empty\nendsolid empty\n";
  
  if (format === "obj") {
    const rawData = objSerializer.serialize({ binary: false }, solid);
    return rawData[0];
  } else {
    const rawData = stlSerializer.serialize({ binary: false }, solid);
    return rawData[0];
  }
}
