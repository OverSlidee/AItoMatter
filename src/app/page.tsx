"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Layers, 
  Cpu, 
  Database, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight, 
  Activity, 
  Clock, 
  Layers3, 
  Flame, 
  Binary 
} from "lucide-react";
import * as THREE from "three";
import { motion, useScroll, useSpring } from "framer-motion";

export default function LandingPage() {
  const threeRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"gear" | "bracket" | "pipe" | "housing" >("gear");
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const targetScrollFraction = useRef(0);
  const currentScrollFraction = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!gridContainerRef.current) return;
      const rect = gridContainerRef.current.getBoundingClientRect();
      const containerHeight = rect.height;
      const scrolledDistance = -rect.top;
      const scrollRange = Math.max(containerHeight - window.innerHeight, 1);
      
      let fraction = scrolledDistance / scrollRange;
      fraction = Math.max(0, Math.min(fraction, 1));
      targetScrollFraction.current = fraction;
    };
    
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Framer Motion Scroll Progress Indicator
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Presets mapping to prompts
  const presets = {
    gear: {
      title: "Spur Gear",
      desc: "Compile mechanical spur gears with customized tooth configurations, module width, and keyed shaft bores.",
      prompt: "Design a spur gear with 24 teeth, module 2.5, face width 20mm, and a 12mm shaft bore with a standard 3mm keyway, made of SLM Titanium.",
      spec: "Module: 2.5 | Teeth: 24 | Material: Titanium"
    },
    bracket: {
      title: "Cantilever Bracket",
      desc: "Build load-bearing mounting brackets customized for specific load weights, bolt spacings, and thicknesses.",
      prompt: "Design a structural cantilever bracket supporting a 600N vertical shear load. Base dimensions: width 50mm, length 90mm, thickness 6mm, with two 6mm bolt holes spaced 35mm apart.",
      spec: "Load: 600 N | Thickness: 6mm | Material: SLM Steel"
    },
    pipe: {
      title: "Fluid Junction Pipe",
      desc: "Assemble watertight fluid pipes and manifolds with physics audits for internal hoop stress thresholds.",
      prompt: "Design a high-pressure fluid pipe junction. Bore diameter 32mm, wall thickness 4mm, total length 150mm. Grade: FDM Plastic, verified for 120 PSI internal flow.",
      spec: "Bore: 32mm | Max Pressure: 120 PSI | Material: PLA Plastic"
    },
    housing: {
      title: "Motor Housing Faceplate",
      desc: "Generate custom mounts and motor faceplates aligning with standard NEMA dimensions and tolerances.",
      prompt: "Design a NEMA 17 motor housing plate. Bolt spacing 31mm, pilot diameter 22mm, pilot depth 2mm, main body thickness 8mm with a 5mm central shaft clearance bore.",
      spec: "NEMA 17 Compatible | Pilot: 22mm | Material: SLA Resin"
    }
  };

  // Explosion curve mapper based on scroll fraction
  const getExplosionFactor = (p: number): number => {
    if (p < 0.2) {
      return 0;
    } else if (p < 0.45) {
      const t = (p - 0.2) / 0.25;
      return t * t * (3 - 2 * t) * 1.3;
    } else if (p < 0.65) {
      return 1.3;
    } else if (p < 0.82) {
      const t = (p - 0.65) / 0.17;
      return (1 - t * t * (3 - 2 * t)) * 1.3;
    } else {
      const t = (p - 0.82) / 0.18;
      return t * t * (3 - 2 * t) * 0.8;
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
    camera.position.set(16, 11, 16);

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
    const gridHelper = new THREE.GridHelper(30, 24, 0xca8a04, 0x1f2023);
    gridHelper.position.y = -3.5;
    scene.add(gridHelper);

    const previewGroup = new THREE.Group();

    // Material system - Industrial dark metal & copper accents
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46, // Zinc steel
      metalness: 0.85,
      roughness: 0.22
    });
    
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04, // Rich brass
      metalness: 0.8,
      roughness: 0.2
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Matte copper
      metalness: 0.9,
      roughness: 0.18
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xca8a04, // Warm translucent boundary ring
      transparent: true,
      opacity: 0.25
    });

    const holeMat = new THREE.MeshBasicMaterial({
      color: 0x09090b, // Matches scene background to simulate bored hollows
      side: THREE.DoubleSide
    });

    // Populate group based on active tab
    if (activeTab === "gear") {
      const baseGeo = new THREE.CylinderGeometry(2.2, 2.2, 1.4, 32);
      const baseMesh = new THREE.Mesh(baseGeo, metalMat);
      baseMesh.userData = {
        originalPos: baseMesh.position.clone(),
        explodeDir: new THREE.Vector3(0, -0.3, 0),
        explodeScale: 1.0
      };
      previewGroup.add(baseMesh);

      const collarGeo = new THREE.CylinderGeometry(1.3, 1.3, 2.6, 32);
      const collarMesh = new THREE.Mesh(collarGeo, accentMat);
      collarMesh.userData = {
        originalPos: collarMesh.position.clone(),
        explodeDir: new THREE.Vector3(0, 1.5, 0),
        explodeScale: 1.0
      };
      previewGroup.add(collarMesh);

      const boreGeo = new THREE.CylinderGeometry(0.6, 0.6, 2.8, 32);
      const boreMesh = new THREE.Mesh(boreGeo, holeMat);
      boreMesh.userData = {
        originalPos: boreMesh.position.clone(),
        explodeDir: new THREE.Vector3(0, -1.8, 0),
        explodeScale: 1.0
      };
      previewGroup.add(boreMesh);

      const toothCount = 18;
      const toothGeo = new THREE.BoxGeometry(0.4, 1.4, 0.6);
      for (let i = 0; i < toothCount; i++) {
        const angle = (i * 2 * Math.PI) / toothCount;
        const tooth = new THREE.Mesh(toothGeo, metalMat);
        tooth.position.set(Math.cos(angle) * 2.3, 0, Math.sin(angle) * 2.3);
        tooth.rotation.y = -angle;
        tooth.userData = {
          originalPos: tooth.position.clone(),
          explodeDir: new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)),
          explodeScale: 1.5
        };
        previewGroup.add(tooth);
      }

      const ringGeo = new THREE.TorusGeometry(4.0, 0.08, 8, 48);
      ringGeo.rotateX(Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeo, glowMat);
      ringMesh.userData = {
        originalPos: ringMesh.position.clone(),
        isGlowRing: true,
        originalScale: 1.0,
        explodeDir: new THREE.Vector3(0, 0, 0)
      };
      previewGroup.add(ringMesh);

    } else if (activeTab === "bracket") {
      const backGeo = new THREE.BoxGeometry(0.4, 4.2, 2.4);
      const backMesh = new THREE.Mesh(backGeo, metalMat);
      backMesh.position.set(-1.8, 0.8, 0);
      backMesh.userData = {
        originalPos: backMesh.position.clone(),
        explodeDir: new THREE.Vector3(-1.2, 0, 0),
        explodeScale: 1.5
      };
      previewGroup.add(backMesh);

      const baseGeo = new THREE.BoxGeometry(3.6, 0.4, 2.4);
      const baseMesh = new THREE.Mesh(baseGeo, metalMat);
      baseMesh.position.set(0, -1.1, 0);
      baseMesh.userData = {
        originalPos: baseMesh.position.clone(),
        explodeDir: new THREE.Vector3(0, -1.0, 0),
        explodeScale: 1.2
      };
      previewGroup.add(baseMesh);

      const braceGeo = new THREE.BoxGeometry(0.35, 4.0, 0.6);
      const braceMesh = new THREE.Mesh(braceGeo, accentMat);
      braceMesh.position.set(-0.2, 0.2, 0);
      braceMesh.rotation.z = -Math.PI / 4;
      braceMesh.userData = {
        originalPos: braceMesh.position.clone(),
        explodeDir: new THREE.Vector3(1, 1, 0).normalize(),
        explodeScale: 1.5
      };
      previewGroup.add(braceMesh);

      const holeGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16);
      holeGeo.rotateZ(Math.PI / 2);
      
      const h1 = new THREE.Mesh(holeGeo, holeMat);
      h1.position.set(-1.8, 2.0, 0.6);
      h1.userData = {
        originalPos: h1.position.clone(),
        explodeDir: new THREE.Vector3(-1.2, 0.6, 0.6).normalize(),
        explodeScale: 2.0
      };
      
      const h2 = new THREE.Mesh(holeGeo, holeMat);
      h2.position.set(-1.8, 2.0, -0.6);
      h2.userData = {
        originalPos: h2.position.clone(),
        explodeDir: new THREE.Vector3(-1.2, 0.6, -0.6).normalize(),
        explodeScale: 2.0
      };

      const h3 = new THREE.Mesh(holeGeo, holeMat);
      h3.position.set(-1.8, -0.4, 0.6);
      h3.userData = {
        originalPos: h3.position.clone(),
        explodeDir: new THREE.Vector3(-1.2, -0.6, 0.6).normalize(),
        explodeScale: 2.0
      };

      const h4 = new THREE.Mesh(holeGeo, holeMat);
      h4.position.set(-1.8, -0.4, -0.6);
      h4.userData = {
        originalPos: h4.position.clone(),
        explodeDir: new THREE.Vector3(-1.2, -0.6, -0.6).normalize(),
        explodeScale: 2.0
      };

      previewGroup.add(h1, h2, h3, h4);

      const ringGeo = new THREE.TorusGeometry(3.0, 0.06, 8, 32);
      const ringMesh = new THREE.Mesh(ringGeo, glowMat);
      ringMesh.position.set(0.8, -1.1, 0);
      ringMesh.rotateY(Math.PI / 2);
      ringMesh.userData = {
        originalPos: ringMesh.position.clone(),
        isGlowRing: true,
        originalScale: 1.0,
        explodeDir: new THREE.Vector3(0, 0, 0)
      };
      previewGroup.add(ringMesh);

    } else if (activeTab === "pipe") {
      const vertGeo = new THREE.CylinderGeometry(0.8, 0.8, 4.2, 24);
      const vertPipe = new THREE.Mesh(vertGeo, metalMat);
      vertPipe.userData = {
        originalPos: vertPipe.position.clone(),
        explodeDir: new THREE.Vector3(0, 0, 0)
      };
      previewGroup.add(vertPipe);

      const horizGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.0, 24);
      horizGeo.rotateZ(Math.PI / 2);
      const horizPipe = new THREE.Mesh(horizGeo, metalMat);
      horizPipe.position.set(1.0, 0, 0);
      horizPipe.userData = {
        originalPos: horizPipe.position.clone(),
        explodeDir: new THREE.Vector3(1.2, 0, 0),
        explodeScale: 1.4
      };
      previewGroup.add(horizPipe);

      const flangeGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 24);
      const f1 = new THREE.Mesh(flangeGeo, accentMat);
      f1.position.set(0, 2.1, 0);
      f1.userData = {
        originalPos: f1.position.clone(),
        explodeDir: new THREE.Vector3(0, 1.4, 0),
        explodeScale: 1.5
      };

      const f2 = new THREE.Mesh(flangeGeo, accentMat);
      f2.position.set(0, -2.1, 0);
      f2.userData = {
        originalPos: f2.position.clone(),
        explodeDir: new THREE.Vector3(0, -1.4, 0),
        explodeScale: 1.5
      };

      const fSideGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 24);
      fSideGeo.rotateZ(Math.PI / 2);
      const f3 = new THREE.Mesh(fSideGeo, accentMat);
      f3.position.set(2.0, 0, 0);
      f3.userData = {
        originalPos: f3.position.clone(),
        explodeDir: new THREE.Vector3(1.6, 0, 0),
        explodeScale: 1.5
      };

      previewGroup.add(f1, f2, f3);

      const boreVGeo = new THREE.CylinderGeometry(0.5, 0.5, 4.4, 24);
      const boreV = new THREE.Mesh(boreVGeo, holeMat);
      boreV.userData = {
        originalPos: boreV.position.clone(),
        explodeDir: new THREE.Vector3(0, -1.8, 0),
        explodeScale: 1.0
      };
      
      const boreHGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.2, 24);
      boreHGeo.rotateZ(Math.PI / 2);
      const boreH = new THREE.Mesh(boreHGeo, holeMat);
      boreH.position.set(1.0, 0, 0);
      boreH.userData = {
        originalPos: boreH.position.clone(),
        explodeDir: new THREE.Vector3(1.8, 0, 0),
        explodeScale: 1.2
      };

      previewGroup.add(boreV, boreH);

      const ringGeo = new THREE.TorusGeometry(3.2, 0.06, 8, 32);
      const ringMesh = new THREE.Mesh(ringGeo, glowMat);
      ringMesh.rotateX(Math.PI / 4);
      ringMesh.userData = {
        originalPos: ringMesh.position.clone(),
        isGlowRing: true,
        originalScale: 1.0,
        explodeDir: new THREE.Vector3(0, 0, 0)
      };
      previewGroup.add(ringMesh);

    } else if (activeTab === "housing") {
      const plateGeo = new THREE.BoxGeometry(3.8, 0.5, 3.8);
      const plateMesh = new THREE.Mesh(plateGeo, metalMat);
      plateMesh.userData = {
        originalPos: plateMesh.position.clone(),
        explodeDir: new THREE.Vector3(0, -0.8, 0),
        explodeScale: 1.2
      };
      previewGroup.add(plateMesh);

      const bossGeo = new THREE.CylinderGeometry(1.5, 1.5, 1.0, 32);
      const bossMesh = new THREE.Mesh(bossGeo, accentMat);
      bossMesh.position.set(0, 0.3, 0);
      bossMesh.userData = {
        originalPos: bossMesh.position.clone(),
        explodeDir: new THREE.Vector3(0, 1.4, 0),
        explodeScale: 1.5
      };
      previewGroup.add(bossMesh);

      const CentralBoreGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.4, 32);
      const centralBore = new THREE.Mesh(CentralBoreGeo, holeMat);
      centralBore.position.set(0, 0.3, 0);
      centralBore.userData = {
        originalPos: centralBore.position.clone(),
        explodeDir: new THREE.Vector3(0, -1.6, 0),
        explodeScale: 1.5
      };
      previewGroup.add(centralBore);

      const boltGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.7, 16);
      
      const b1 = new THREE.Mesh(boltGeo, brassMat);
      b1.position.set(1.4, 0.15, 1.4);
      b1.userData = {
        originalPos: b1.position.clone(),
        explodeDir: new THREE.Vector3(1, 2, 1).normalize(),
        explodeScale: 2.2
      };

      const b2 = new THREE.Mesh(boltGeo, brassMat);
      b2.position.set(1.4, 0.15, -1.4);
      b2.userData = {
        originalPos: b2.position.clone(),
        explodeDir: new THREE.Vector3(1, 2, -1).normalize(),
        explodeScale: 2.2
      };

      const b3 = new THREE.Mesh(boltGeo, brassMat);
      b3.position.set(-1.4, 0.15, 1.4);
      b3.userData = {
        originalPos: b3.position.clone(),
        explodeDir: new THREE.Vector3(-1, 2, 1).normalize(),
        explodeScale: 2.2
      };

      const b4 = new THREE.Mesh(boltGeo, brassMat);
      b4.position.set(-1.4, 0.15, -1.4);
      b4.userData = {
        originalPos: b4.position.clone(),
        explodeDir: new THREE.Vector3(-1, 2, -1).normalize(),
        explodeScale: 2.2
      };

      previewGroup.add(b1, b2, b3, b4);

      const holeGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 16);
      
      const h1 = new THREE.Mesh(holeGeo, holeMat);
      h1.position.set(1.4, -0.1, 1.4);
      h1.userData = {
        originalPos: h1.position.clone(),
        explodeDir: new THREE.Vector3(1, -2, 1).normalize(),
        explodeScale: 2.2
      };

      const h2 = new THREE.Mesh(holeGeo, holeMat);
      h2.position.set(1.4, -0.1, -1.4);
      h2.userData = {
        originalPos: h2.position.clone(),
        explodeDir: new THREE.Vector3(1, -2, -1).normalize(),
        explodeScale: 2.2
      };

      const h3 = new THREE.Mesh(holeGeo, holeMat);
      h3.position.set(-1.4, -0.1, 1.4);
      h3.userData = {
        originalPos: h3.position.clone(),
        explodeDir: new THREE.Vector3(-1, -2, 1).normalize(),
        explodeScale: 2.2
      };

      const h4 = new THREE.Mesh(holeGeo, holeMat);
      h4.position.set(-1.4, -0.1, -1.4);
      h4.userData = {
        originalPos: h4.position.clone(),
        explodeDir: new THREE.Vector3(-1, -2, -1).normalize(),
        explodeScale: 2.2
      };

      previewGroup.add(h1, h2, h3, h4);

      const wireGeo = new THREE.BoxGeometry(4.2, 1.1, 4.2);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xca8a04,
        wireframe: true,
        transparent: true,
        opacity: 0.12
      });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      wireMesh.userData = {
        originalPos: wireMesh.position.clone(),
        isGlowRing: true,
        originalScale: 1.0,
        explodeDir: new THREE.Vector3(0, 0, 0)
      };
      previewGroup.add(wireMesh);
    }

    scene.add(previewGroup);

    // Initial scale-up spring entry simulation
    previewGroup.scale.set(0.01, 0.01, 0.01);
    
    let animFrame: number;
    const animate = () => {
      animFrame = requestAnimationFrame(animate);
      
      // Interpolate scroll fraction for inertia / damping
      currentScrollFraction.current += (targetScrollFraction.current - currentScrollFraction.current) * 0.08;
      const sf = currentScrollFraction.current;

      // Rotations
      previewGroup.rotation.y = Date.now() * 0.0002 + sf * Math.PI * 1.5;
      previewGroup.rotation.x = Math.sin(Date.now() * 0.00015) * 0.05 + sf * Math.PI * 0.2;

      // Scale-up spring transition
      if (previewGroup.scale.x < 1) {
        const nextScale = Math.min(previewGroup.scale.x + 0.04, 1);
        previewGroup.scale.set(nextScale, nextScale, nextScale);
      }

      // Deconstruction / Explosion logic
      const explosion = getExplosionFactor(sf);
      
      previewGroup.children.forEach((child) => {
        if (child.userData && child.userData.originalPos) {
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
        }
      });

      // Camera orbiting
      camera.position.z = 16 - sf * 5;
      camera.position.y = 11 - sf * 3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!threeRef.current) return;
      camera.aspect = threeRef.current.clientWidth / threeRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(threeRef.current.clientWidth, threeRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [activeTab]);

  // Framer Motion Animation Settings
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 70, damping: 14 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen text-zinc-100 relative bg-[#09090b] overflow-hidden">
      
      {/* Scroll Progress Bar at the top of the viewport */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-amber-500 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Subtle Background Parallax Ambient Bronze Orbs & Grids */}
      <div className="absolute top-10 left-10 w-[550px] h-[550px] bronze-glow-orb pointer-events-none -z-10 opacity-40" />
      <div className="absolute bottom-20 right-10 w-[550px] h-[550px] copper-glow-orb pointer-events-none -z-10 opacity-30" />
      <div className="dot-grid" />
      <div className="tech-lines" />

      {/* Header */}
      <header className="w-full border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-40 transition-all">
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
            <a href="#pipeline" className="hover:text-amber-500 transition-colors uppercase relative py-1">
              Pipeline
            </a>
            <a href="#showroom" className="hover:text-amber-500 transition-colors uppercase relative py-1">
              Showroom
            </a>
            <a href="#imagery" className="hover:text-amber-500 transition-colors uppercase relative py-1">
              Telemetry
            </a>
            <a href="#stats" className="hover:text-amber-500 transition-colors uppercase relative py-1">
              Metrics
            </a>
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

      {/* Master Scroll-Linked Grid Container */}
      <div 
        ref={gridContainerRef}
        className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-x-12 items-start relative py-12 md:py-20"
      >
        {/* Row 1, Left: Hero copy */}
        <div className="lg:col-span-7 order-1 lg:row-start-1 space-y-8 lg:pb-12">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8"
          >
            <motion.div 
              variants={fadeUpVariants}
              className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-4 py-1.5 rounded-full text-amber-500 text-[10px] font-mono shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>CEM (Computational Engineering Model) v1.5</span>
            </motion.div>
            
            <div className="space-y-4">
              <motion.h1 
                variants={fadeUpVariants}
                className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-white"
              >
                Translate Prompts into{" "}
                <span className="text-amber-550">
                  Solid Watertight CAD Geometry
                </span>
              </motion.h1>
              
              <motion.p 
                variants={fadeUpVariants}
                className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-xl"
              >
                An agentic compilation pipeline mapping technical specifications and PDF manufacturer datasheets into structural solid geometry. Features automated physics-driven stress overrides and tolerance auditing.
              </motion.p>
            </div>

            {/* Quick HUD Metrics in Hero */}
            <motion.div 
              variants={fadeUpVariants}
              className="grid grid-cols-3 gap-4 border border-zinc-850 bg-zinc-900/30 p-4 rounded-lg max-w-md font-mono"
            >
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
            </motion.div>

            <motion.div 
              variants={fadeUpVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/workspace"
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs py-4 px-8 rounded-lg flex items-center justify-center space-x-2.5 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <span>LAUNCH COMPILER WORKSPACE</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#showroom"
                className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-mono font-bold text-xs py-4 px-8 rounded-lg flex items-center justify-center space-x-2 transition-all"
              >
                <span>BROWSE TEMPLATES</span>
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Row 1-3, Right: Sticky Three.js Viewport */}
        <div className="lg:col-span-5 order-2 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-24 h-[360px] md:h-[450px] lg:h-[calc(100vh-12rem)] min-h-[400px] z-20 my-8 lg:my-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="w-full h-full glass-panel rounded-lg overflow-hidden shadow-2xl relative border border-zinc-850/80 cyber-scanline"
          >
            {/* HUD decorative corners */}
            <div className="hud-corner hud-tl" />
            <div className="hud-corner hud-tr" />
            <div className="hud-corner hud-bl" />
            <div className="hud-corner hud-br" />
            
            <div ref={threeRef} className="w-full h-full" />
            
            <div className="absolute top-4 left-4 bg-zinc-950/90 border border-zinc-850 px-3.5 py-1.5 rounded text-[10px] font-mono text-amber-550 flex items-center space-x-2 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>REAL-TIME 3D VIEWPORT</span>
            </div>

            <div className="absolute top-4 right-4 bg-zinc-950/90 border border-zinc-850 px-3 py-1 rounded text-[9px] font-mono text-zinc-400 shadow-sm">
              Active: <span className="text-amber-550 font-bold uppercase">{presets[activeTab].title}</span>
            </div>
            
            {/* Technical metadata */}
            <div className="absolute bottom-4 left-4 bg-zinc-950/85 border border-zinc-850 p-3 rounded max-w-xs space-y-1 font-mono text-[9px] text-zinc-400 shadow-md">
              <div className="flex justify-between space-x-8">
                <span>BOUNDS:</span>
                <span className="text-zinc-200 font-bold">120 x 120 x 80 mm</span>
              </div>
              <div className="flex justify-between space-x-8">
                <span>SURFACE:</span>
                <span className="text-amber-550 font-bold">Watertight Mesh</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 2, Left: Pipeline Section */}
        <div id="pipeline" className="lg:col-span-7 order-3 lg:row-start-2 mt-20 lg:mt-32 space-y-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUpVariants}
            className="space-y-3"
          >
            <h2 className="text-xs font-bold font-mono tracking-widest text-amber-500 uppercase">Computational pipeline</h2>
            <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-none">How the Voxel Compiler Works</p>
            <p className="text-zinc-400 text-sm max-w-lg">Our multi-agent runtime parses prompts and generates compliant spatial components.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {/* Step 1 */}
            <motion.div variants={fadeUpVariants} className="h-full">
              <div 
                onMouseEnter={() => setHoveredFeature(0)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`glass-panel p-6 rounded-lg border flex flex-col justify-between h-full space-y-6 transition-all duration-300 relative overflow-hidden ${
                  hoveredFeature === 0 ? "border-amber-550 shadow-[0_0_20px_rgba(202,138,4,0.05)] -translate-y-1.5" : "border-zinc-850"
                }`}
              >
                <div className="space-y-4">
                  <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-amber-500 self-start w-fit">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">1. Ingest Specs</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Describe your mechanical intent using natural language, or upload an engineering datasheet. Our LLM extracts precise dimensional boundaries.
                  </p>
                </div>
                {hoveredFeature === 0 && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={fadeUpVariants} className="h-full">
              <div 
                onMouseEnter={() => setHoveredFeature(1)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`glass-panel p-6 rounded-lg border flex flex-col justify-between h-full space-y-6 transition-all duration-300 relative overflow-hidden ${
                  hoveredFeature === 1 ? "border-amber-550 shadow-[0_0_20px_rgba(202,138,4,0.05)] -translate-y-1.5" : "border-zinc-850"
                }`}
              >
                <div className="space-y-4">
                  <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-amber-500 self-start w-fit">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">2. Research Agent</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    The agent parses inputs and cross-references manufacturing method limitations (FDM, SLA, SLM) to construct candidate parameters.
                  </p>
                </div>
                {hoveredFeature === 1 && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={fadeUpVariants} className="h-full">
              <div 
                onMouseEnter={() => setHoveredFeature(2)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`glass-panel p-6 rounded-lg border flex flex-col justify-between h-full space-y-6 transition-all duration-300 relative overflow-hidden ${
                  hoveredFeature === 2 ? "border-amber-550 shadow-[0_0_20px_rgba(202,138,4,0.05)] -translate-y-1.5" : "border-zinc-850"
                }`}
              >
                <div className="space-y-4">
                  <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-amber-500 self-start w-fit">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">3. Physics Safety Check</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    A localized physics validation loop recalculates wall thicknesses, hoop stresses, and sheer tolerances, enforcing overrides where mechanical failure is likely.
                  </p>
                </div>
                {hoveredFeature === 2 && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div variants={fadeUpVariants} className="h-full">
              <div 
                onMouseEnter={() => setHoveredFeature(3)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`glass-panel p-6 rounded-lg border flex flex-col justify-between h-full space-y-6 transition-all duration-300 relative overflow-hidden ${
                  hoveredFeature === 3 ? "border-amber-550 shadow-[0_0_20px_rgba(202,138,4,0.05)] -translate-y-1.5" : "border-zinc-850"
                }`}
              >
                <div className="space-y-4">
                  <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-amber-500 self-start w-fit">
                    <Database className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">4. Solid Voxel Compilation</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Compiles the refined boundaries into C# PicoGK voxel nodes, producing a watertight production-ready `.3mf` solid object ready for fabrication.
                  </p>
                </div>
                {hoveredFeature === 3 && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Row 3, Left: Showroom Section */}
        <div id="showroom" className="lg:col-span-7 order-4 lg:row-start-3 mt-20 lg:mt-32 space-y-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariants}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div className="space-y-3">
              <h2 className="text-xs font-bold font-mono tracking-widest text-amber-500 uppercase">Engineering library</h2>
              <p className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">Component Templates</p>
            </div>
            
            {/* sliding tab selectors */}
            <div className="bg-zinc-950 border border-zinc-900 p-1 rounded-lg flex flex-wrap gap-1">
              {Object.keys(presets).map((key) => {
                const k = key as keyof typeof presets;
                const isSelected = activeTab === k;
                return (
                  <button
                    key={k}
                    onClick={() => setActiveTab(k)}
                    className="px-4 py-2 rounded text-[11px] font-mono font-bold uppercase relative transition-colors cursor-pointer"
                    style={{ color: isSelected ? "#09090b" : "#a1a1aa" }}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-amber-500 rounded shadow"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{presets[k].title}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariants}
            className="glass-panel p-6 md:p-8 rounded-lg border border-zinc-850 glow-card grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch"
          >
            <div className="md:col-span-7 flex flex-col justify-between py-2 space-y-6">
              <div className="space-y-4">
                <span className="text-[9px] font-mono font-bold text-amber-500 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded tracking-wider uppercase">
                  {presets[activeTab].spec}
                </span>
                <h3 className="text-xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {presets[activeTab].title} Template
                </h3>
                <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-xl">
                  {presets[activeTab].desc}
                </p>
              </div>

              {/* Prompt showcase */}
              <div className="bg-zinc-950 border border-zinc-900 p-4.5 rounded font-mono relative">
                <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-bold mb-1.5">GENERATED INTENT FORMULA:</span>
                <p className="text-xs text-zinc-300 italic leading-relaxed select-all">
                  "{presets[activeTab].prompt}"
                </p>
              </div>

              <div>
                <Link
                  href={`/workspace?prompt=${encodeURIComponent(presets[activeTab].prompt)}`}
                  className="inline-flex items-center space-x-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs py-3.5 px-7 rounded shadow-md transition-all cursor-pointer"
                >
                  <span>LOAD TEMPLATE IN WORKSPACE</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="md:col-span-5 bg-zinc-950 rounded border border-zinc-900 p-6 flex flex-col justify-between space-y-6 relative overflow-hidden cyber-scanline">
              <div className="hud-corner hud-tl" />
              <div className="hud-corner hud-tr" />
              <div className="hud-corner hud-bl" />
              <div className="hud-corner hud-br" />
              
              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 border-b border-zinc-900 pb-3">
                <span>PARAMETER MATRIX</span>
                <span>CEM-01</span>
              </div>
              
              <div className="space-y-4 py-2 flex-grow flex flex-col justify-center">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono text-zinc-400 uppercase tracking-wider">Tolerance Range</span>
                  <span className="font-mono font-bold text-amber-500">+/- 0.05 mm</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono text-zinc-400 uppercase tracking-wider">Hoop Stress Limit</span>
                  <span className="font-mono font-bold text-zinc-200">Enforced</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono text-zinc-400 uppercase tracking-wider">Voxel Grid Density</span>
                  <span className="font-mono font-bold text-zinc-400">5.0 M voxels/cm³</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono text-zinc-400 uppercase tracking-wider">Watertight Proofing</span>
                  <span className="font-mono font-bold text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500 animate-pulse" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              <div className="text-[9px] font-mono text-zinc-500 bg-zinc-900/60 border border-zinc-900 p-3 rounded text-center">
                PicoGK voxelization automatically scales boundaries to meet hoop stress constraints.
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Dynamic Telemetry Media Showcase */}
      <section id="imagery" className="border-t border-zinc-900 bg-zinc-950/20 py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariants}
            className="text-center space-y-3"
          >
            <h2 className="text-xs font-bold font-mono tracking-widest text-amber-500 uppercase">Operational Telemetry</h2>
            <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-none">Computational Visualizations</p>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto">Explore high-fidelity renderings of the generative CAD engine pipeline tasks.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            
            {/* Card 1: Voxel Blueprint */}
            <motion.div variants={fadeUpVariants}>
              <div className="glass-panel rounded-lg overflow-hidden border border-zinc-900 group flex flex-col h-full hover:border-amber-500/25 transition-all duration-300">
                <div className="relative h-64 overflow-hidden border-b border-zinc-900">
                  <div className="absolute inset-0 bg-zinc-950/50 z-10 pointer-events-none group-hover:bg-zinc-950/10 transition-all duration-300" />
                  <img 
                    src="/voxel_blueprint.png" 
                    alt="Voxel Blueprint Schematic" 
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-3 left-3 bg-zinc-950/95 border border-zinc-850 px-2.5 py-1 rounded text-[8px] font-mono text-amber-500 z-20 flex items-center gap-1.5">
                    <Binary className="h-3 w-3 animate-pulse" />
                    <span>INGESTION LAYER</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col justify-between flex-grow space-y-4 bg-zinc-950/20">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold font-mono text-zinc-100 uppercase tracking-wide">1. Coordinate Wireframes</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Converts textual requirements and uploaded engineer schematics into bounding dimensions. Coordinates boundaries within a voxel mesh workspace.
                    </p>
                  </div>
                  <div className="border-t border-zinc-900 pt-3 flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>UNIT TYPE: MICRO-GRID</span>
                    <span>TOLERANCE: &le;50µm</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Stress Heatmap */}
            <motion.div variants={fadeUpVariants}>
              <div className="glass-panel rounded-lg overflow-hidden border border-zinc-900 group flex flex-col h-full hover:border-amber-500/25 transition-all duration-300">
                <div className="relative h-64 overflow-hidden border-b border-zinc-900">
                  <div className="absolute inset-0 bg-zinc-950/50 z-10 pointer-events-none group-hover:bg-zinc-950/10 transition-all duration-300" />
                  <img 
                    src="/stress_telemetry.png" 
                    alt="Finite Element Analysis Stress heatmap" 
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-3 left-3 bg-zinc-950/95 border border-zinc-850 px-2.5 py-1 rounded text-[8px] font-mono text-amber-500 z-20 flex items-center gap-1.5">
                    <Activity className="h-3 w-3 animate-pulse" />
                    <span>STRESS SIMULATOR</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col justify-between flex-grow space-y-4 bg-zinc-950/20">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold font-mono text-zinc-100 uppercase tracking-wide">2. Stress & Strain Overrides</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Evaluates the cantilever structures and load limits under simulated stress weights. Automatically thickens stress concentration regions.
                    </p>
                  </div>
                  <div className="border-t border-zinc-900 pt-3 flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>SOLVER: FINITE ELEMENT</span>
                    <span>LOAD LIMITS: DYNAMIC</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Additive Sintering */}
            <motion.div variants={fadeUpVariants}>
              <div className="glass-panel rounded-lg overflow-hidden border border-zinc-900 group flex flex-col h-full hover:border-amber-500/25 transition-all duration-300">
                <div className="relative h-64 overflow-hidden border-b border-zinc-900">
                  <div className="absolute inset-0 bg-zinc-950/50 z-10 pointer-events-none group-hover:bg-zinc-950/10 transition-all duration-300" />
                  <img 
                    src="/slm_printing.png" 
                    alt="Laser Sintering additive manufacturing" 
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-3 left-3 bg-zinc-950/95 border border-zinc-850 px-2.5 py-1 rounded text-[8px] font-mono text-amber-500 z-20 flex items-center gap-1.5">
                    <Flame className="h-3 w-3 animate-pulse" />
                    <span>PRODUCTION OUTPUT</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col justify-between flex-grow space-y-4 bg-zinc-950/20">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold font-mono text-zinc-100 uppercase tracking-wide">3. Selective Laser Sintering</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      The compiled mesh outputs into a watertight solid 3MF format, compatible with additive manufacturing plants for direct metal sintering.
                    </p>
                  </div>
                  <div className="border-t border-zinc-900 pt-3 flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>FORMAT: PRODUCTION 3MF</span>
                    <span>MANIFOLD: 100% WATERTIGHT</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* Stats Dashboard */}
      <section id="stats" className="border-t border-zinc-900 bg-zinc-950/40 py-20 md:py-28 relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariants}
            className="space-y-5"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900 border border-zinc-850 px-3 py-1 rounded text-amber-500 text-[10px] font-mono">
              <Activity className="h-3 w-3" />
              <span>LIVE VPS OPERATIONS AUDIT</span>
            </div>
            <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">Platform Operational Performance Metrics</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We monitor the compiler queue live on VPS targets, ensuring fast solid mesh generation, database records cleanliness, and verified mechanical strength.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
            className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            
            {/* Stat 1 */}
            <motion.div variants={fadeUpVariants}>
              <div className="glass-panel p-6 rounded border border-zinc-850 flex flex-col justify-between text-left h-44 relative overflow-hidden">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
                  <Layers3 className="h-3.5 w-3.5 text-amber-500" />
                  <span>Runs Compiled</span>
                </span>
                <div className="space-y-1">
                  <p className="text-3xl md:text-4xl font-extrabold font-mono text-amber-550">1,248+</p>
                  <p className="text-[10px] font-mono text-zinc-500">Recursive timeline versions</p>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded overflow-hidden">
                  <div className="bg-amber-500 h-full w-[85%]" />
                </div>
              </div>
            </motion.div>

            {/* Stat 2 */}
            <motion.div variants={fadeUpVariants}>
              <div className="glass-panel p-6 rounded border border-zinc-850 flex flex-col justify-between text-left h-44 relative overflow-hidden">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>Compile Speed</span>
                </span>
                <div className="space-y-1">
                  <p className="text-3xl md:text-4xl font-extrabold font-mono text-amber-550">0.08 s</p>
                  <p className="text-[10px] font-mono text-zinc-500">PicoGK Boolean operations</p>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded overflow-hidden">
                  <div className="bg-amber-500 h-full w-[95%]" />
                </div>
              </div>
            </motion.div>

            {/* Stat 3 */}
            <motion.div variants={fadeUpVariants}>
              <div className="glass-panel p-6 rounded border border-zinc-850 flex flex-col justify-between text-left h-44 relative overflow-hidden">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  <span>Watertightness</span>
                </span>
                <div className="space-y-1">
                  <p className="text-3xl md:text-4xl font-extrabold font-mono text-amber-550">100 %</p>
                  <p className="text-[10px] font-mono text-zinc-500">Manifold-tested meshes</p>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded overflow-hidden">
                  <div className="bg-amber-500 h-full w-full" />
                </div>
              </div>
            </motion.div>

          </motion.div>

        </div>
      </section>

      {/* Onboarding Call to Action */}
      <section className="max-w-4xl mx-auto px-6 py-20 md:py-28 text-center space-y-8 relative">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
          className="space-y-8"
        >
          <div className="space-y-3">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">Start Building Solid Objects</h2>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed">
              Configure custom parameters, input engineering requirements, and compile watertight structures in seconds.
            </p>
          </div>
          <Link
            href="/workspace"
            className="inline-flex items-center space-x-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs py-4 px-10 rounded shadow-md transition-all cursor-pointer"
          >
            <span>ENTER THE COMPILER WORKSPACE</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900 py-10 bg-zinc-950/20 text-center text-[10px] font-mono text-zinc-550">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} VeloLabs. All Rights Reserved.</span>
          <span>Computational Engineering Model Platform (CEM)</span>
        </div>
      </footer>

    </div>
  );
}
