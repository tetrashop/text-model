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

    const controller = new AbortController();
    // اگر سرور بیشتر از ۱۵ ثانیه طول کشید، درخواست را لغو کن
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec }),
      signal: controller.signal
    })
    .then(async res => {
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `خطای سرور (${res.status})`);
      }
      const text = await res.text();
      
      // بررسی اینکه آیا سرور به جای فایل، خطا برگردانده است
      if (text.startsWith("{")) throw new Error("خطا در ساخت هندسه مدل");
      if (!text || text.length < 50) throw new Error("مدل خالی تولید شد");

      try {
        const loader = new STLLoader();
        const geo = loader.parse(text);
        setGeometry(geo);
      } catch (parseErr) {
        throw new Error("فرمت فایل STL نامعتبر است");
      }
    })
    .catch(err => {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError("زمان پردازش طولانی شد. لطفاً دوباره تلاش کنید یا فایل را دانلود کنید.");
      } else {
        setError(err.message);
      }
    })
    .finally(() => {
      setLoading(false);
    });
  }, [spec]);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center text-brand space-y-4">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      <p className="animate-pulse font-medium">در حال ساخت و بارگذاری مدل سه‌بعدی...</p>
      <p className="text-xs text-slate-400">(اگر طولانی شد، می‌توانید از دکمه‌های بالا فایل را دانلود کنید)</p>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center text-red-400 p-6 text-center">
      <p className="font-bold mb-2">خطا در رندر مدل</p>
      <p className="text-sm">{error}</p>
    </div>
  );

  if (!geometry) return <div className="flex-1 flex items-center justify-center text-slate-400">مدل خالی است.</div>;

  return (
    <div className="w-full h-full relative">
      <Canvas shadows camera={{ position: [50, 50, 50], fov: 50 }}>
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
