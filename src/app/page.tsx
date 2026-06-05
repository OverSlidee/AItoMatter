"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Layers, 
  Cpu, 
  Sparkles, 
  CheckCircle, 
  ChevronRight, 
  Activity, 
  Gauge,
  Binary 
} from "lucide-react";
import * as THREE from "three";
import { motion, useScroll, useSpring } from "framer-motion";

export default function LandingPage() {
  const threeRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"voxel" | "optimized" | "linkages" | "production">("voxel");
  
  const currentScrollFraction = useRef(0);

  // Framer Motion Scroll Progress Indicator
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const scrollToSection = (index: number) => {
    const el = document.getElementById(`section-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Synchronize activeTab state with scroll fraction
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest < 0.25) {
        setActiveTab("voxel");
      } else if (latest < 0.5) {
        setActiveTab("optimized");
      } else if (latest < 0.75) {
        setActiveTab("linkages");
      } else {
        setActiveTab("production");
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Presets mapping to prompts (Bionic Alien Machine Part generations)
  const presets = {
    voxel: {
      title: "Gen 1: Voxel Lattice",
      desc: "Raw spatial topological synthesis. Generates the core load-bearing lattice structure based on localized strain profiles.",
      prompt: "Synthesize organic structural lattice for a 12-DoF quadruped knee roll joint, optimize for 400N torque, resolution 100um.",
      spec: "Lattice Nodes: 1,420 | Resolution: 100µm"
    },
    optimized: {
      title: "Gen 2: Stress Shell",
      desc: "Finite Element stress analysis shell generation. Wraps the lattice in a variable-thickness protective exoskeleton.",
      prompt: "Generate adaptive variable-thickness protective shell over knee roll joint lattice, thicken stress-concentration nodes.",
      spec: "Thickness: 1.2 - 4.5mm | Stress Limit: 320MPa"
    },
    linkages: {
      title: "Gen 3: Kinematic Linkages",
      desc: "Integration of quasi-direct drive (QDD) mounts, hydraulic pistons, and closed-loop bionic transmission linkages.",
      prompt: "Integrate QDD motor flange mounts and dual closed-loop hydraulic linkages for abduction joint flexion clearance.",
      spec: "Joint Type: Closed-loop | DoF: 3 per leg"
    },
    production: {
      title: "Gen 4: Production 3MF",
      desc: "Final watertight solid voxel compilation. Unifies all structural layers into a single manifold print-ready file.",
      prompt: "Compile combined bionic knee joint assembly into watertight production-ready 3MF file format, optimized for SLM Titanium.",
      spec: "Manifold: 100% Watertight | Material: Titanium"
    }
  };

  // Dynamic Three.js CAD Model Swap and Camera Parallax Animation
  useEffect(() => {
    if (!threeRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b); // Obsidian dark background

    const camera = new THREE.PerspectiveCamera(
      45,
      threeRef.current.clientWidth / threeRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(14, 8, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(threeRef.current.clientWidth, threeRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    threeRef.current.innerHTML = "";
    threeRef.current.appendChild(renderer.domElement);

    // Warm high-contrast industrial lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffb74d, 1.4); // Warm copper key light
    keyLight.position.set(8, 12, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x475569, 0.8); // Muted slate fill light
    fillLight.position.set(-8, -4, 6);
    scene.add(fillLight);

    const topWhiteLight = new THREE.DirectionalLight(0xffffff, 0.4);
    topWhiteLight.position.set(0, 15, 0);
    scene.add(topWhiteLight);

    // Subtle dark technical coordinate grid
    const gridHelper = new THREE.GridHelper(35, 28, 0xca8a04, 0x18181b);
    gridHelper.position.y = -3.8;
    scene.add(gridHelper);

    const previewGroup = new THREE.Group();

    // Material definitions
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x27272a, // Obsidian Titanium (dark gray/black)
      metalness: 0.9,
      roughness: 0.22
    });
    
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Rich brass/gold
      metalness: 0.85,
      roughness: 0.25
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Matte copper
      metalness: 0.9,
      roughness: 0.18
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xd97706, // Translucent warm orange/amber
      transparent: true,
      opacity: 0.25
    });

    const voxelWireMat = new THREE.MeshBasicMaterial({
      color: 0x3f3f46,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });

    const coreGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffa726,
      transparent: true,
      opacity: 0.85
    });

    const ringGlowMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.9
    });

    // 1. Central Core Sphere
    const coreGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const coreMesh = new THREE.Mesh(coreGeo, coreGlowMat);
    coreMesh.userData = {
      originalPos: coreMesh.position.clone(),
      explodeDir: new THREE.Vector3(0, 1.8, 0),
      explodeScale: 1.2
    };
    previewGroup.add(coreMesh);

    // 2. Core Torus Ring
    const coreRingGeo = new THREE.TorusGeometry(1.4, 0.08, 16, 48);
    coreRingGeo.rotateX(Math.PI / 2);
    const coreRingMesh = new THREE.Mesh(coreRingGeo, ringGlowMat);
    coreRingMesh.userData = {
      originalPos: coreRingMesh.position.clone(),
      isGlowRing: true,
      originalScale: 1.0,
      explodeDir: new THREE.Vector3(0, 1.8, 0),
      explodeScale: 1.2
    };
    previewGroup.add(coreRingMesh);

    // 3. Inner Lattice Web (6 bionic struts)
    const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.6, 8);
    
    const s1 = new THREE.Mesh(strutGeo, brassMat);
    s1.rotation.x = Math.PI / 4;
    const s2 = new THREE.Mesh(strutGeo, brassMat);
    s2.rotation.x = -Math.PI / 4;
    const s3 = new THREE.Mesh(strutGeo, brassMat);
    s3.rotation.z = Math.PI / 4;
    const s4 = new THREE.Mesh(strutGeo, brassMat);
    s4.rotation.z = -Math.PI / 4;
    const s5 = new THREE.Mesh(strutGeo, brassMat);
    s5.rotation.y = Math.PI / 4;
    const s6 = new THREE.Mesh(strutGeo, brassMat);
    s6.rotation.y = -Math.PI / 4;
    
    s1.userData = { id: "lattice", originalPos: s1.position.clone(), explodeDir: new THREE.Vector3(0, -0.6, 0), explodeScale: 0.8 };
    s2.userData = { id: "lattice", originalPos: s2.position.clone(), explodeDir: new THREE.Vector3(0, -0.6, 0), explodeScale: 0.8 };
    s3.userData = { id: "lattice", originalPos: s3.position.clone(), explodeDir: new THREE.Vector3(0, -0.6, 0), explodeScale: 0.8 };
    s4.userData = { id: "lattice", originalPos: s4.position.clone(), explodeDir: new THREE.Vector3(0, -0.6, 0), explodeScale: 0.8 };
    s5.userData = { id: "lattice", originalPos: s5.position.clone(), explodeDir: new THREE.Vector3(0, -0.6, 0), explodeScale: 0.8 };
    s6.userData = { id: "lattice", originalPos: s6.position.clone(), explodeDir: new THREE.Vector3(0, -0.6, 0), explodeScale: 0.8 };
    previewGroup.add(s1, s2, s3, s4, s5, s6);

    // 4. Exoskeleton Casings (Left and Right halves)
    const leftShellGeo = new THREE.CylinderGeometry(2.2, 2.2, 3.2, 32, 1, false, 0, Math.PI);
    const leftShell = new THREE.Mesh(leftShellGeo, metalMat);
    leftShell.userData = {
      id: "casing",
      originalPos: leftShell.position.clone(),
      explodeDir: new THREE.Vector3(-1.8, 0, 0),
      explodeScale: 1.5
    };
    previewGroup.add(leftShell);

    // Left Casing Ribs
    for (let r = 0; r < 3; r++) {
      const ribGeo = new THREE.TorusGeometry(2.3, 0.12, 8, 32, Math.PI);
      ribGeo.rotateX(Math.PI / 2);
      const rib = new THREE.Mesh(ribGeo, metalMat);
      rib.position.set(0, -1.0 + r * 1.0, 0);
      rib.userData = {
        id: "rib",
        originalPos: rib.position.clone(),
        explodeDir: new THREE.Vector3(-1.8, 0, 0),
        explodeScale: 1.5
      };
      previewGroup.add(rib);
    }

    // Right Shell Casing
    const rightShellGeo = new THREE.CylinderGeometry(2.2, 2.2, 3.2, 32, 1, false, Math.PI, Math.PI);
    const rightShell = new THREE.Mesh(rightShellGeo, metalMat);
    rightShell.userData = {
      id: "casing",
      originalPos: rightShell.position.clone(),
      explodeDir: new THREE.Vector3(1.8, 0, 0),
      explodeScale: 1.5
    };
    previewGroup.add(rightShell);

    // Right Casing Ribs
    for (let r = 0; r < 3; r++) {
      const ribGeo = new THREE.TorusGeometry(2.3, 0.12, 8, 32, Math.PI);
      ribGeo.rotateX(Math.PI / 2);
      ribGeo.rotateY(Math.PI);
      const rib = new THREE.Mesh(ribGeo, metalMat);
      rib.position.set(0, -1.0 + r * 1.0, 0);
      rib.userData = {
        id: "rib",
        originalPos: rib.position.clone(),
        explodeDir: new THREE.Vector3(1.8, 0, 0),
        explodeScale: 1.5
      };
      previewGroup.add(rib);
    }

    // 5. Kinematic Hydraulic Linkages (4x pistons pointing diagonally)
    const angles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    angles.forEach((angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Sleeve
      const sleeveGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16);
      sleeveGeo.rotateX(Math.PI / 2);
      sleeveGeo.rotateY(-angle);
      const sleeve = new THREE.Mesh(sleeveGeo, metalMat);
      sleeve.position.set(cos * 1.6, 0, sin * 1.6);
      sleeve.userData = {
        id: "sleeve",
        originalPos: sleeve.position.clone(),
        explodeDir: new THREE.Vector3(cos, 0, sin),
        explodeScale: 1.3
      };
      previewGroup.add(sleeve);

      // Rod
      const rodGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.6, 16);
      rodGeo.rotateX(Math.PI / 2);
      rodGeo.rotateY(-angle);
      const rod = new THREE.Mesh(rodGeo, metalMat);
      rod.position.set(cos * 2.3, 0, sin * 2.3);
      rod.userData = {
        id: "rod",
        originalPos: rod.position.clone(),
        explodeDir: new THREE.Vector3(cos * 1.8, 0, sin * 1.8),
        explodeScale: 1.8
      };
      previewGroup.add(rod);
    });

    // 6. Top & Bottom Joint Knuckle Mounts
    const topMountGeo = new THREE.TorusGeometry(0.8, 0.3, 16, 32);
    topMountGeo.rotateY(Math.PI / 2);
    const topMount = new THREE.Mesh(topMountGeo, metalMat);
    topMount.position.set(0, 2.0, 0);
    topMount.userData = {
      id: "joint",
      originalPos: topMount.position.clone(),
      explodeDir: new THREE.Vector3(0, 1.6, 0),
      explodeScale: 1.4
    };
    previewGroup.add(topMount);

    const bottomMountGeo = new THREE.TorusGeometry(0.8, 0.3, 16, 32);
    bottomMountGeo.rotateY(Math.PI / 2);
    const bottomMount = new THREE.Mesh(bottomMountGeo, metalMat);
    bottomMount.position.set(0, -2.0, 0);
    bottomMount.userData = {
      id: "joint",
      originalPos: bottomMount.position.clone(),
      explodeDir: new THREE.Vector3(0, -1.6, 0),
      explodeScale: 1.4
    };
    previewGroup.add(bottomMount);

    // 7. Floating Orbiting Nano-Tech Particles (Alien detail style)
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds: number[] = [];
    const particleRadii: number[] = [];
    const particlePhases: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.0 + Math.random() * 2.5;
      const phase = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 1.8;
      
      const x = radius * Math.cos(phase);
      const z = radius * Math.sin(phase);

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      particleSpeeds.push(0.008 + Math.random() * 0.015);
      particleRadii.push(radius);
      particlePhases.push(phase);
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xd97706,
      size: 0.06,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    particleSystem.userData = {
      isParticles: true,
      speeds: particleSpeeds,
      radii: particleRadii,
      phases: particlePhases
    };
    previewGroup.add(particleSystem);

    scene.add(previewGroup);

    // Initial scale-up spring entry simulation
    previewGroup.scale.set(0.01, 0.01, 0.01);

    // Timeline configuration arrays for interpolation
    const cameraPositions = [
      new THREE.Vector3(14, 8, 14), // Beat 0: Hero
      new THREE.Vector3(8, 5, 8),    // Beat 1: Voxel Ingest
      new THREE.Vector3(0, 5, 12),   // Beat 2: Stress Exoskeleton
      new THREE.Vector3(8, -1, 10),   // Beat 3: Kinematic Linkages
      new THREE.Vector3(14, 8, 14),  // Beat 4: Showroom
      new THREE.Vector3(16, 10, 16)   // Beat 5: Stats/CTA
    ];

    const modelPositions = [
      new THREE.Vector3(2.2, 0, 0),  // Beat 0
      new THREE.Vector3(2.2, 0, 0),    // Beat 1
      new THREE.Vector3(2.2, 0, 0),    // Beat 2
      new THREE.Vector3(2.2, 0.5, 0),  // Beat 3
      new THREE.Vector3(2.2, 0, 0),  // Beat 4
      new THREE.Vector3(0, -0.5, 0)   // Beat 5
    ];

    const explosionFactors = [0.0, 0.0, 1.3, 1.3, 0.0, 0.5];

    let animFrame: number;
    const animate = () => {
      animFrame = requestAnimationFrame(animate);
      
      // Read Framer Motion scroll value synchronously
      const targetScroll = scrollYProgress.get();
      currentScrollFraction.current += (targetScroll - currentScrollFraction.current) * 0.08;
      const sf = currentScrollFraction.current;

      // Map progress to index between 0 and 5
      const scaledProgress = sf * 5;
      const indexLower = Math.floor(scaledProgress);
      const indexUpper = Math.min(indexLower + 1, 5);
      const factor = scaledProgress - indexLower;

      // 1. Interpolate camera position
      const targetCamPos = new THREE.Vector3().lerpVectors(
        cameraPositions[indexLower],
        cameraPositions[indexUpper],
        factor
      );
      camera.position.copy(targetCamPos);

      // 2. Interpolate model position (apply responsive centering on mobile)
      const baseModelPos = new THREE.Vector3().lerpVectors(
        modelPositions[indexLower],
        modelPositions[indexUpper],
        factor
      );
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        previewGroup.position.set(0, 1.1, baseModelPos.z);
      } else {
        previewGroup.position.copy(baseModelPos);
      }

      // 3. Interpolate explosion factor
      const explosion = THREE.MathUtils.lerp(
        explosionFactors[indexLower],
        explosionFactors[indexUpper],
        factor
      );

      // 4. Slow rotations (combine with scroll spin)
      previewGroup.rotation.y = Date.now() * 0.00018 + sf * Math.PI * 1.5;
      previewGroup.rotation.x = Math.sin(Date.now() * 0.00012) * 0.04 + sf * Math.PI * 0.15;

      // Scale-up spring transition
      const targetScale = isMobile ? 0.75 : 1.0;
      if (previewGroup.scale.x < targetScale) {
        const nextScale = Math.min(previewGroup.scale.x + 0.04, targetScale);
        previewGroup.scale.set(nextScale, nextScale, nextScale);
      }

      // 5. Morph materials dynamically based on scroll beat
      let currentCasingMat: THREE.Material = metalMat;
      let currentRibMat: THREE.Material = metalMat;
      let currentCoreMat: THREE.Material = metalMat;
      let currentRingMat: THREE.Material = metalMat;
      let currentLatticeMat: THREE.Material = metalMat;
      let currentSleeveMat: THREE.Material = metalMat;
      let currentRodMat: THREE.Material = metalMat;
      let currentJointMat: THREE.Material = metalMat;

      if (sf < 0.25) {
        // Voxel mode (Gen 1)
        currentCasingMat = voxelWireMat;
        currentRibMat = voxelWireMat;
        currentCoreMat = coreGlowMat;
        currentRingMat = ringGlowMat;
        currentLatticeMat = brassMat;
        currentSleeveMat = voxelWireMat;
        currentRodMat = voxelWireMat;
        currentJointMat = voxelWireMat;
      } else if (sf < 0.5) {
        // Optimized mode (Gen 2)
        currentCasingMat = metalMat;
        currentRibMat = accentMat; // copper ribs
        currentCoreMat = glowMat;
        currentRingMat = glowMat;
        currentLatticeMat = brassMat;
        currentSleeveMat = metalMat;
        currentRodMat = brassMat;
        currentJointMat = metalMat;
      } else if (sf < 0.75) {
        // Linkages mode (Gen 3)
        currentCasingMat = metalMat;
        currentRibMat = metalMat;
        currentCoreMat = glowMat;
        currentRingMat = glowMat;
        currentLatticeMat = metalMat;
        currentSleeveMat = metalMat;
        currentRodMat = accentMat; // copper rod
        currentJointMat = accentMat;
      } else {
        // Production solid (Gen 4)
        currentCasingMat = metalMat;
        currentRibMat = metalMat;
        currentCoreMat = metalMat;
        currentRingMat = metalMat;
        currentLatticeMat = metalMat;
        currentSleeveMat = metalMat;
        currentRodMat = metalMat;
        currentJointMat = metalMat;
      }

      // Apply exploded translations & update materials on meshes
      previewGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.originalPos) {
          const originalPos = child.userData.originalPos as THREE.Vector3;
          const explodeDir = child.userData.explodeDir as THREE.Vector3;
          const scale = child.userData.explodeScale || 1.0;
          
          if (explodeDir) {
            child.position.copy(originalPos).addScaledVector(explodeDir, explosion * scale);
          }
          
          if (child.userData.isGlowRing) {
            const baseScale = child.userData.originalScale || 1.0;
            const newScale = baseScale + explosion * 0.4;
            child.scale.set(newScale, newScale, newScale);
          }

          // Assign correct morphed material
          const id = child.userData.id;
          if (id === "casing") child.material = currentCasingMat;
          else if (id === "rib") child.material = currentRibMat;
          else if (child.userData.isGlowRing) child.material = currentRingMat;
          else if (id === "lattice") child.material = currentLatticeMat;
          else if (id === "sleeve") child.material = currentSleeveMat;
          else if (id === "rod") child.material = currentRodMat;
          else if (id === "joint") child.material = currentJointMat;
          else child.material = currentCoreMat; // core sphere
        }

        // Particle orbital calculations
        if (child instanceof THREE.Points && child.userData.isParticles) {
          const positions = child.geometry.attributes.position.array as Float32Array;
          const speeds = child.userData.speeds as number[];
          const radii = child.userData.radii as number[];
          const phases = child.userData.phases as number[];

          for (let i = 0; i < speeds.length; i++) {
            phases[i] += speeds[i];
            const r = radii[i] + explosion * 0.7; // Expand particle orbits as it explodes
            positions[i * 3] = r * Math.cos(phases[i]);
            positions[i * 3 + 1] += Math.sin(Date.now() * 0.001 + phases[i]) * 0.001;
            positions[i * 3 + 2] = r * Math.sin(phases[i]);
          }
          child.geometry.attributes.position.needsUpdate = true;
        }
      });

      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!threeRef.current) return;
      const width = threeRef.current.clientWidth;
      const height = threeRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      
      const targetScale = width < 1024 ? 0.75 : 1.0;
      previewGroup.scale.set(targetScale, targetScale, targetScale);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen text-zinc-100 relative bg-[#09090b]">
      
      {/* Scroll Progress Bar at the top of the viewport */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-amber-500 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Subtle Background Parallax Ambient Bronze Orbs & Grids */}
      <div className="fixed top-10 left-10 w-[550px] h-[550px] bronze-glow-orb pointer-events-none z-10 opacity-30" />
      <div className="fixed bottom-20 right-10 w-[550px] h-[550px] copper-glow-orb pointer-events-none z-10 opacity-20" />
      <div className="dot-grid fixed inset-0 pointer-events-none z-10 opacity-40" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-xl z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-amber-550 transition-all shadow-md">
              <Layers className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono font-extrabold tracking-widest text-zinc-200 transition-all text-sm leading-none">
                VELOLABS
              </span>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Autonomous CAD Engine</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8 text-[10px] font-mono tracking-widest text-zinc-400">
            <button onClick={() => scrollToSection(1)} className="hover:text-amber-500 transition-colors uppercase cursor-pointer">
              Gen 1
            </button>
            <button onClick={() => scrollToSection(2)} className="hover:text-amber-500 transition-colors uppercase cursor-pointer">
              Gen 2
            </button>
            <button onClick={() => scrollToSection(3)} className="hover:text-amber-500 transition-colors uppercase cursor-pointer">
              Gen 3
            </button>
            <button onClick={() => scrollToSection(4)} className="hover:text-amber-500 transition-colors uppercase cursor-pointer">
              Gen 4
            </button>
            <button onClick={() => scrollToSection(5)} className="hover:text-amber-500 transition-colors uppercase cursor-pointer">
              Metrics
            </button>
          </nav>
          
          <div>
            <Link
              href="/workspace"
              className="px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-550 text-amber-500 hover:text-amber-400 text-xs font-bold font-mono tracking-wider transition-all flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <span>LAUNCH WORKSPACE</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* FIXED 3D VIEWPORT CONTAINER */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <div ref={threeRef} className="w-full h-full" />
      </div>

      {/* SCROLLYTELLING SECTIONS */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 w-full flex flex-col pt-24">
        
        {/* Section 0: Hero */}
        <section 
          id="section-0" 
          className="min-h-screen flex items-center grid grid-cols-1 lg:grid-cols-12 gap-12 py-12"
        >
          <div className="lg:col-span-6 flex flex-col justify-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-4 py-1.5 rounded-full text-amber-550 text-[10px] font-mono shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>CEM (Computational Engineering Model) v1.5</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
                  Translate Prompts into{" "}
                  <span className="text-amber-500 block">
                    Solid Bionic Geometry
                  </span>
                </h1>
                
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-xl">
                  An agentic compilation pipeline mapping technical specifications and PDF manufacturer datasheets into structural solid geometry. Features automated physics-driven stress overrides and tolerance auditing.
                </p>
              </div>

              {/* Quick HUD Metrics in Hero */}
              <div className="grid grid-cols-3 gap-4 border border-zinc-850 bg-zinc-900/30 p-4 rounded-lg max-w-md font-mono">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase block">Engine Resolution</span>
                  <span className="text-xs font-bold text-zinc-200">50 μm Voxel</span>
                </div>
                <div className="space-y-1 border-l border-zinc-850 pl-4">
                  <span className="text-[9px] text-zinc-500 uppercase block">Stress Enforcer</span>
                  <span className="text-xs font-bold text-amber-550">Hoop + Cantilever</span>
                </div>
                <div className="space-y-1 border-l border-zinc-850 pl-4">
                  <span className="text-[9px] text-zinc-500 uppercase block">Format</span>
                  <span className="text-xs font-bold text-zinc-200">Watertight 3MF</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/workspace"
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs py-4 px-8 rounded-lg flex items-center justify-center space-x-2.5 transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  <span>LAUNCH COMPILER WORKSPACE</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => scrollToSection(1)}
                  className="bg-zinc-900/80 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white font-mono font-bold text-xs py-4 px-8 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <span>START PRESENTATION</span>
                </button>
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-6 hidden lg:block" />
        </section>

        {/* Section 1: Gen 1 */}
        <section 
          id="section-1" 
          className="min-h-screen flex items-center grid grid-cols-1 lg:grid-cols-12 gap-12 py-12"
        >
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
              transition={{ duration: 0.6 }}
              className="space-y-6 bg-zinc-950/45 backdrop-blur-md p-6 lg:p-0 rounded-2xl border border-zinc-900 lg:border-none"
            >
              <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
                <Binary className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>1. INGESTION & TOPOLOGY</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-none">Gen 1: Topological Voxel Lattice</h2>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl">
                Describe your mechanical intent using natural language, or upload an engineering datasheet. Our LLM extracts precise dimensional boundaries and converts textual requirements into bounding dimensions within a voxel mesh workspace.
              </p>
              
              <div className="glass-panel p-4.5 rounded-lg border border-zinc-850 max-w-md font-mono text-[11px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">LATTICE NODES:</span>
                  <span className="text-zinc-200 font-bold">1,420 Nodes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">VOXEL GRID DENSITY:</span>
                  <span className="text-zinc-200 font-bold">5.0 M voxels/cm³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">RESOLUTION THRESHOLD:</span>
                  <span className="text-amber-550 font-bold">&le; 100 µm</span>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-6 hidden lg:block" />
        </section>

        {/* Section 2: Gen 2 */}
        <section 
          id="section-2" 
          className="min-h-screen flex items-center grid grid-cols-1 lg:grid-cols-12 gap-12 py-12"
        >
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
              transition={{ duration: 0.6 }}
              className="space-y-6 bg-zinc-950/45 backdrop-blur-md p-6 lg:p-0 rounded-2xl border border-zinc-900 lg:border-none"
            >
              <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
                <Activity className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>2. STRESS & SAFETY AUDIT</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-none">Gen 2: Stress Exoskeleton</h2>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl">
                A localized physics validation loop recalculates wall thicknesses, hoop stresses, and sheer tolerances. Wraps the lattice in a variable-thickness protective exoskeleton, enforcing overrides where mechanical failure is likely.
              </p>
              
              <div className="glass-panel p-4.5 rounded-lg border border-zinc-850 max-w-md font-mono text-[11px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">SHELL THICKNESS:</span>
                  <span className="text-zinc-200 font-bold">1.2 mm - 4.5 mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">STRESS CAPACITY:</span>
                  <span className="text-zinc-200 font-bold">320 MPa Threshold</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">SAFETY CONSTRAINT:</span>
                  <span className="text-emerald-500 font-bold">2.2x Override Enforced</span>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-6 hidden lg:block" />
        </section>

        {/* Section 3: Gen 3 */}
        <section 
          id="section-3" 
          className="min-h-screen flex items-center grid grid-cols-1 lg:grid-cols-12 gap-12 py-12"
        >
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
              transition={{ duration: 0.6 }}
              className="space-y-6 bg-zinc-950/45 backdrop-blur-md p-6 lg:p-0 rounded-2xl border border-zinc-900 lg:border-none"
            >
              <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
                <Cpu className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>3. MECHANICAL INTEGRATION</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-none">Gen 3: Kinematic Linkages</h2>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl">
                Integration of quasi-direct drive (QDD) motor flange mounts, joints, and closed-loop bionic transmission linkages. Animates and validates abduction/adduction flex clearance and shear load capacity under torque.
              </p>
              
              <div className="glass-panel p-4.5 rounded-lg border border-zinc-850 max-w-md font-mono text-[11px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">TRANSMISSION:</span>
                  <span className="text-zinc-200 font-bold">Closed-Loop Linkage</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">KINEMATICS:</span>
                  <span className="text-zinc-200 font-bold">12-DoF Quadruped Joint</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">JOINT CLEARANCE:</span>
                  <span className="text-amber-550 font-bold">Collision-Free Verified</span>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-6 hidden lg:block" />
        </section>

        {/* Section 4: Gen 4 Showroom */}
        <section 
          id="section-4" 
          className="min-h-screen flex items-center grid grid-cols-1 lg:grid-cols-12 gap-12 py-12"
        >
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
              transition={{ duration: 0.6 }}
              className="space-y-6 bg-zinc-950/45 backdrop-blur-md p-6 lg:p-0 rounded-2xl border border-zinc-900 lg:border-none"
            >
              <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
                <CheckCircle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>4. VOXEL COMPILATION</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-none">Gen 4: Production 3MF</h2>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl">
                Final watertight solid voxel compilation. Unifies all structural layers into a single manifold print-ready file format (3MF), optimized for SLM Titanium Grade 5 sintering.
              </p>
              
              {/* sliding tab selectors */}
              <div className="bg-zinc-950 border border-zinc-900 p-1.5 rounded-lg flex flex-wrap gap-1 w-fit">
                {Object.keys(presets).map((key, idx) => {
                  const k = key as keyof typeof presets;
                  const isSelected = activeTab === k;
                  return (
                    <button
                      key={k}
                      onClick={() => scrollToSection(idx + 1)}
                      className="px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase relative transition-colors cursor-pointer"
                      style={{ color: isSelected ? "#09090b" : "#a1a1aa" }}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 bg-amber-550 rounded shadow"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{presets[k].title.split(": ")[1]}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <Link
                  href={`/workspace?prompt=${encodeURIComponent(presets[activeTab].prompt)}`}
                  className="inline-flex items-center space-x-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs py-3.5 px-7 rounded shadow-md transition-all cursor-pointer"
                >
                  <span>LOAD ITERATION IN WORKSPACE</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-6 hidden lg:block" />
        </section>

        {/* Section 5: Metrics & CTA */}
        <section 
          id="section-5" 
          className="min-h-screen flex flex-col justify-center space-y-12 py-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
            transition={{ duration: 0.6 }}
            className="space-y-12 max-w-4xl bg-zinc-950/45 backdrop-blur-md p-8 rounded-2xl border border-zinc-900 lg:border-none"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
                <Gauge className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span>OPERATIONAL TELEMETRY</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-none">Operational Metrics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
              <div className="glass-panel p-6 rounded border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase block mb-2">Compiled Chassis Parts</span>
                <span className="text-3xl md:text-4xl font-bold text-amber-550">1,248+</span>
              </div>
              <div className="glass-panel p-6 rounded border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase block mb-2">Engine Solves</span>
                <span className="text-3xl md:text-4xl font-bold text-zinc-100">0.08 s</span>
              </div>
              <div className="glass-panel p-6 rounded border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase block mb-2">Manifold Check Success</span>
                <span className="text-3xl md:text-4xl font-bold text-emerald-500">100%</span>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <Link
                href="/workspace"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs py-5 px-12 rounded shadow-md transition-all flex items-center justify-center space-x-3 cursor-pointer"
              >
                <span>LAUNCH COMPILER WORKSPACE</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="text-[10px] font-mono text-zinc-500">
                &copy; {new Date().getFullYear()} VeloLabs. All Rights Reserved. Computational Engineering Model Platform (CEM)
              </div>
            </div>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
