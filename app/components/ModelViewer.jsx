"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { useMemo, useState, useEffect } from "react";

export default function ModelViewer({ spec }) {
  const [url, setUrl] = useState(null);

  // تولید STL در سمت کلاینت برای نمایش سریع
  useEffect(() => {
    if (!spec) return;
    import("@/lib/stl").then(({ specToSTL }) => {
      const stlString = specToSTL(spec);
      const blob = new Blob([stlString], { type: "application/octet-stream" });
      setUrl(URL.createObjectURL(blob));
    });
  }, [spec]);

  if (!url) return <div style={{textAlign: "center", padding: "2rem"}}>در حال آماده‌سازی نمایش...</div>;

  return (
    <div style={{ width: "100%", height: "400px", background: "#222", borderRadius: "8px", marginTop: "1rem" }}>
      <Canvas shadows camera={{ position: [50, 50, 50], fov: 50 }}>
        <Stage environment="city" intensity={0.5}>
          <Model url={url} />
        </Stage>
        <OrbitControls autoRotate />
      </Canvas>
    </div>
  );
}

function Model({ url }) {
  const geom = useLoader(STLLoader, url);
  const memoizedGeom = useMemo(() => geom, [geom]);
  return (
    <mesh geometry={memoizedGeom} castShadow receiveShadow>
      <meshStandardMaterial color="#3a6" roughness={0.3} metalness={0.4} />
    </mesh>
  );
}
