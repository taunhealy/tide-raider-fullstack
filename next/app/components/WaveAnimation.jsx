import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import { Vector3, Matrix4, Color, Quaternion } from "three";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";

const Wave = () => {
  const meshRef = useRef(null);
  const count = 200;
  const dummy = useMemo(() => new Vector3(), []);

  const positions = useMemo(() => {
    const pos = [];
    for (let xi = 0; xi < count; xi++) {
      for (let zi = 0; zi < count; zi++) {
        pos.push([xi * 0.5, 0, zi * 0.5]);
      }
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    positions.forEach(([x, y, z], i) => {
      if (!meshRef.current) return;

      const waveX = Math.sin(x * 0.5 + time) * 2;
      const waveZ = Math.cos(z * 0.5 + time) * 2;
      const yPos = Math.sin((x + z) * 0.5 + time * 2) * 2;

      meshRef.current.setColorAt(i, new Color(0x1cd9ff)); // Using brand tertiary color
      meshRef.current.setMatrixAt(
        i,
        new Matrix4().compose(
          new Vector3(x - count / 4, yPos + waveX + waveZ, z - count / 4),
          new Quaternion(),
          new Vector3(0.3, 0.3, 0.3)
        )
      );
    });

    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, positions.length]}
      position={[0, -2, 0]}
    >
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial
        vertexColors
        toneMapped={false}
        emissive={0x1cd9ff} // Brand tertiary color
        emissiveIntensity={0.5}
      />
    </instancedMesh>
  );
};

const PointsWave = () => {
  const meshRef = useRef(null);
  const simplex = new SimplexNoise();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const positions = meshRef.current.geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = 0.5 * simplex.noise3d(x / 2, y / 2, t / 2000);
      positions.setZ(i, z * 2);
    }
    positions.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <planeGeometry args={[6, 4, 150, 100]} />
      <pointsMaterial
        size={0.05}
        color={0x1cd9ff} // Brand tertiary color
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={2}
      />
    </points>
  );
};

export const WaveAnimation = () => (
  <Canvas camera={{ position: [4, 3, 10], fov: 50 }}>
    <ambientLight intensity={0.5} />
    <pointLight position={[10, 10, 10]} color={0x1cd9ff} intensity={1.5} />
    <Wave />
    <PointsWave />
  </Canvas>
);
