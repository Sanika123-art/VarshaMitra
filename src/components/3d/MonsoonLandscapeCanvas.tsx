"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function MonsoonLandscapeCanvas({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c251f);
    scene.fog = new THREE.FogExp2(0x0c251f, 0.035);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 10);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x2878a5, 0.9); // Monsoon rain blue ambient
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xe6a52e, 2.2); // Harvest gold sunbeam breaking through clouds
    sunLight.position.set(6, 12, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x3b8b61, 1.4); // Fresh crop green rim light
    rimLight.position.set(-8, 6, -6);
    scene.add(rimLight);

    // 3. Layered Terraced Agricultural Land (Stepped Farm Fields)
    const terrainGeo = new THREE.PlaneGeometry(24, 24, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2.3);

    const posAttr = terrainGeo.attributes.position;
    const initialPositions = posAttr.array.slice() as Float32Array;

    // Shape into organic stepped terraces
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      // Terraced terraces pattern
      const wave = Math.sin(x * 0.45) * Math.cos(y * 0.4) * 1.3;
      const stepped = Math.floor(wave * 3.5) / 3.5;
      const microRidge = Math.sin(x * 2.8) * 0.15; // Farm furrows / crop rows
      posAttr.setZ(i, stepped + microRidge);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x123c32, // Deep forest green
      roughness: 0.82,
      metalness: 0.12,
      flatShading: true,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.set(0, -1.8, -2);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Contour Accent Wireframe Overlay
    const wireGeo = new THREE.WireframeGeometry(terrainGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x3b8b61,
      transparent: true,
      opacity: 0.16,
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    wireframe.position.copy(terrain.position);
    scene.add(wireframe);

    // 4. Floating 3D Monsoon Cloud Clusters
    const cloudGroup = new THREE.Group();
    const cloudGeo = new THREE.DodecahedronGeometry(0.85, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0x172b4d, // Monsoon navy cloud tone
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
    });

    for (let i = 0; i < 9; i++) {
      const cloudPuff = new THREE.Mesh(cloudGeo, cloudMat);
      const angle = (i / 9) * Math.PI * 2;
      const rad = 2.4 + Math.random() * 1.8;
      cloudPuff.position.set(
        Math.cos(angle) * rad,
        3.6 + (Math.random() - 0.5) * 0.8,
        Math.sin(angle) * 1.2 - 1.5
      );
      const s = 1.0 + Math.random() * 1.4;
      cloudPuff.scale.set(s * 1.6, s * 0.8, s);
      cloudPuff.castShadow = true;
      cloudGroup.add(cloudPuff);
    }
    scene.add(cloudGroup);

    // 5. Cascading Monsoon Rain Particles
    const rainCount = 1400;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    const rainVelocities = new Float32Array(rainCount);

    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 22;
      rainPositions[i * 3 + 1] = Math.random() * 14 - 1;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 18;
      rainVelocities[i] = 0.18 + Math.random() * 0.14;
    }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x9ed1e8,
      size: 0.07,
      transparent: true,
      opacity: 0.65,
    });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    scene.add(rainParticles);

    // 6. Mouse parallax effect
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    window.addEventListener("mousemove", handleMouseMove);

    // 7. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 8. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Slow organic cloud rotation & breath
      cloudGroup.rotation.y = time * 0.04;
      cloudGroup.position.y = Math.sin(time * 0.6) * 0.15;

      // Subtle crop canopy sway
      const currentPos = terrainGeo.attributes.position;
      for (let i = 0; i < currentPos.count; i++) {
        const initZ = initialPositions[i * 3 + 2];
        const x = currentPos.getX(i);
        const y = currentPos.getY(i);
        currentPos.setZ(i, initZ + Math.sin(time * 1.5 + x * 0.8 + y * 0.5) * 0.04);
      }
      currentPos.needsUpdate = true;

      // Rain fall simulation
      const rainPos = rainGeo.attributes.position;
      const arr = rainPos.array as Float32Array;
      for (let i = 0; i < rainCount; i++) {
        arr[i * 3 + 1] -= rainVelocities[i]; // Fall
        arr[i * 3] += 0.02; // Wind slant

        if (arr[i * 3 + 1] < -2.2) {
          arr[i * 3 + 1] = 11;
          arr[i * 3] = (Math.random() - 0.5) * 22;
        }
      }
      rainPos.needsUpdate = true;

      // Camera parallax
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.03;
      camera.position.y += (4.2 + mouseY * 0.8 - camera.position.y) * 0.03;
      camera.lookAt(0, 0.4, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      rainGeo.dispose();
      rainMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className={className || "h-full w-full"} />;
}
