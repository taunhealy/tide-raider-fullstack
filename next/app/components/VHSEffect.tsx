"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

interface VHSEffectProps {
  className?: string;
}

export default function VHSEffect({ className }: VHSEffectProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    // Fixed positioning for scroll effect
    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "9999";
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // VHS distortion material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 resolution;
        varying vec2 vUv;
        
        float rand(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
        }
        
        void main() {
          vec2 uv = vUv;
          
          // Reduced distortion intensity
          uv.x += sin(uv.y * 20.0 + time * 2.0) * 0.01;
          uv.y += sin(time * 1.5) * 0.001;
          
          // Softer yellow tracking line
          float yellowLine = smoothstep(0.997, 0.999, sin(uv.y * 100.0 + time * 3.0)) * 0.2;
          yellowLine *= smoothstep(0.4, 0.6, rand(vec2(time * 0.1, floor(uv.y * 50.0)))) * vignette;
          
          // Subtler scanlines
          float scanPos = fract(uv.y * 1.5 + time * 0.2);
          float scanline = smoothstep(0.4, 0.6, sin(scanPos * 3.1415 * 2.0)) * 0.05;
          scanline += rand(vec2(uv.y * 100.0, time * 0.1)) * 0.06;
          
          // Vertical noise interference
          float verticalNoise = smoothstep(0.95, 0.99, rand(vec2(uv.x * 50.0, floor(time * 2.0)))) * 0.2;
          
          // Color channel offsets
          float rOffset = 0.005 * sin(time * 0.25);
          float gOffset = 0.005 * sin(time * 0.3 + 1.0);
          float bOffset = 0.005 * sin(time * 0.35 + 2.0);
          
          // Tape-like distortion
          float warp = sin(uv.x * 30.0 + time * 2.0) * 0.005;
          uv.x += warp * (0.5 + 0.5 * sin(time * 0.5));
          
          // Vignette
          float vignette = 1.0 - length(uv - 0.5) * 1.5;
          vignette = pow(vignette, 2.0);
          
          // Final color composition
          vec3 baseColor = vec3(
            rand(uv * vec2(time * 0.3)) * 0.3 + scanline,
            rand(uv * vec2(time * 0.25)) * 0.3 + scanline,
            rand(uv * vec2(time * 0.2)) * 0.3 + scanline
          );
          
          // Add yellow line with fade-out
          vec3 finalColor = mix(baseColor, vec3(1.0, 0.8, 0.1), yellowLine * vignette);
          finalColor = mix(finalColor, vec3(0.0), verticalNoise);
          
          gl_FragColor = vec4(
            finalColor.r * (1.0 - rOffset),
            finalColor.g * (1.0 - gOffset),
            finalColor.b * (1.0 - bOffset),
            0.5
          );
        }
      `,
    });

    // Fullscreen plane
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(plane);

    console.log(
      "WebGL context status:",
      renderer.getContext().isContextLost() ? "Lost" : "Active"
    );
    console.log(
      "Canvas dimensions:",
      renderer.domElement.width,
      "x",
      renderer.domElement.height
    );

    camera.position.z = 1;

    // Handle window resize
    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.resolution.value.set(
        window.innerWidth,
        window.innerHeight
      );
    };
    window.addEventListener("resize", onResize);

    // Animation
    let frame = 0;
    const animate = () => {
      frame += 0.01;
      material.uniforms.time.value = frame;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      console.log("Cleaning up VHS effect...");
      window.removeEventListener("resize", onResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} style={{ zIndex: -1 }} />;
}
