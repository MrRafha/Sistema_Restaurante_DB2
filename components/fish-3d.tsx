"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import type { Group } from "three";

function FishModel() {
  const { scene } = useGLTF("/Meshy_AI_Dripping_Fish_Skeleto_0505033658_generate.glb");
  const ref = useRef<Group>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.6;
  });

  return <primitive ref={ref} object={scene} />;
}

export function Fish3D({ className = "" }: { className?: string }) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0, 2], fov: 45 }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 3]} intensity={1.2} />
        <Suspense fallback={null}>
          <FishModel />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
