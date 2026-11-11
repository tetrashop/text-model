import { primitives, booleans, transforms, poly3, geom3, measurements } from '@jscad/modeling';
import stlSerializer from '@jscad/stl-serializer';
import objSerializer from '@jscad/obj-serializer';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

let cachedFont = null;

async function getFont() {
  if (cachedFont) return cachedFont;
  try {
    // دریافت فونت استاندارد از CDN
    const res = await fetch('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_regular.typeface.json');
    if (!res.ok) throw new Error("Font fetch failed");
    const json = await res.json();
    const loader = new FontLoader();
    cachedFont = loader.parse(json);
    return cachedFont;
  } catch (e) {
    console.error("Font load error:", e);
    return null;
  }
}

function createTextSolid(font, text, size, depth) {
  try {
    // استفاده از TextGeometry در Three.js برای مثلث‌بندی دقیق
    const geo = new TextGeometry(text, {
      font: font,
      size: size,
      height: depth,
      curveSegments: 6, // تعداد قطعات منحنی (تعادل بین دقت و سرعت)
    });
    
    geo.center();
    geo.rotateX(-Math.PI / 2); // خواباندن روی صفحه XZ و اکسترود به سمت Y

    const position = geo.attributes.position;
    const vertices = [];
    for (let i = 0; i < position.count; i++) {
      vertices.push([position.getX(i), position.getY(i), position.getZ(i)]);
    }
    
    const index = geo.index ? geo.index.array : null;
    const polygons = [];
    
    if (index) {
      for (let i = 0; i < index.length; i += 3) {
        const p1 = vertices[index[i]];
        const p2 = vertices[index[i+1]];
        const p3 = vertices[index[i+2]];
        try {
          polygons.push(poly3.create([p1, p2, p3]));
        } catch(e) {} // جلوگیری از خطای مثلث‌های ناقص
      }
    }
    
    if (polygons.length === 0) return null;
    return geom3.create(polygons);
  } catch (e) {
    console.error("Text solid creation error:", e);
    return null;
  }
}

function fallbackText(text, size) {
  // اگر فونت لود نشد، این مکعب‌های ساده را می‌سازیم تا برنامه کرش نکند
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
      const type = action.type === "cube" ? "box" : action.type;
      
      if (type === "box") {
        solid = primitives.cuboid({ size: [action.w || 10, action.h || 10, action.d || 10], center: [0, 0, 0] });
      } else if (type === "cylinder") {
        solid = primitives.cylinder({ radius: action.r || 5, height: action.h || 10, segments: 32, center: [0, 0, 0] });
        solid = transforms.rotateX(Math.PI / 2, solid); 
      } else if (type === "sphere") {
        solid = primitives.sphere({ radius: action.r || 5, segments: 32, center: [0, 0, 0] });
      } else if (type === "text") {
        const font = await getFont();
        if (font) solid = createTextSolid(font, action.text || "TEXT", action.size || 10, action.depth || 2);
        if (!solid) solid = fallbackText(action.text || "TEXT", action.size || 10);
      }

      if (solid) {
        solid = transforms.translate([action.x || 0, action.y || 0, action.z || 0], solid);
        if (!currentSolid) {
          currentSolid = solid;
        } else {
          const op = action.operation || "add";
          if (op === "add") currentSolid = booleans.union(currentSolid, solid);
          else if (op === "subtract") {
            try { currentSolid = booleans.subtract(currentSolid, solid); } 
            catch(e) { console.error("Boolean subtract failed, skipping text", e); }
          }
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
