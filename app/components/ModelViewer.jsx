"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { useState, useEffect } from "react";

export default function ModelViewer({ spec }) {
  const [geometry, setGeometry] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!spec) return;
    setLoading(true);
    setError(null);
    setGeometry(null);

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec })
    })
    .then(async res => {
      if (!res.ok) throw new Error("خطا در پردازش سرور");
      const text = await res.text();
      if (!text.includes("facet") && !text.includes("vertex")) {
        throw new Error("مدل خالی است (هندسه معتبری یافت نشد)");
      }
      
      const loader = new STLLoader();
      // استفاده از لودر دستی به جای useLoader برای جلوگیری از کرش کردن React
      loader.parse(text, (geo) => {
        setGeometry(geo);
        setLoading(false);
      }, (err) => {
        setError("خطا در خواندن فایل STL");
        setLoading(false);
      });
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [spec]);

  if (loading) return <div className="flex-1 flex items-center justify-center text-brand animate-pulse font-medium">در حال آماده‌سازی مدل سه‌بعدی...</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-400 p-6 text-center font-bold">خطا: {error}</div>;
  if (!geometry) return <div className="flex-1 flex items-center justify-center text-slate-400">مدل خالی است.</div>;

  return (
    <div className="w-full h-full relative">
      <Canvas shadows camera={{ position: [50, 50, 50], fov: 50 }}>
        {/* نورپردازی ساده به جای Stage برای جلوگیری از خطای موبایل */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} />
        
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial color="#10b981" roughness={0.3} metalness={0.4} />
        </mesh>
        
        <OrbitControls autoRotate autoRotateSpeed={2} makeDefault />
      </Canvas>
    </div>
  );
}
