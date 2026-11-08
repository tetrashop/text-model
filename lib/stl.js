function facet(v1, v2, v3) {
  const u = [v2[0]-v1[0], v2[1]-v1[1], v2[2]-v1[2]];
  const w = [v3[0]-v1[0], v3[1]-v1[1], v3[2]-v1[2]];
  const n = [u[1]*w[2]-u[2]*w[1], u[2]*w[0]-u[0]*w[2], u[0]*w[1]-u[1]*w[0]];
  const len = Math.hypot(n[0], n[1], n[2]) || 1;
  const nx = n[0]/len, ny = n[1]/len, nz = n[2]/len;
  return "  facet normal " + nx + " " + ny + " " + nz + "\n    outer loop\n" +
    "      vertex " + v1[0] + " " + v1[1] + " " + v1[2] + "\n" +
    "      vertex " + v2[0] + " " + v2[1] + " " + v2[2] + "\n" +
    "      vertex " + v3[0] + " " + v3[1] + " " + v3[2] + "\n" +
    "    endloop\n  endfacet\n";
}

function box(p) {
  const w=p.w||10, h=p.h||10, d=p.d||10, x=p.x||0, y=p.y||0, z=p.z||0;
  const hw=w/2, hh=h/2, hd=d/2;
  const v = [
    [x-hw,y-hh,z-hd],[x+hw,y-hh,z-hd],[x+hw,y+hh,z-hd],[x-hw,y+hh,z-hd],
    [x-hw,y-hh,z+hd],[x+hw,y-hh,z+hd],[x+hw,y+hh,z+hd],[x-hw,y+hh,z+hd]
  ];
  const tris = [
    [0,1,2],[0,2,3],[5,4,7],[5,7,6],[4,0,3],[4,3,7],
    [1,5,6],[1,6,2],[3,2,6],[3,6,7],[4,5,1],[4,1,0]
  ];
  return tris.map(t => facet(v[t[0]], v[t[1]], v[t[2]])).join("");
}

function cylinder(p) {
  const r=p.r||5, h=p.h||10, x=p.x||0, y=p.y||0, z=p.z||0;
  const seg=32, hh=h/2;
  const bot=[], top=[];
  for (let i=0;i<seg;i++){
    const a=2*Math.PI*i/seg;
    bot.push([x+r*Math.cos(a), y-hh, z+r*Math.sin(a)]);
    top.push([x+r*Math.cos(a), y+hh, z+r*Math.sin(a)]);
  }
  let s="";
  for (let i=0;i<seg;i++){
    const j=(i+1)%seg;
    s += facet(bot[i], top[i], top[j]);
    s += facet(bot[i], top[j], bot[j]);
  }
  const cb=[x,y-hh,z], ct=[x,y+hh,z];
  for (let i=0;i<seg;i++){
    const j=(i+1)%seg;
    s += facet(cb, bot[j], bot[i]);
    s += facet(ct, top[i], top[j]);
  }
  return s;
}

function sphere(p) {
  const r=p.r||5, x=p.x||0, y=p.y||0, z=p.z||0;
  const seg=24, rings=16;
  const pts=[];
  for (let i=0;i<=rings;i++){
    const phi=Math.PI*i/rings;
    const row=[];
    for (let j=0;j<seg;j++){
      const th=2*Math.PI*j/seg;
      row.push([x+r*Math.sin(phi)*Math.cos(th), y+r*Math.cos(phi), z+r*Math.sin(phi)*Math.sin(th)]);
    }
    pts.push(row);
  }
  let s="";
  for (let i=0;i<rings;i++){
    for (let j=0;j<seg;j++){
      const j2=(j+1)%seg;
      s += facet(pts[i][j], pts[i+1][j], pts[i+1][j2]);
      s += facet(pts[i][j], pts[i+1][j2], pts[i][j2]);
    }
  }
  return s;
}

export function specToSTL(spec) {
  let out = "solid " + (spec.name || "model") + "\n";
  for (const p of spec.primitives || []) {
    if (p.type === "box") out += box(p);
    else if (p.type === "cylinder") out += cylinder(p);
    else if (p.type === "sphere") out += sphere(p);
  }
  out += "endsolid " + (spec.name || "model") + "\n";
  return out;
}
