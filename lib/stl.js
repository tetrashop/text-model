import { primitives, booleans, transforms } from '@jscad/modeling';
import stlSerializer from '@jscad/stl-serializer';
import objSerializer from '@jscad/obj-serializer';

const FONT = {
  'A': [[0,1,0],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
  'B': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,1,0]],
  'C': [[0,1,1],[1,0,0],[1,0,0],[1,0,0],[0,1,1]],
  'D': [[1,1,0],[1,0,1],[1,0,1],[1,0,1],[1,1,0]],
  'E': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,1,1]],
  'F': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,0,0]],
  'G': [[0,1,1],[1,0,0],[1,0,1],[1,0,1],[0,1,1]],
  'H': [[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
  'I': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
  'J': [[0,0,1],[0,0,1],[0,0,1],[1,0,1],[0,1,0]],
  'K': [[1,0,1],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
  'L': [[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
  'M': [[1,0,1],[1,1,1],[1,0,1],[1,0,1],[1,0,1]],
  'N': [[1,0,1],[1,1,1],[1,0,1],[1,0,1],[1,0,1]],
  'O': [[0,1,0],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
  'P': [[1,1,0],[1,0,1],[1,1,0],[1,0,0],[1,0,0]],
  'Q': [[0,1,0],[1,0,1],[1,0,1],[1,1,0],[0,1,1]],
  'R': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
  'S': [[0,1,1],[1,0,0],[0,1,0],[0,0,1],[1,1,0]],
  'T': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
  'U': [[1,0,1],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
  'V': [[1,0,1],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
  'W': [[1,0,1],[1,0,1],[1,0,1],[1,1,1],[1,0,1]],
  'X': [[1,0,1],[1,0,1],[0,1,0],[1,0,1],[1,0,1]],
  'Y': [[1,0,1],[1,0,1],[0,1,0],[0,1,0],[0,1,0]],
  'Z': [[1,1,1],[0,0,1],[0,1,0],[1,0,0],[1,1,1]],
  '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  '2': [[1,1,0],[0,0,1],[0,1,0],[1,0,0],[1,1,1]],
  '3': [[1,1,1],[0,0,1],[0,1,1],[0,0,1],[1,1,1]],
  '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  '6': [[0,1,1],[1,0,0],[1,1,1],[1,0,1],[0,1,1]],
  '7': [[1,1,1],[0,0,1],[0,1,0],[0,1,0],[0,1,0]],
  '8': [[0,1,0],[1,0,1],[0,1,0],[1,0,1],[0,1,0]],
  '9': [[0,1,1],[1,0,1],[0,1,1],[0,0,1],[1,1,0]],
  ' ': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]
};

// تابعی که خطاهای هوش مصنوعی را تصحیح می‌کند
function sanitizeAction(action) {
  const a = { ...action };
  if (a.type === "cube") a.type = "box";
  if (a.operation === "union") a.operation = "add";
  if (a.operation === "difference") a.operation = "subtract";

  // اگر هوش مصنوعی ابعاد را تو در تو داده بود
  if (a.size && typeof a.size === "object") {
    a.w = a.w || a.size.w || a.size.width || 10;
    a.h = a.h || a.size.h || a.size.height || 10;
    a.d = a.d || a.size.d || a.size.depth || 10;
  }
  // اگر موقعیت را تو در تو داده بود
  if (a.position && typeof a.position === "object") {
    a.x = a.x || a.position.x || 0;
    a.y = a.y || a.position.y || 0;
    a.z = a.z || a.position.z || 0;
  }
  // تبدیل مقادیر متنی به عدد
  ["w","h","d","r","x","y","z","size","depth"].forEach(k => {
    if (a[k] !== undefined && typeof a[k] === "string") {
      a[k] = parseFloat(a[k]) || 0;
    }
  });
  return a;
}

function createPixelText(text, size, depth) {
  let solids = [];
  const pixelSize = size / 5; 
  let xOffset = 0;

  const upperText = String(text).toUpperCase();
  
  for (let char of upperText) {
    const matrix = FONT[char] || FONT[' '];
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === 1) {
          const pX = xOffset + (c * pixelSize);
          const pY = -(r * pixelSize) + (size / 2);
          const box = primitives.cuboid({ size: [pixelSize, pixelSize, depth || 2], center: [0,0,0] });
          solids.push(transforms.translate([pX, pY, 0], box));
        }
      }
    }
    xOffset += (5 + 1) * pixelSize;
  }

  if (solids.length === 0) return null;
  
  let textSolid = booleans.union(...solids);
  const centerOffset = (xOffset - (6 * pixelSize)) / 2;
  textSolid = transforms.translate([-centerOffset, 0, 0], textSolid);
  textSolid = transforms.rotateX(Math.PI / 2, textSolid);
  return textSolid;
}

export async function specToSolid(spec) {
  let currentSolid = null;
  const rawActions = (spec.actions || spec.primitives || []).filter(Boolean);
  const actions = rawActions.map(sanitizeAction); // پاکسازی ورودی‌ها!

  for (const action of actions) {
    let solid;
    try {
      const type = action.type;
      
      if (type === "box") {
        solid = primitives.cuboid({ size: [action.w || 10, action.h || 10, action.d || 10], center: [0, 0, 0] });
      } else if (type === "cylinder") {
        solid = primitives.cylinder({ radius: action.r || 5, height: action.h || 10, segments: 32, center: [0, 0, 0] });
        solid = transforms.rotateX(Math.PI / 2, solid); 
      } else if (type === "sphere") {
        solid = primitives.sphere({ radius: action.r || 5, segments: 32, center: [0, 0, 0] });
      } else if (type === "text") {
        solid = createPixelText(action.text || "TEXT", action.size || 10, action.depth || 2);
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
