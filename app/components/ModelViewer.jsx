"use client";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { useMemo, useState, useEffect, Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <div style={{color: '#f66', padding: '1rem', textAlign: 'center'}}>خطا در بارگذاری مدل. لطفا فایل را دانلود کنید.</div>;
    }
    return this.props.children;
  }
}

export default function ModelViewer({ spec }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!spec) return;
    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec })
    })
    .then(async res => {
      if (!res.ok) throw new Error("خطا در ساخت مدل");
      const blob = await res.blob();
      if (blob.size < 50) throw new Error("مدل خالی است");
      setUrl(URL.createObjectURL(blob));
    })
    .catch(err => setError(err.message));
  }, [spec]);

  if (error) return <div style={{color: '#f66', padding: '1rem', textAlign: 'center'}}>خطا: {error}</div>;
  if (!url) return <div style={{textAlign: "center", padding: "2rem"}}>در حال بارگذاری...</div>;

  return (
    <div style={{ width: "100%", height: "300px", background: "#222", borderRadius: "8px", marginTop: "1rem" }}>
      <ErrorBoundary>
        <Canvas shadows camera={{ position: [50, 50, 50], fov: 50 }}>
          <Stage environment="city" intensity={0.5}>
            <Model url={url} />
          </Stage>
          <OrbitControls autoRotate />
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
      <meshStandardMaterial color="#3a6" roughness={0.3} metalness={0.4} />
    </mesh>
  );
}
