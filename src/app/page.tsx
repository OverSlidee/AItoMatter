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
  Flame
} from "lucide-react";
import * as THREE from "three";

export default function LandingPage() {
  const threeRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"gear" | "bracket" | "pipe" | "housing">("gear");
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

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

  // Three.js Mockup CAD animation
  useEffect(() => {
    if (!threeRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Match body background

    const camera = new THREE.PerspectiveCamera(
      45,
      threeRef.current.clientWidth / threeRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(18, 12, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(threeRef.current.clientWidth, threeRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    threeRef.current.innerHTML = "";
    threeRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x06b6d4, 0.9);
    dirLight1.position.set(5, 10, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.7);
    dirLight2.position.set(-5, -5, 5);
    scene.add(dirLight2);

    // Grid helper
    const gridHelper = new THREE.GridHelper(30, 20, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    // Create a composite mechanical preview shape (a hub with gears / brackets)
    const previewGroup = new THREE.Group();

    // Central base cylinder
    const baseGeo = new THREE.CylinderGeometry(2.5, 2.5, 2.5, 32);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.2
    });
    const baseMesh = new THREE.Mesh(baseGeo, metalMat);
    previewGroup.add(baseMesh);

    // Raised collar
    const collarGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.2, 32);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.9,
      roughness: 0.15
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    previewGroup.add(collarMesh);

    // Bored hole through center
    const boreGeo = new THREE.CylinderGeometry(0.8, 0.8, 3.4, 32);
    const boreMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      side: THREE.DoubleSide
    });
    const boreMesh = new THREE.Mesh(boreGeo, boreMat);
    previewGroup.add(boreMesh);

    // Outer gear ribs
    const ribCount = 12;
    const ribGeo = new THREE.BoxGeometry(0.5, 2.5, 0.8);
    for (let i = 0; i < ribCount; i++) {
      const angle = (i * 2 * Math.PI) / ribCount;
      const rib = new THREE.Mesh(ribGeo, metalMat);
      rib.position.set(Math.cos(angle) * 2.5, 0, Math.sin(angle) * 2.5);
      rib.rotation.y = -angle;
      previewGroup.add(rib);
    }

    // Outer orbiting ring
    const ringGeo = new THREE.TorusGeometry(5, 0.15, 8, 48);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.5
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    previewGroup.add(ringMesh);

    scene.add(previewGroup);

    // Animation loop
    let animFrame: number;
    const animate = () => {
      animFrame = requestAnimationFrame(animate);
      previewGroup.rotation.y += 0.005;
      previewGroup.rotation.x = Math.sin(Date.now() * 0.0005) * 0.1;
      
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
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen text-slate-200 relative bg-[#020617] overflow-hidden">
      
      {/* Decorative Orbs & Grids */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] cyan-glow-orb pointer-events-none -z-10 opacity-70" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] purple-glow-orb pointer-events-none -z-10 opacity-70" />
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
            <a href="#features" className="hover:text-cyan-400 transition-colors uppercase relative py-1 group">
              Pipeline
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full" />
            </a>
            <a href="#showroom" className="hover:text-cyan-400 transition-colors uppercase relative py-1 group">
              Showroom
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
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-cyan-900/60 hover:bg-cyan-900/60 hover:border-cyan-400/80 text-cyan-400 text-xs font-bold font-mono tracking-wider transition-all flex items-center space-x-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <span>LAUNCH WORKSPACE</span>
              <ArrowRight className="h-3.5 w-3.5" />
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
        <div className="lg:col-span-5 h-[360px] md:h-[450px] glass-panel rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800/80 animate-fade-in-up animation-delay-100">
          <div ref={threeRef} className="w-full h-full" />
          <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-850 px-3.5 py-1.5 rounded-lg text-[10px] font-mono text-cyan-400 flex items-center space-x-2 shadow-md">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-450 animate-ping" />
            <span>REAL-TIME CSG PREVIEW</span>
          </div>
          
          {/* Cybernetic details in the viewport corner */}
          <div className="absolute bottom-4 left-4 bg-slate-950/80 border border-slate-850 p-3 rounded-lg max-w-xs space-y-1 font-mono text-[9px] text-slate-400 shadow-md">
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

      {/* Feature Section */}
      <section id="features" className="border-t border-slate-900 bg-slate-950/40 py-20 md:py-28 relative">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold font-mono tracking-widest text-cyan-400 uppercase">Computational pipeline</h2>
            <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-none">How the Voxel Compiler Works</p>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">Our multi-agent runtime parses prompts and generates compliant spatial components.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div 
              onMouseEnter={() => setHoveredFeature(0)}
              onMouseLeave={() => setHoveredFeature(null)}
              className={`glass-panel p-6 rounded-2xl border flex flex-col space-y-4 transition-all duration-300 relative overflow-hidden ${
                hoveredFeature === 0 ? "border-cyan-550 shadow-[0_0_30px_rgba(6,182,212,0.08)] -translate-y-2" : "border-slate-850"
              }`}
            >
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-850 text-cyan-400 self-start">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">1. Ingest Specs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Describe your mechanical intent using natural language, or upload an engineering datasheet. Our LLM extracts precise dimensional boundaries.
              </p>
              {hoveredFeature === 0 && <span className="absolute bottom-0 left-0 w-full h-1 bg-cyan-450" />}
            </div>

            {/* Step 2 */}
            <div 
              onMouseEnter={() => setHoveredFeature(1)}
              onMouseLeave={() => setHoveredFeature(null)}
              className={`glass-panel p-6 rounded-2xl border flex flex-col space-y-4 transition-all duration-300 relative overflow-hidden ${
                hoveredFeature === 1 ? "border-purple-550 shadow-[0_0_30px_rgba(168,85,247,0.08)] -translate-y-2" : "border-slate-850"
              }`}
            >
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-850 text-purple-400 self-start">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">2. Research Agent</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The agent parses inputs and cross-references manufacturing method limitations (FDM, SLA, SLM) to construct candidate parameters.
              </p>
              {hoveredFeature === 1 && <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-450" />}
            </div>

            {/* Step 3 */}
            <div 
              onMouseEnter={() => setHoveredFeature(2)}
              onMouseLeave={() => setHoveredFeature(null)}
              className={`glass-panel p-6 rounded-2xl border flex flex-col space-y-4 transition-all duration-300 relative overflow-hidden ${
                hoveredFeature === 2 ? "border-amber-550 shadow-[0_0_30px_rgba(245,158,11,0.08)] -translate-y-2" : "border-slate-850"
              }`}
            >
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-850 text-amber-400 self-start">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">3. Physics Safety Check</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A localized physics validation loop recalculates wall thicknesses, hoop stresses, and sheer tolerances, enforcing overrides where mechanical failure is likely.
              </p>
              {hoveredFeature === 2 && <span className="absolute bottom-0 left-0 w-full h-1 bg-amber-450" />}
            </div>

            {/* Step 4 */}
            <div 
              onMouseEnter={() => setHoveredFeature(3)}
              onMouseLeave={() => setHoveredFeature(null)}
              className={`glass-panel p-6 rounded-2xl border flex flex-col space-y-4 transition-all duration-300 relative overflow-hidden ${
                hoveredFeature === 3 ? "border-emerald-550 shadow-[0_0_30px_rgba(16,185,129,0.08)] -translate-y-2" : "border-slate-850"
              }`}
            >
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-850 text-emerald-400 self-start">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase">4. Solid Voxel Compilation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compiles the refined boundaries into C# PicoGK voxel nodes, producing a watertight production-ready `.3mf` solid object ready for fabrication.
              </p>
              {hoveredFeature === 3 && <span className="absolute bottom-0 left-0 w-full h-1 bg-emerald-450" />}
            </div>

          </div>
        </div>
      </section>

      {/* Preset Showroom Section */}
      <section id="showroom" className="max-w-7xl mx-auto px-6 py-20 md:py-28 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
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
        </div>

        {/* Selected Preset Details Glass Card */}
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

          <div className="lg:col-span-5 bg-[#030611] rounded-2xl border border-slate-900 p-6 flex flex-col justify-between space-y-6">
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
      </section>

      {/* HUD Metrics Dashboard */}
      <section id="stats" className="border-t border-slate-900 bg-slate-950/40 py-20 md:py-28 relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          
          <div className="space-y-5">
            <div className="inline-flex items-center space-x-2 bg-purple-950/20 border border-purple-850 px-3 py-1 rounded-full text-purple-400 text-[10px] font-mono">
              <Activity className="h-3 w-3" />
              <span>LIVE VPS OPERATIONS AUDIT</span>
            </div>
            <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">Platform Operational Performance Metrics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We monitor the compiler queue live on VPS targets, ensuring fast solid mesh generation, database records cleanliness, and verified mechanical strength.
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Stat 1 */}
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

            {/* Stat 2 */}
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

            {/* Stat 3 */}
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

          </div>

        </div>
      </section>

      {/* Onboarding Call to Action */}
      <section className="max-w-4xl mx-auto px-6 py-20 md:py-28 text-center space-y-8 relative">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">Start Building Solid Objects</h2>
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
