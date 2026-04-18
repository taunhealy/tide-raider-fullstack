'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * RetroCRTOverlay - Vanilla Three.js Implementation
 * This bypasses the React 19 / Fiber reconciler conflict by using raw Three.js.
 * Implements Barrel Distortion (Bulge), Scanlines, and Chromatic Aberration via GLSL.
 */
export const RetroCRTOverlay = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ 
        canvas, 
        alpha: true, 
        antialias: false 
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uResolution;
        varying vec2 vUv;

        // --- BARREL DISTORTION (BULGE) ---
        vec2 barrelDistortion(vec2 coord, float amt) {
          vec2 cc = coord - 0.5;
          float dist = dot(cc, cc);
          return coord + cc * dist * amt;
        }

        void main() {
          // 1. Apply Bulge
          vec2 uv = barrelDistortion(vUv, 0.15);

          // Black out edges outside the bulge
          if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.6); // Bezel Shadow
            return;
          }

          // 2. Animated Scanlines
          float scanSpeed = uTime * 2.0;
          float scanline = sin((uv.y * uResolution.y * 1.5) + scanSpeed) * 0.12;
          
          // Rolling Dark Bar (VHS Style)
          float rollingBar = sin(uv.y * 4.0 - uTime * 0.5);
          rollingBar = smoothstep(0.9, 1.0, rollingBar) * 0.15;

          // 3. RGB Split (Chromatic Aberration Simulation)
          // We'll simulate color bleed at the scanline edges
          float red = 0.0;
          
          // Final color composition (Subtle analog tint)
          vec3 color = vec3(0.015, 0.015, 0.015); // Dark base
          color -= scanline;
          color -= rollingBar;
          
          // Add some noise (Flicker)
          float noise = (fract(sin(dot(uv + uTime * 0.1, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.06;
          color += noise;

          // Vignette
          float vignette = 1.0 - smoothstep(0.4, 0.7, length(vUv - 0.5));
          color *= vignette;

          gl_FragColor = vec4(color, 0.35); // Transparency for the entire overlay
        }
      `
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animationId: number;
    const animate = (time: number) => {
      material.uniforms.uTime.value = time * 0.001;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate(0);

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Physical Hardware Elements (CSS) */}
      <div className="absolute inset-0 z-10">
         <div className="absolute inset-x-[-2%] inset-y-[-2%] border-[40px] border-black rounded-[100px] shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] opacity-95" />
         
         <div className="absolute top-12 left-12 flex flex-col gap-1 mix-blend-screen opacity-90">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
               <span className="text-white font-mono text-[10px] tracking-[0.4em] uppercase font-black">Field_Intel::REC</span>
            </div>
            <span className="text-white font-mono text-[9px] tracking-widest opacity-40 uppercase">Satellite_Uplink: 2.0_SECURE</span>
         </div>

         <div className="absolute bottom-12 right-12 flex flex-col items-end gap-1 opacity-40 text-white font-mono text-[8px]">
            <span>DC 12.8V</span>
            <span>OSD_BUILD: FINAL_SENTINEL</span>
         </div>
      </div>
    </div>
  );
};
