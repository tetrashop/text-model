"use client";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { useMemo, useState, useEffect, Component, Suspense } from "react";

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <div className="flex-1 flex items-center justify-center text-red-400 p-6 text-center">خطا در رندر مدل. لطفاً فایل STL را دانلود کنید.</div>;
    }
    return this.props.children;
  }
}

export default function ModelViewer({ spec }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!spec) return;
    setError(null);
    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec })
    })
    .then(async res => {
      if (!res.ok) throw new Error("خطا در پردازش سرور");
      const text = await res.text();
      if (!text.includes("solid")) throw new Error("مدل خالی است");
      const blob = new Blob([text], { type: "model/stl" });
      setUrl(URL.createObjectURL(blob));
    })
    .catch(err => setError(err.message));
  }, [spec]);

  if (error) return <div className="flex-1 flex items-center justify-center text-red-400 p-6 text-center font-bold">خطا: {error}</div>;
  if (!url) return <div className="flex-1 flex items-center justify-center text-brand animate-pulse">در حال بارگذاری مدل...</div>;

  return (
    <div className="w-full h-full relative">
      <ErrorBoundary>
        <Canvas shadows camera={{ position: [50, 50, 50], fov: 50 }}>
          <Stage environment="city" intensity={0.5}>
            <Suspense fallback={null}>
              <Model url={url} />
            </Suspense>
          </Stage>
          <OrbitControls autoRotate autoRotateSpeed={2} />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}

function Model({ url }) {
  const geom = useLoader(STLLoader, url);
  const memoizedGeom = useMemo(() => geom, [geom]);
  return (
    <mesh geometry={memoizedGeom} castShadow receiveShadow>
      <meshStandardMaterial color="#10b981" roughness={0.3} metalness={0.5} />
    </mesh>
  );
}
