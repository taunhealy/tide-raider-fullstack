"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface SpiralAnimationProps {
  size?: number;
  className?: string;
}

export function SpiralAnimation({
  size = 120,
  className = "",
}: SpiralAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;

    // Setup renderer with transparent background
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);

    // Clear any existing canvas
    if (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // Create multiple spiral layers for a more tribal look
    const createSpiral = (
      radius: number,
      height: number,
      thickness: number,
      color: number,
      turns: number,
      offset = 0
    ) => {
      const points = [];
      const numPoints = 1000;

      for (let i = 0; i < numPoints; i++) {
        const t = i / numPoints;
        const angle = t * Math.PI * turns + offset;
        const x = Math.cos(angle) * radius * t;
        const y = Math.sin(angle) * radius * t;
        const z = height * (1 - t) - height / 2;
        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 200, thickness, 8, false);

      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.7,
        roughness: 0.3,
        metalness: 0.3,
      });

      return new THREE.Mesh(geometry, material);
    };

    // Create multiple spiral layers with different properties
    const mainSpiral = createSpiral(2, 0.54, 0.08, 0x00e5ff, 10);
    const innerSpiral = createSpiral(1.2, 0.16, 0.02, 0x80ffff, 6, Math.PI / 1);

    // Add tribal pattern details
    const createTribalDetails = () => {
      const group = new THREE.Group();

      // Add small dots along a circular path
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const radius = 2.5;

        const dotGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const dotMaterial = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 1,
        });

        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);

        group.add(dot);
      }

      return group;
    };

    const tribalDetails = createTribalDetails();

    // Add all elements to the scene
    scene.add(mainSpiral);
    scene.add(innerSpiral);
    scene.add(tribalDetails);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // Add point light in center with pulsing effect
    const pointLight = new THREE.PointLight(0x00e5ff, 2, 10);
    pointLight.position.set(0, 0, 2);
    scene.add(pointLight);

    // Add subtle fog for mystical effect
    scene.fog = new THREE.FogExp2(0x004455, 0.1);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.01;
      const animationId = requestAnimationFrame(animate);

      // Rotate spirals at different speeds
      mainSpiral.rotation.z += 0.01;
      mainSpiral.rotation.y += 0.005;

      innerSpiral.rotation.z -= 0.015;
      innerSpiral.rotation.x += 0.003;

      tribalDetails.rotation.z -= 0.003;

      // Pulsing light effect
      pointLight.intensity = 1.5 + Math.sin(time * 2) * 0.5;

      // Subtle camera movement for more dynamic feel
      camera.position.x = Math.sin(time * 0.2) * 0.3;
      camera.position.y = Math.cos(time * 0.2) * 0.3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);

      // Cleanup function
      return () => {
        cancelAnimationFrame(animationId);
        renderer.dispose();
      };
    };

    const cleanup = animate();

    return () => {
      if (cleanup) cleanup();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: size,
        height: size,
        margin: "0 auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    />
  );
}
