"use client";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { useMemo, useState, useEffect } from "react";

export default function ModelViewer({ spec }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!spec) return;
    // دریافت فایل از بک‌اند به جای ساخت در مرورگر
    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec })
    })
    .then(res => {
      if (!res.ok) throw new Error("خطا در ساخت مدل");
      return res.blob();
    })
    .then(blob => {
      setUrl(URL.createObjectURL(blob));
    })
    .catch(err => setError(err.message));
  }, [spec]);

  if (error) return <div style={{color: '#f66', padding: '1rem', textAlign: 'center'}}>خطا در نمایش: {error}</div>;
  if (!url) return <div style={{textAlign: "center", padding: "2rem"}}>در حال بارگذاری مدل...</div>;

  return (
    <div style={{ width: "100%", height: "300px", background: "#222", borderRadius: "8px", marginTop: "1rem" }}>
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
