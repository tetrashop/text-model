import { primitives, booleans, transforms, extrusions, geom2, measurements } from '@jscad/modeling';
import stlSerializer from '@jscad/stl-serializer';
import objSerializer from '@jscad/obj-serializer';
import opentype from 'opentype.js';
import fs from 'fs';
import path from 'path';

let cachedFont = null;

function getFont() {
  if (cachedFont) return cachedFont;
  try {
    // خواندن فونت از پوشه public (بدون نیاز به اینترنت)
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
    const buffer = fs.readFileSync(fontPath);
    cachedFont = opentype.parse(buffer.buffer);
    return cachedFont;
  } catch (e) {
    console.error("Font load error:", e.message);
    return null;
  }
}

// پارسر اختصاصی که منحنی‌های فونت را به خطوط تبدیل می‌کند
function pathToGeom2(opentypePath) {
  const contours = [];
  let currentPoints = [];

  for (const cmd of opentypePath.commands) {
    if (cmd.type === 'M') {
      if (currentPoints.length > 2) contours.push(currentPoints);
      currentPoints = [[cmd.x, -cmd.y]];
    } else if (cmd.type === 'L') {
      currentPoints.push([cmd.x, -cmd.y]);
    } else if (cmd.type === 'C') {
      let p0 = currentPoints[currentPoints.length - 1];
      let p1 = [cmd.x1, -cmd.y1];
      let p2 = [cmd.x2, -cmd.y2];
      let p3 = [cmd.x, -cmd.y];
      // تبدیل منحنی بزیه به ۵ نقطه
      for (let t = 0.2; t <= 1.0; t += 0.2) {
        let mt = 1 - t;
        currentPoints.push([
          mt*mt*mt*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t*t*t*p3[0],
          mt*mt*mt*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t*t*t*p3[1]
        ]);
      }
    } else if (cmd.type === 'Q') {
      let p0 = currentPoints[currentPoints.length - 1];
      let p1 = [cmd.x1, -cmd.y1];
      let p2 = [cmd.x, -cmd.y];
      for (let t = 0.2; t <= 1.0; t += 0.2) {
        let mt = 1 - t;
        currentPoints.push([
          mt*mt*p0[0] + 2*mt*t*p1[0] + t*t*p2[0],
          mt*mt*p0[1] + 2*mt*t*p1[1] + t*t*p2[1]
        ]);
      }
    } else if (cmd.type === 'Z') {
      if (currentPoints.length > 2) contours.push(currentPoints);
      currentPoints = [];
    }
  }
  if (currentPoints.length > 2) contours.push(currentPoints);

  if (contours.length === 0) return null;
  return geom2.create(contours);
}

function createTextSolid(font, text, size, depth) {
  try {
    const p = font.getPath(text, 0, 0, size);
    const shape = pathToGeom2(p);
    if (!shape) return null;

    let solid = extrusions.extrudeLinear({ height: depth || 2 }, shape);
    solid = transforms.rotateX(-Math.PI / 2, solid); // خواباندن روی صفحه XZ

    // وسط چین کردن دقیق متن
    const bounds = measurements.measureBoundingBox(solid);
    const center = [
      (bounds[0][0] + bounds[1][0]) / 2,
      (bounds[0][1] + bounds[1][1]) / 2,
      (bounds[0][2] + bounds[1][2]) / 2
    ];
    return transforms.translate([-center[0], -center[1], -center[2]], solid);
  } catch (e) {
    console.error("Text generation error:", e);
    return null;
  }
}

export async function specToSolid(spec) {
  let currentSolid = null;
  const actions = (spec.actions || spec.primitives || []).filter(Boolean);

  for (const action of actions) {
    let solid;
    try {
      const type = action.type === "cube" ? "box" : action.type; // مقاوم سازی
      
      if (type === "box") {
        solid = primitives.cuboid({ size: [action.w || 10, action.h || 10, action.d || 10], center: [0, 0, 0] });
      } else if (type === "cylinder") {
        solid = primitives.cylinder({ radius: action.r || 5, height: action.h || 10, segments: 32, center: [0, 0, 0] });
        solid = transforms.rotateX(Math.PI / 2, solid); 
      } else if (type === "sphere") {
        solid = primitives.sphere({ radius: action.r || 5, segments: 32, center: [0, 0, 0] });
      } else if (type === "text") {
        const font = getFont();
        if (font) solid = createTextSolid(font, action.text || "TEXT", action.size || 10, action.depth || 2);
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
