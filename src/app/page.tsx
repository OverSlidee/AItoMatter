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
  Gauge, 
  ShieldCheck,
  Zap,
  Terminal,
  Clock,
  Layers3,
  Flame,
  Binary,
  Layers2
} from "lucide-react";
import * as THREE from "three";
import ScrollReveal from "../components/ScrollReveal";

export default function LandingPage() {
  const threeRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"gear" | "bracket" | "pipe" | "housing">("gear");
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  
  // Track scroll for parallax effects
  const scrollYRef = useRef(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Dynamic Three.js CAD Model Swap and Camera Parallax Animation
  useEffect(() => {
    if (!threeRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Slate 950

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

    // Lights configuration for premium metallic shine
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x06b6d4, 1.2); // Cyan key
    keyLight.position.set(6, 12, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa855f7, 0.85); // Purple fill
    fillLight.position.set(-6, -4, 6);
    scene.add(fillLight);

    const topWhiteLight = new THREE.DirectionalLight(0xffffff, 0.5);
    topWhiteLight.position.set(0, 15, 0);
    scene.add(topWhiteLight);

    // Coordinate grid helper
    const gridHelper = new THREE.GridHelper(30, 24, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -3.5;
    scene.add(gridHelper);

    // Group holding the active preview geometry
    const previewGroup = new THREE.Group();

    // Material system
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Slate metal
      metalness: 0.85,
      roughness: 0.2
    });
    
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04, // Brass accent
      metalness: 0.75,
      roughness: 0.25
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Neon cyan
      metalness: 0.9,
      roughness: 0.15
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7, // Translucent purple orbit
      transparent: true,
      opacity: 0.35
    });

    const holeMat = new THREE.MeshBasicMaterial({
      color: 0x020617, // Matches scene background to simulate bored hollows
      side: THREE.DoubleSide
    });

    // Populate group based on active tab
    if (activeTab === "gear") {
      // 1. GEAR ASSEMBLY
      const baseGeo = new THREE.CylinderGeometry(2.2, 2.2, 1.4, 32);
      const baseMesh = new THREE.Mesh(baseGeo, metalMat);
      previewGroup.add(baseMesh);

      const collarGeo = new THREE.CylinderGeometry(1.3, 1.3, 2.6, 32);
      const collarMesh = new THREE.Mesh(collarGeo, accentMat);
      previewGroup.add(collarMesh);

      const boreGeo = new THREE.CylinderGeometry(0.6, 0.6, 2.8, 32);
      const boreMesh = new THREE.Mesh(boreGeo, holeMat);
      previewGroup.add(boreMesh);

      const toothCount = 18;
      const toothGeo = new THREE.BoxGeometry(0.4, 1.4, 0.6);
      for (let i = 0; i < toothCount; i++) {
        const angle = (i * 2 * Math.PI) / toothCount;
        const tooth = new THREE.Mesh(toothGeo, metalMat);
        tooth.position.set(Math.cos(angle) * 2.3, 0, Math.sin(angle) * 2.3);
        tooth.rotation.y = -angle;
        previewGroup.add(tooth);
      }

      // Outer boundary orbit
      const ringGeo = new THREE.TorusGeometry(4.0, 0.08, 8, 48);
      ringGeo.rotateX(Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeo, glowMat);
      previewGroup.add(ringMesh);

    } else if (activeTab === "bracket") {
      // 2. STRUCTURAL CANTILEVER BRACKET
      const backGeo = new THREE.BoxGeometry(0.4, 4.2, 2.4);
      const backMesh = new THREE.Mesh(backGeo, metalMat);
      backMesh.position.set(-1.8, 0.8, 0);
      previewGroup.add(backMesh);

      const baseGeo = new THREE.BoxGeometry(3.6, 0.4, 2.4);
      const baseMesh = new THREE.Mesh(baseGeo, metalMat);
      baseMesh.position.set(0, -1.1, 0);
      previewGroup.add(baseMesh);

      const braceGeo = new THREE.BoxGeometry(0.35, 4.0, 0.6);
      const braceMesh = new THREE.Mesh(braceGeo, accentMat);
      braceMesh.position.set(-0.2, 0.2, 0);
      braceMesh.rotation.z = -Math.PI / 4; // Diagonal rib
      previewGroup.add(braceMesh);

      // Boring holes
      const holeGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16);
      holeGeo.rotateZ(Math.PI / 2);
      
      const h1 = new THREE.Mesh(holeGeo, holeMat);
      h1.position.set(-1.8, 2.0, 0.6);
      const h2 = h1.clone();
      h2.position.set(-1.8, 2.0, -0.6);
      const h3 = h1.clone();
      h3.position.set(-1.8, -0.4, 0.6);
      const h4 = h1.clone();
      h4.position.set(-1.8, -0.4, -0.6);

      previewGroup.add(h1, h2, h3, h4);

      // Stress boundary ring
      const ringGeo = new THREE.TorusGeometry(3.0, 0.06, 8, 32);
      const ringMesh = new THREE.Mesh(ringGeo, glowMat);
      ringMesh.position.set(0.8, -1.1, 0);
      ringMesh.rotateY(Math.PI / 2);
      previewGroup.add(ringMesh);

    } else if (activeTab === "pipe") {
      // 3. FLUID PIPING MANIFOLD
      const vertGeo = new THREE.CylinderGeometry(0.8, 0.8, 4.2, 24);
      const vertPipe = new THREE.Mesh(vertGeo, metalMat);
      previewGroup.add(vertPipe);

      const horizGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.0, 24);
      horizGeo.rotateZ(Math.PI / 2);
      const horizPipe = new THREE.Mesh(horizGeo, metalMat);
      horizPipe.position.set(1.0, 0, 0);
      previewGroup.add(horizPipe);

      const flangeGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 24);
      const f1 = new THREE.Mesh(flangeGeo, accentMat);
      f1.position.set(0, 2.1, 0);
      const f2 = f1.clone();
      f2.position.set(0, -2.1, 0);

      const fSideGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 24);
      fSideGeo.rotateZ(Math.PI / 2);
      const f3 = new THREE.Mesh(fSideGeo, accentMat);
      f3.position.set(2.0, 0, 0);

      previewGroup.add(f1, f2, f3);

      // Bored inner hollow cylinders
      const boreVGeo = new THREE.CylinderGeometry(0.5, 0.5, 4.4, 24);
      const boreV = new THREE.Mesh(boreVGeo, holeMat);
      
      const boreHGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.2, 24);
      boreHGeo.rotateZ(Math.PI / 2);
      const boreH = new THREE.Mesh(boreHGeo, holeMat);
      boreH.position.set(1.0, 0, 0);

      previewGroup.add(boreV, boreH);

      const ringGeo = new THREE.TorusGeometry(3.2, 0.06, 8, 32);
      const ringMesh = new THREE.Mesh(ringGeo, glowMat);
      ringMesh.rotateX(Math.PI / 4);
      previewGroup.add(ringMesh);

    } else if (activeTab === "housing") {
      // 4. MOTOR FACEPLATE HOUSING
      const plateGeo = new THREE.BoxGeometry(3.8, 0.5, 3.8);
      const plateMesh = new THREE.Mesh(plateGeo, metalMat);
      previewGroup.add(plateMesh);

      const bossGeo = new THREE.CylinderGeometry(1.5, 1.5, 1.0, 32);
      const bossMesh = new THREE.Mesh(bossGeo, accentMat);
      bossMesh.position.set(0, 0.3, 0);
      previewGroup.add(bossMesh);

      const CentralBoreGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.4, 32);
      const centralBore = new THREE.Mesh(CentralBoreGeo, holeMat);
      centralBore.position.set(0, 0.3, 0);
      previewGroup.add(centralBore);

      const boltGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.7, 16);
      const b1 = new THREE.Mesh(boltGeo, brassMat);
      b1.position.set(1.4, 0.15, 1.4);
      const b2 = b1.clone();
      b2.position.set(1.4, 0.15, -1.4);
      const b3 = b1.clone();
      b3.position.set(-1.4, 0.15, 1.4);
      const b4 = b1.clone();
      b4.position.set(-1.4, 0.15, -1.4);

      previewGroup.add(b1, b2, b3, b4);

      const holeGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 16);
      const h1 = new THREE.Mesh(holeGeo, holeMat);
      h1.position.set(1.4, -0.1, 1.4);
      const h2 = h1.clone();
      h2.position.set(1.4, -0.1, -1.4);
      const h3 = h1.clone();
      h3.position.set(-1.4, -0.1, 1.4);
      const h4 = h1.clone();
      h4.position.set(-1.4, -0.1, -1.4);

      previewGroup.add(h1, h2, h3, h4);

      const wireGeo = new THREE.BoxGeometry(4.2, 1.1, 4.2);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        wireframe: true,
        transparent: true,
        opacity: 0.1
      });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      previewGroup.add(wireMesh);
    }

    scene.add(previewGroup);

    // Initial scale-up animation
    previewGroup.scale.set(0.01, 0.01, 0.01);
    
    // Animation loop with scroll-linked camera rotation
    let animFrame: number;
    const animate = () => {
      animFrame = requestAnimationFrame(animate);
      
      // Slow constant spin + scroll-driven rotation
      previewGroup.rotation.y = Date.now() * 0.0004 + scrollYRef.current * 0.001;
      previewGroup.rotation.x = Math.sin(Date.now() * 0.0003) * 0.08 + scrollYRef.current * 0.0004;

      // Scale up transition on initial load
      if (previewGroup.scale.x < 1) {
        const nextScale = Math.min(previewGroup.scale.x + 0.05, 1);
        previewGroup.scale.set(nextScale, nextScale, nextScale);
      }

      // Parallax scroll moves camera closer and down
      camera.position.z = 16 + Math.min(scrollYRef.current * 0.008, 12);
      camera.position.y = 11 - Math.min(scrollYRef.current * 0.004, 6);
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

  return (
    <div className="flex-1 flex flex-col min-h-screen text-slate-200 relative bg-[#020617] overflow-hidden">
      
      {/* Decorative Parallax Orbs & Coordinate Grid */}
      <div 
        className="absolute top-10 left-10 w-[550px] h-[550px] cyan-glow-orb pointer-events-none -z-10 opacity-70 transition-transform duration-300 ease-out" 
        style={{ transform: `translateY(${scrollY * 0.15}px)` }}
      />
      <div 
        className="absolute bottom-20 right-10 w-[550px] h-[550px] purple-glow-orb pointer-events-none -z-10 opacity-70 transition-transform duration-300 ease-out" 
        style={{ transform: `translateY(${-scrollY * 0.1}px)` }}
      />
      <div className="dot-grid" />

      {/* Header */}
      <header className="w-full border-b border-slate-900 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-950/40 to-purple-950/40 border border-cyan-800/30 group-hover:border-cyan-400/80 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <Layers className="h-5 w-5 text-cyan-400 group-hover:text-cyan-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 group-hover:from-cyan-300 group-hover:to-purple-300 transition-all text-sm leading-none">
                VELOLABS
              </span>
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-1">Autonomous CAD Engine</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8 text-[11px] font-mono tracking-widest text-slate-400">
            <a href="#pipeline" className="hover:text-cyan-400 transition-colors uppercase relative py-1 group">
              Pipeline
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full" />
            </a>
            <a href="#showroom" className="hover:text-cyan-400 transition-colors uppercase relative py-1 group">
              Showroom
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full" />
            </a>
            <a href="#imagery" className="hover:text-cyan-400 transition-colors uppercase relative py-1 group">
              Telemetry Gallery
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full" />
            </a>
            <a href="#stats" className="hover:text-cyan-400 transition-colors uppercase relative py-1 group">
              Metrics
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full" />
            </a>
          </nav>
          
          <div>
            <Link
              href="/workspace"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-cyan-900/60 hover:bg-cyan-900/60 hover:border-cyan-400/80 text-cyan-400 text-xs font-bold font-mono tracking-wider transition-all flex items-center space-x-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse-slow"
            >
              <span>LAUNCH WORKSPACE</span>
              <ArrowRight className="h-3.5 w-3.5 animate-bounce-horizontal" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-grow">
        
        {/* Left: Text copy */}
        <div className="lg:col-span-7 space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 bg-cyan-950/30 border border-cyan-800/40 px-4 py-1.5 rounded-full text-cyan-400 text-[10px] font-mono shadow-[0_0_15px_rgba(6,182,212,0.08)]">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>CEM (Computational Engineering Model) v1.5</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08]">
              <span className="text-white">Translate Prompts into </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 font-black">
                Solid Watertight CAD Geometry
              </span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
              An agentic compilation pipeline mapping technical specifications and PDF manufacturer datasheets into structural solid geometry. Features automated physics-driven stress overrides and tolerance auditing.
            </p>
          </div>

          {/* Quick HUD Metrics in Hero */}
          <div className="grid grid-cols-3 gap-4 border border-slate-900 bg-slate-950/40 p-4 rounded-xl max-w-md font-mono">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase block">Engine Resolution</span>
              <span className="text-xs font-bold text-slate-200">50 μm Voxel</span>
            </div>
            <div className="space-y-1 border-l border-slate-900 pl-4">
              <span className="text-[9px] text-slate-500 uppercase block">Stress Enforcer</span>
              <span className="text-xs font-bold text-cyan-400">Hoop + Cantilever</span>
            </div>
            <div className="space-y-1 border-l border-slate-900 pl-4">
              <span className="text-[9px] text-slate-500 uppercase block">Format</span>
              <span className="text-xs font-bold text-purple-400">Watertight 3MF</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/workspace"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-mono font-bold text-xs py-4 px-8 rounded-xl flex items-center justify-center space-x-2.5 transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] cursor-pointer"
            >
              <span>LAUNCH COMPILER WORKSPACE</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#showroom"
              className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-600/80 text-slate-300 hover:text-white font-mono font-bold text-xs py-4 px-8 rounded-xl flex items-center justify-center space-x-2 transition-all"
            >
              <span>BROWSE TEMPLATES</span>
            </a>
          </div>
        </div>

        {/* Right: Rotating Three.js Viewport */}
        <div className="lg:col-span-5 h-[360px] md:h-[450px] glass-panel rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800/80 animate-fade-in-up animation-delay-100 cyber-scanline">
          {/* HUD decorative corners */}
          <div className="hud-corner hud-tl" />
          <div className="hud-corner hud-tr" />
          <div className="hud-corner hud-bl" />
          <div className="hud-corner hud-br" />
          
          <div ref={threeRef} className="w-full h-full" />
          
          <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-800 px-3.5 py-1.5 rounded-lg text-[10px] font-mono text-cyan-400 flex items-center space-x-2 shadow-md">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>REAL-TIME 3D SHOWROOM</span>
          </div>

          <div className="absolute top-4 right-4 bg-slate-950/90 border border-slate-800 px-3 py-1 rounded-lg text-[9px] font-mono text-slate-400 shadow-md">
            Active: <span className="text-cyan-400 font-bold uppercase">{presets[activeTab].title}</span>
          </div>
          
          {/* Cybernetic details in the viewport corner */}
          <div className="absolute bottom-4 left-4 bg-slate-950/80 border border-slate-800 p-3 rounded-lg max-w-xs space-y-1 font-mono text-[9px] text-slate-400 shadow-md">
            <div className="flex justify-between space-x-8">
              <span>BOUNDS:</span>
              <span className="text-cyan-400 font-bold">120 x 120 x 80 mm</span>
            </div>
            <div className="flex justify-between space-x-8">
              <span>SURFACE:</span>
              <span className="text-purple-400 font-bold">Watertight Mesh</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature / Pipeline Section */}
      <section id="pipeline" className="border-t border-slate-900 bg-slate-950/40 py-20 md:py-28 relative">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <ScrollReveal direction="up" className="text-center space-y-3">
            <h2 className="text-xs font-bold font-mono tracking-widest text-cyan-400 uppercase">Computational pipeline</h2>
            <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-none">How the Voxel Compiler Works</p>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">Our multi-agent runtime parses prompts and generates compliant spatial components.</p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <ScrollReveal direction="up" delay={0} className="h-full">
              <div 
                onMouseEnter={() => setHoveredFeature(0)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between h-full space-y-4 transition-all duration-300 relative overflow-hidden ${
                  hoveredFeature === 0 ? "border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.08)] -translate-y-2" : "border-slate-850"
                }`}
              >
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-850 text-cyan-400 self-start w-fit">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">1. Ingest Specs</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Describe your mechanical intent using natural language, or upload an engineering datasheet. Our LLM extracts precise dimensional boundaries.
                  </p>
                </div>
                {hoveredFeature === 0 && <span className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500" />}
              </div>
            </ScrollReveal>

            {/* Step 2 */}
            <ScrollReveal direction="up" delay={150} className="h-full">
              <div 
                onMouseEnter={() => setHoveredFeature(1)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between h-full space-y-4 transition-all duration-300 relative overflow-hidden ${
                  hoveredFeature === 1 ? "border-purple-550 shadow-[0_0_30px_rgba(168,85,247,0.08)] -translate-y-2" : "border-slate-850"
                }`}
              >
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-850 text-purple-400 self-start w-fit">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">2. Research Agent</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The agent parses inputs and cross-references manufacturing method limitations (FDM, SLA, SLM) to construct candidate parameters.
                  </p>
                </div>
                {hoveredFeature === 1 && <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-500" />}
              </div>
            </ScrollReveal>

            {/* Step 3 */}
            <ScrollReveal direction="up" delay={300} className="h-full">
              <div 
                onMouseEnter={() => setHoveredFeature(2)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between h-full space-y-4 transition-all duration-300 relative overflow-hidden ${
                  hoveredFeature === 2 ? "border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.08)] -translate-y-2" : "border-slate-850"
                }`}
              >
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-850 text-amber-400 self-start w-fit">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">3. Physics Safety Check</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    A localized physics validation loop recalculates wall thicknesses, hoop stresses, and sheer tolerances, enforcing overrides where mechanical failure is likely.
                  </p>
                </div>
                {hoveredFeature === 2 && <span className="absolute bottom-0 left-0 w-full h-1 bg-amber-500" />}
              </div>
            </ScrollReveal>

            {/* Step 4 */}
            <ScrollReveal direction="up" delay={450} className="h-full">
              <div 
                onMouseEnter={() => setHoveredFeature(3)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between h-full space-y-4 transition-all duration-300 relative overflow-hidden ${
                  hoveredFeature === 3 ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.08)] -translate-y-2" : "border-slate-850"
                }`}
              >
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-850 text-emerald-400 self-start w-fit">
                    <Database className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">4. Solid Voxel Compilation</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Compiles the refined boundaries into C# PicoGK voxel nodes, producing a watertight production-ready `.3mf` solid object ready for fabrication.
                  </p>
                </div>
                {hoveredFeature === 3 && <span className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500" />}
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* Preset Showroom Section */}
      <section id="showroom" className="max-w-7xl mx-auto px-6 py-20 md:py-28 space-y-12">
        <ScrollReveal direction="up" className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-xs font-bold font-mono tracking-widest text-cyan-400 uppercase">Engineering library</h2>
            <p className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">Component Templates</p>
          </div>
          
          {/* Quick-switch selectors */}
          <div className="bg-slate-950/80 border border-slate-900/60 p-1.5 rounded-xl flex flex-wrap gap-1">
            {Object.keys(presets).map((key) => {
              const k = key as keyof typeof presets;
              return (
                <button
                  key={k}
                  onClick={() => setActiveTab(k)}
                  className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    activeTab === k 
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {presets[k].title}
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Selected Preset Details Glass Card */}
        <ScrollReveal direction="up" delay={100}>
          <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-800/80 glow-card grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between py-2 space-y-6">
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-900/60 px-3 py-1 rounded-md tracking-wider uppercase">
                  {presets[activeTab].spec}
                </span>
                <h3 className="text-xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {presets[activeTab].title} Template
                </h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-xl">
                  {presets[activeTab].desc}
                </p>
              </div>

              {/* Prompt showcase */}
              <div className="bg-slate-950/90 border border-slate-850 p-4.5 rounded-xl space-y-2.5 relative">
                <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">GENERATED INTENT FORMULA:</span>
                <p className="text-xs text-slate-300 font-mono italic leading-relaxed select-all">
                  "{presets[activeTab].prompt}"
                </p>
              </div>

              <div>
                <Link
                  href={`/workspace?prompt=${encodeURIComponent(presets[activeTab].prompt)}`}
                  className="inline-flex items-center space-x-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-mono font-bold text-xs py-3.5 px-7 rounded-xl shadow-md transition-all cursor-pointer shadow-cyan-950"
                >
                  <span>LOAD TEMPLATE IN WORKSPACE</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#030611] rounded-2xl border border-slate-900 p-6 flex flex-col justify-between space-y-6 relative overflow-hidden cyber-scanline">
              {/* HUD decorative corners */}
              <div className="hud-corner hud-tl" />
              <div className="hud-corner hud-tr" />
              <div className="hud-corner hud-bl" />
              <div className="hud-corner hud-br" />
              
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 border-b border-slate-900 pb-3">
                <span>PARAMETER MATRIX</span>
                <span>CEM-01</span>
              </div>
              
              <div className="space-y-4 py-2 flex-grow flex flex-col justify-center">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono text-slate-400 uppercase tracking-wider">Tolerance Range</span>
                  <span className="font-mono font-bold text-cyan-400">+/- 0.05 mm</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono text-slate-400 uppercase tracking-wider">Hoop Stress Limit</span>
                  <span className="font-mono font-bold text-purple-400">Enforced</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono text-slate-400 uppercase tracking-wider">Voxel Grid Density</span>
                  <span className="font-mono font-bold text-slate-200">5.0 M voxels/cm³</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono text-slate-400 uppercase tracking-wider">Watertight Proofing</span>
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500 animate-pulse" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              <div className="text-[9px] font-mono text-slate-500 bg-slate-950 border border-slate-900 p-3 rounded-lg text-center">
                PicoGK voxelization automatically scales boundaries to meet hoop stress constraints.
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Dynamic Telemetry Media Showcase */}
      <section id="imagery" className="border-t border-slate-900 bg-slate-950/20 py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <ScrollReveal direction="up" className="text-center space-y-3">
            <h2 className="text-xs font-bold font-mono tracking-widest text-cyan-400 uppercase">Operational Telemetry</h2>
            <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-none">Computational Visualizations</p>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">Explore high-fidelity renderings of the generative CAD engine pipeline tasks.</p>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Card 1: Voxel Blueprint */}
            <ScrollReveal direction="up" delay={0}>
              <div className="glass-panel rounded-2xl overflow-hidden border border-slate-900 group flex flex-col h-full hover:border-cyan-500/40 transition-all duration-300">
                <div className="relative h-64 overflow-hidden border-b border-slate-900">
                  <div className="absolute inset-0 bg-slate-950/40 z-10 pointer-events-none group-hover:bg-slate-950/0 transition-all" />
                  <img 
                    src="/voxel_blueprint.png" 
                    alt="Voxel Blueprint Schematic" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/90 border border-slate-800/80 px-2.5 py-1 rounded text-[8px] font-mono text-cyan-400 z-20 flex items-center gap-1.5">
                    <Binary className="h-3 w-3 animate-pulse" />
                    <span>INGESTION LAYER</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wide">1. Coordinate Wireframes</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Converts textual requirements and uploaded engineer schematics into bounding dimensions. Coordinates boundaries within a voxel mesh workspace.
                    </p>
                  </div>
                  <div className="border-t border-slate-900 pt-3 flex justify-between text-[9px] font-mono text-slate-500">
                    <span>UNIT TYPE: MICRO-GRID</span>
                    <span>TOLERANCE: &le;50µm</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 2: Stress Heatmap */}
            <ScrollReveal direction="up" delay={150}>
              <div className="glass-panel rounded-2xl overflow-hidden border border-slate-900 group flex flex-col h-full hover:border-purple-550/40 transition-all duration-300">
                <div className="relative h-64 overflow-hidden border-b border-slate-900">
                  <div className="absolute inset-0 bg-slate-950/40 z-10 pointer-events-none group-hover:bg-slate-950/0 transition-all" />
                  <img 
                    src="/stress_telemetry.png" 
                    alt="Finite Element Analysis Stress heatmap" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/90 border border-slate-800/80 px-2.5 py-1 rounded text-[8px] font-mono text-purple-400 z-20 flex items-center gap-1.5">
                    <Activity className="h-3 w-3 animate-pulse" />
                    <span>STRESS SIMULATOR</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wide">2. Stress & Strain Overrides</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Evaluates the cantilever structures and load limits under simulated stress weights. Automatically thickens stress concentration regions.
                    </p>
                  </div>
                  <div className="border-t border-slate-900 pt-3 flex justify-between text-[9px] font-mono text-slate-500">
                    <span>SOLVER: FINITE ELEMENT</span>
                    <span>LOAD LIMITS: DYNAMIC</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 3: Additive Sintering */}
            <ScrollReveal direction="up" delay={300}>
              <div className="glass-panel rounded-2xl overflow-hidden border border-slate-900 group flex flex-col h-full hover:border-emerald-500/40 transition-all duration-300">
                <div className="relative h-64 overflow-hidden border-b border-slate-900">
                  <div className="absolute inset-0 bg-slate-950/40 z-10 pointer-events-none group-hover:bg-slate-950/0 transition-all" />
                  <img 
                    src="/slm_printing.png" 
                    alt="Laser Sintering additive manufacturing" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/90 border border-slate-800/80 px-2.5 py-1 rounded text-[8px] font-mono text-emerald-400 z-20 flex items-center gap-1.5">
                    <Flame className="h-3 w-3 animate-pulse" />
                    <span>PRODUCTION OUTPUT</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wide">3. Selective Laser Sintering</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      The compiled mesh outputs into a watertight solid 3MF format, compatible with additive manufacturing plants for direct metal sintering.
                    </p>
                  </div>
                  <div className="border-t border-slate-900 pt-3 flex justify-between text-[9px] font-mono text-slate-500">
                    <span>FORMAT: PRODUCTION 3MF</span>
                    <span>MANIFOLD: 100% WATERTIGHT</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* HUD Metrics Dashboard */}
      <section id="stats" className="border-t border-slate-900 bg-slate-950/40 py-20 md:py-28 relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          
          <ScrollReveal direction="left" className="space-y-5">
            <div className="inline-flex items-center space-x-2 bg-purple-950/20 border border-purple-850 px-3 py-1 rounded-full text-purple-400 text-[10px] font-mono">
              <Activity className="h-3 w-3" />
              <span>LIVE VPS OPERATIONS AUDIT</span>
            </div>
            <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">Platform Operational Performance Metrics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We monitor the compiler queue live on VPS targets, ensuring fast solid mesh generation, database records cleanliness, and verified mechanical strength.
            </p>
          </ScrollReveal>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Stat 1 */}
            <ScrollReveal direction="up" delay={0}>
              <div className="glass-panel p-6 rounded-2xl border border-slate-850 flex flex-col justify-between text-left h-44 relative overflow-hidden">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
                  <Layers3 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Runs Compiled</span>
                </span>
                <div className="space-y-1">
                  <p className="text-3xl md:text-4xl font-extrabold font-mono text-cyan-400">1,248+</p>
                  <p className="text-[10px] font-mono text-slate-400">Recursive timeline versions</p>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full w-[85%] shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                </div>
              </div>
            </ScrollReveal>

            {/* Stat 2 */}
            <ScrollReveal direction="up" delay={150}>
              <div className="glass-panel p-6 rounded-2xl border border-slate-850 flex flex-col justify-between text-left h-44 relative overflow-hidden">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
                  <Clock className="h-3.5 w-3.5 text-purple-400" />
                  <span>Compile Speed</span>
                </span>
                <div className="space-y-1">
                  <p className="text-3xl md:text-4xl font-extrabold font-mono text-purple-400">0.08 s</p>
                  <p className="text-[10px] font-mono text-slate-400">PicoGK Boolean operations</p>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-400 h-full w-[95%] shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                </div>
              </div>
            </ScrollReveal>

            {/* Stat 3 */}
            <ScrollReveal direction="up" delay={300}>
              <div className="glass-panel p-6 rounded-2xl border border-slate-850 flex flex-col justify-between text-left h-44 relative overflow-hidden">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
                  <Flame className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Watertightness</span>
                </span>
                <div className="space-y-1">
                  <p className="text-3xl md:text-4xl font-extrabold font-mono text-emerald-400">100 %</p>
                  <p className="text-[10px] font-mono text-slate-400">Manifold-tested meshes</p>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
            </ScrollReveal>

          </div>

        </div>
      </section>

      {/* Onboarding Call to Action */}
      <section className="max-w-4xl mx-auto px-6 py-20 md:py-28 text-center space-y-8 relative">
        <ScrollReveal direction="up" className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white animate-pulse-slow">Start Building Solid Objects</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
              Configure custom parameters, input engineering requirements, and compile watertight structures in seconds.
            </p>
          </div>
          <Link
            href="/workspace"
            className="inline-flex items-center space-x-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-mono font-bold text-xs py-4.5 px-10 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all cursor-pointer hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]"
          >
            <span>ENTER THE COMPILER WORKSPACE</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-10 bg-slate-950/20 text-center text-[10px] font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} VeloLabs. All Rights Reserved.</span>
          <span>Computational Engineering Model Platform (CEM)</span>
        </div>
      </footer>

    </div>
  );
}
