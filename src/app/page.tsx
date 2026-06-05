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
import { motion, useScroll, useSpring } from "framer-motion";

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
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
      desc: "Topological voxel grid layout of the central core. Aether CEM interprets force loads to layout a localized strain-aligned voxel node-field.",
      prompt: "Synthesize organic structural lattice for a 12-DoF quadruped knee roll joint, optimize for 400N torque, resolution 100um.",
      spec: "Lattice Nodes: 1,420 | Resolution: 100µm"
    },
    optimized: {
      title: "Gen 2: Stress Exoskeleton",
      desc: "Variable-thickness protective outer shells. Aether dynamically constructs an exoskeleton casing to protect the core.",
      prompt: "Generate adaptive variable-thickness protective shell over knee roll joint lattice, thicken stress-concentration nodes.",
      spec: "Thickness: 1.2 - 4.5mm | Stress Limit: 320MPa"
    },
    linkages: {
      title: "Gen 3: Gyroscope Rings",
      desc: "Concentric spinning brass stabilizer rings. Integrates multi-stage gyroscope linkages to ensure mechanical torque balance.",
      prompt: "Integrate QDD motor flange mounts and dual closed-loop hydraulic linkages for abduction joint flexion clearance.",
      spec: "Stabilizers: 3x Interlocking | Clearance: Collision-Free"
    },
    production: {
      title: "Gen 4: Production 3MF",
      desc: "Watertight titanium solid compile. Unifies all structural layers into a single manifold print-ready titanium node.",
      prompt: "Compile combined bionic knee joint assembly into watertight production-ready 3MF file format, optimized for SLM Titanium.",
      spec: "Manifold: 100% Watertight | Material: Titanium"
    }
  };

  // Eased Video Scrubbing Engine (Awwwards-Level)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animFrame: number;
    let smoothTime = 0;

    const updateVideo = () => {
      animFrame = requestAnimationFrame(updateVideo);
      if (!video.duration || isNaN(video.duration)) return;

      const targetScroll = scrollYProgress.get();
      // Easing Stage 1: smooth out scroll updates (inertial momentum)
      currentScrollFraction.current += (targetScroll - currentScrollFraction.current) * 0.05;
      
      const targetTime = currentScrollFraction.current * video.duration;
      // Easing Stage 2: filter micro-stuttering in browsers
      smoothTime += (targetTime - smoothTime) * 0.1;

      // Only update if changes are perceptible (saving GPU/CPU cycles)
      if (Math.abs(video.currentTime - smoothTime) > 0.01 && smoothTime >= 0 && smoothTime <= video.duration) {
        video.currentTime = smoothTime;
      }
    };

    const handleLoadedMetadata = () => {
      video.currentTime = 0;
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    updateVideo();

    return () => {
      cancelAnimationFrame(animFrame);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [scrollYProgress]);

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
            <button onClick={() => scrollToSection(1)} className="hover:text-amber-550 transition-colors uppercase cursor-pointer">
              Gen 1
            </button>
            <button onClick={() => scrollToSection(2)} className="hover:text-amber-550 transition-colors uppercase cursor-pointer">
              Gen 2
            </button>
            <button onClick={() => scrollToSection(3)} className="hover:text-amber-550 transition-colors uppercase cursor-pointer">
              Gen 3
            </button>
            <button onClick={() => scrollToSection(4)} className="hover:text-amber-550 transition-colors uppercase cursor-pointer">
              Gen 4
            </button>
            <button onClick={() => scrollToSection(5)} className="hover:text-amber-550 transition-colors uppercase cursor-pointer">
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

      {/* FIXED 3D VIDEO VIEWPORT CONTAINER (Projected on the right side) */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none flex items-center justify-center lg:justify-end overflow-hidden">
        <div className="w-full h-full lg:w-1/2 relative lg:mr-16 flex items-center justify-center pt-16 lg:pt-0">
          
          {/* Futuristic HUD glowing rings under the video */}
          <div className="absolute w-[80vw] h-[80vw] lg:w-[42vw] lg:h-[42vw] rounded-full border border-zinc-900/40 pointer-events-none z-0 animate-spin-slow opacity-30" />
          <div className="absolute w-[60vw] h-[60vw] lg:w-[32vw] lg:h-[32vw] rounded-full border border-dashed border-amber-500/10 pointer-events-none z-0 animate-pulse-slow" />
          
          <video
            ref={videoRef}
            src="/neural_core.mp4"
            preload="auto"
            muted
            playsInline
            className="w-full max-h-[75vh] object-contain relative z-10 opacity-80 mix-blend-screen"
            style={{ filter: "contrast(1.15) brightness(0.95)" }}
          />
        </div>
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
                <span>Powered by Aether (CEM v1.5)</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
                  Translate Prompts into{" "}
                  <span className="text-amber-500 block">
                    Solid Bionic Geometry
                  </span>
                </h1>
                
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-xl">
                  An agentic compiler pipeline driven by **Aether**, our custom **1.4B Parameter Computational Engineering Model (CEM)**. Pre-trained on 2.8M biological strain maps and bionic parts, Aether maps language constraints into watertight sintering geometries.
                </p>
              </div>

              {/* Core capabilities list */}
              <div className="space-y-3 font-mono text-xs text-zinc-300">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="h-4 w-4 text-amber-550 shrink-0" />
                  <span>Ingest manufacturer datasheets (PDF) & textual constraints</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="h-4 w-4 text-amber-550 shrink-0" />
                  <span>Synthesize organic bionic lattices & protective stress shells</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="h-4 w-4 text-amber-550 shrink-0" />
                  <span>Integrate spinning gyroscope stabilizers & torque linkages</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="h-4 w-4 text-amber-550 shrink-0" />
                  <span>1-click watertight solid compilation to 3MF formats</span>
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
                <span>1. INGESTION & TOPOLOGY MATRIX</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-none">Gen 1: Topological Voxel Lattice</h2>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl">
                The **Aether** model interprets force loads and spatial boundary limits. It maps strain vectors to compile a localized topological voxel lattice core, synthesized over a 5.0M voxel/cm³ density field.
              </p>
              
              <div className="glass-panel p-4.5 rounded-lg border border-zinc-850 max-w-md font-mono text-[11px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">LATTICE MODEL:</span>
                  <span className="text-zinc-200 font-bold">Aether 1.4B CEM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">TRAINING DATASET:</span>
                  <span className="text-amber-550 font-bold">2.8M Bionic Nodes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">GRID TOLERANCE:</span>
                  <span className="text-zinc-200 font-bold">&le; 50 µm resolution</span>
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
                <span>2. LOCAL STRESS AUDIT OVERRIDES</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-none">Gen 2: Stress Exoskeleton</h2>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl">
                A physics validation loop evaluates localized cantilever and hoop stresses. Aether automatically wraps the lattice core inside a variable-thickness obsidian exoskeleton protective shell, reinforcing stress hot-spots (up to 320MPa limit).
              </p>
              
              <div className="glass-panel p-4.5 rounded-lg border border-zinc-850 max-w-md font-mono text-[11px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">EXOSKELETON SHELL:</span>
                  <span className="text-zinc-200 font-bold">4-Quadrant Radial Split</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">STRESS THRESHOLD:</span>
                  <span className="text-zinc-200 font-bold">320 MPa Verified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">SAFETY CONSTRAINT:</span>
                  <span className="text-emerald-500 font-bold">2.2x Auto-Override</span>
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
                <span>3. TORQUE BALANCE STABILIZATION</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-none">Gen 3: Gyroscope Rings</h2>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl">
                Aether integrates concentric spinning brass gyroscope stabilizer rings and double-stage copper hydraulic linkages into the casing joints. The solver validates kinetic clearances, ensuring collision-free rotation under load.
              </p>
              
              <div className="glass-panel p-4.5 rounded-lg border border-zinc-850 max-w-md font-mono text-[11px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">STABILIZERS:</span>
                  <span className="text-zinc-200 font-bold">3x Interlocking Brass Gyros</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">TORQUE KINEMATICS:</span>
                  <span className="text-zinc-200 font-bold">Double-Stage Hydraulics</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">CLEARANCE AUDIT:</span>
                  <span className="text-emerald-500 font-bold">100% Collision-Free Solved</span>
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
                <span>4. SOLID MANIFOLD COMPILATION</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-none">Gen 4: Production 3MF</h2>
              <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-xl">
                The final compile stage unifies the mercury core, obsidian casings, and gyroscope rings into a single watertight manifold volume. Generated coordinates output in 3MF format, optimized for SLM Titanium sintering.
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
                <span>AETHER MODEL SPECS & TELEMETRY</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-none">Computational Metrics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
              <div className="glass-panel p-6 rounded border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase block mb-2">Aether Model Size</span>
                <span className="text-3xl md:text-4xl font-bold text-amber-550">1.4B Param</span>
              </div>
              <div className="glass-panel p-6 rounded border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase block mb-2">Training Corpus</span>
                <span className="text-3xl md:text-4xl font-bold text-zinc-100">2.8M CAD</span>
              </div>
              <div className="glass-panel p-6 rounded border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase block mb-2">Watertight Compile Rate</span>
                <span className="text-3xl md:text-4xl font-bold text-emerald-500">100% Solid</span>
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
