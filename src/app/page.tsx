"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Layers, 
  Cpu, 
  Sparkles, 
  Activity, 
  Gauge,
  Binary 
} from "lucide-react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentScrollFraction = useRef(0);

  // Framer Motion Scroll Progress Indicator
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const scrollToSection = (progress: number) => {
    const targetY = progress * (document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({
      top: targetY,
      behavior: "smooth"
    });
  };

  // Beat 0: Intro (0.0 to 0.12)
  const opacity0 = useTransform(scrollYProgress, [0.0, 0.08, 0.12], [1, 1, 0]);
  const y0 = useTransform(scrollYProgress, [0.0, 0.08, 0.12], [0, 0, -40]);
  const blur0 = useTransform(scrollYProgress, [0.0, 0.08, 0.12], ["blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat 1: Aether Reveal (0.12 to 0.32)
  const opacity1 = useTransform(scrollYProgress, [0.10, 0.16, 0.28, 0.32], [0, 1, 1, 0]);
  const y1 = useTransform(scrollYProgress, [0.10, 0.16, 0.28, 0.32], [40, 0, 0, -40]);
  const blur1 = useTransform(scrollYProgress, [0.10, 0.16, 0.28, 0.32], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat 2: Ingest (0.32 to 0.50)
  const opacity2 = useTransform(scrollYProgress, [0.30, 0.36, 0.46, 0.50], [0, 1, 1, 0]);
  const y2 = useTransform(scrollYProgress, [0.30, 0.36, 0.46, 0.50], [40, 0, 0, -40]);
  const blur2 = useTransform(scrollYProgress, [0.30, 0.36, 0.46, 0.50], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat 3: Physics (0.50 to 0.68)
  const opacity3 = useTransform(scrollYProgress, [0.48, 0.54, 0.64, 0.68], [0, 1, 1, 0]);
  const y3 = useTransform(scrollYProgress, [0.48, 0.54, 0.64, 0.68], [40, 0, 0, -40]);
  const blur3 = useTransform(scrollYProgress, [0.48, 0.54, 0.64, 0.68], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat 4: Kinematics (0.68 to 0.84)
  const opacity4 = useTransform(scrollYProgress, [0.66, 0.72, 0.80, 0.84], [0, 1, 1, 0]);
  const y4 = useTransform(scrollYProgress, [0.66, 0.72, 0.80, 0.84], [40, 0, 0, -40]);
  const blur4 = useTransform(scrollYProgress, [0.66, 0.72, 0.80, 0.84], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat 5: Workspace (0.84 to 1.0)
  const opacity5 = useTransform(scrollYProgress, [0.82, 0.88, 1.0], [0, 1, 1]);
  const y5 = useTransform(scrollYProgress, [0.82, 0.88, 1.0], [40, 0, 0]);
  const blur5 = useTransform(scrollYProgress, [0.82, 0.88, 1.0], ["blur(12px)", "blur(0px)", "blur(0px)"]);

  // Pointer event mappings to prevent background overlay clicks when hidden
  const pointer0 = useTransform(opacity0, (v) => v > 0.15 ? "auto" : "none");
  const pointer1 = useTransform(opacity1, (v) => v > 0.15 ? "auto" : "none");
  const pointer2 = useTransform(opacity2, (v) => v > 0.15 ? "auto" : "none");
  const pointer3 = useTransform(opacity3, (v) => v > 0.15 ? "auto" : "none");
  const pointer4 = useTransform(opacity4, (v) => v > 0.15 ? "auto" : "none");
  const pointer5 = useTransform(opacity5, (v) => v > 0.15 ? "auto" : "none");

  // Eased Video Scrubbing Engine (Awwwards-Level)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animFrame: number;
    let smoothTime = 0;
    let lastTime = 0;

    const updateVideo = () => {
      animFrame = requestAnimationFrame(updateVideo);
      if (!video.duration || isNaN(video.duration)) return;

      const targetScroll = scrollYProgress.get();
      // Easing Stage 1: smooth out scroll updates (inertial momentum)
      currentScrollFraction.current += (targetScroll - currentScrollFraction.current) * 0.05;
      
      const targetTime = currentScrollFraction.current * video.duration;
      // Easing Stage 2: filter micro-stuttering in browsers
      smoothTime += (targetTime - smoothTime) * 0.08;

      const now = performance.now();
      if (now - lastTime > 30) { // Throttle to ~33fps to prevent decoder queue buildup
        if (Math.abs(video.currentTime - smoothTime) > 0.01 && !video.seeking) {
          video.currentTime = smoothTime;
          lastTime = now;
        }
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

  // Metallic Text Shadow for readability over glowing video core
  const metallicShadow = {
    textShadow: "0 0 35px rgba(0,0,0,0.95), 0 4px 12px rgba(0,0,0,0.85)"
  };

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
            <button onClick={() => scrollToSection(0.0)} className="hover:text-amber-550 transition-colors uppercase cursor-pointer">
              Intro
            </button>
            <button onClick={() => scrollToSection(0.22)} className="hover:text-amber-550 transition-colors uppercase cursor-pointer">
              Aether
            </button>
            <button onClick={() => scrollToSection(0.41)} className="hover:text-amber-550 transition-colors uppercase cursor-pointer">
              01 / Ingest
            </button>
            <button onClick={() => scrollToSection(0.59)} className="hover:text-amber-550 transition-colors uppercase cursor-pointer">
              02 / Audit
            </button>
            <button onClick={() => scrollToSection(0.77)} className="hover:text-amber-550 transition-colors uppercase cursor-pointer">
              03 / Solver
            </button>
            <button onClick={() => scrollToSection(0.95)} className="hover:text-amber-550 transition-colors uppercase cursor-pointer">
              04 / Workspace
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

      {/* FULL-SCREEN FIXED VIDEO CONTAINER */}
      <div className="fixed inset-0 w-screen h-screen z-0 pointer-events-none flex items-center justify-center overflow-hidden bg-[#09090b]">
        {/* HUD backdrop elements centered under the video */}
        <div className="absolute w-[95vw] h-[95vw] lg:w-[60vw] lg:h-[60vw] rounded-full border border-zinc-900/35 pointer-events-none z-0 animate-spin-slow opacity-25" />
        <div className="absolute w-[75vw] h-[75vw] lg:w-[45vw] lg:h-[45vw] rounded-full border border-dashed border-amber-500/5 pointer-events-none z-0 animate-pulse-slow" />
        
        <video
          ref={videoRef}
          src="/neural_core.mp4"
          preload="auto"
          muted
          playsInline
          className="w-full h-full object-contain relative z-10 opacity-70 mix-blend-screen"
          style={{ filter: "contrast(1.15) brightness(0.95)" }}
        />
      </div>

      {/* CENTERED FIXED SCROLLYTELLING OVERLAY CONTAINER */}
      <div className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="max-w-4xl mx-auto px-6 w-full flex flex-col items-center justify-center text-center relative min-h-[450px]">
          
          {/* Beat 0: Intro */}
          <motion.div 
            style={{ opacity: opacity0, y: y0, filter: blur0, pointerEvents: pointer0 }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-4 py-1.5 rounded-full text-amber-550 text-[10px] font-mono shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>COMPUTATIONAL ENGINEERING EXPERIMENT</span>
            </div>
            <h1 
              style={metallicShadow}
              className="text-4xl md:text-6xl font-extrabold tracking-[0.2em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-200 uppercase"
            >
              INTRODUCED BY VELOLABS
            </h1>
            <p className="text-zinc-400 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-lg">
              SCROLL TO DECONSTRUCT THE CORE &amp; EXPLORE PLATFORM CAPABILITIES.
            </p>
          </motion.div>

          {/* Beat 1: Aether Reveal */}
          <motion.div 
            style={{ opacity: opacity1, y: y1, filter: blur1, pointerEvents: pointer1 }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="text-zinc-550 font-mono text-[9px] tracking-[0.3em] uppercase">SYSTEM / ARCHITECTURE</div>
            <h2 
              style={metallicShadow}
              className="text-4xl md:text-7xl font-black tracking-[0.25em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-200 uppercase"
            >
              AETHER
            </h2>
            <p className="text-zinc-300 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-xl">
              OUR CUSTOM COMPUTATIONAL ENGINEERING ENGINE. TRANSLATING RAW ARTIFICIAL INTELLIGENCE DIRECTLY INTO WATERTIGHT PHYSICAL MATTER.
            </p>
          </motion.div>

          {/* Beat 2: Capability 1 - Ingest */}
          <motion.div 
            style={{ opacity: opacity2, y: y2, filter: blur2, pointerEvents: pointer2 }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
              <Binary className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>CAPABILITY 01</span>
            </div>
            <h2 
              style={metallicShadow}
              className="text-4xl md:text-5xl font-black tracking-[0.18em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-200 uppercase"
            >
              INGEST DATASHEETS
            </h2>
            <p className="text-zinc-300 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-xl">
              UPLOAD MANUFACTURER PDF SPECIFICATIONS OR TYPE SIMPLE MECHANICAL REQUIREMENTS. AETHER INSTANTLY PARSES PRECISION BOUNDARIES AND FORCE LOADS.
            </p>
          </motion.div>

          {/* Beat 3: Capability 2 - Audits */}
          <motion.div 
            style={{ opacity: opacity3, y: y3, filter: blur3, pointerEvents: pointer3 }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
              <Activity className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>CAPABILITY 02</span>
            </div>
            <h2 
              style={metallicShadow}
              className="text-4xl md:text-5xl font-black tracking-[0.18em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-200 uppercase"
            >
              PHYSICS AUDITS
            </h2>
            <p className="text-zinc-300 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-xl">
              EVALUATES MECHANICAL STRAIN UNDER TORQUE LOAD. THE MODEL AUTOMATICALLY REINFORCES STRUCTURES AND THICKENS CASES TO ENFORCE OVERRIDE LIMITS.
            </p>
          </motion.div>

          {/* Beat 4: Capability 3 - Kinematics */}
          <motion.div 
            style={{ opacity: opacity4, y: y4, filter: blur4, pointerEvents: pointer4 }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
              <Cpu className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>CAPABILITY 03</span>
            </div>
            <h2 
              style={metallicShadow}
              className="text-4xl md:text-5xl font-black tracking-[0.18em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-200 uppercase"
            >
              KINEMATIC SOLVER
            </h2>
            <p className="text-zinc-300 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-xl">
              VERIFIES ROTATIONAL CLEARANCES AND CLOSED-LOOP TRANSMISSION LINKAGES. ENSURES ALL MOVING JOINTS SWING FREELY WITHOUT COLLISION.
            </p>
          </motion.div>

          {/* Beat 5: Workspace CTA & Stats */}
          <motion.div 
            style={{ opacity: opacity5, y: y5, filter: blur5, pointerEvents: pointer5 }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
              <Gauge className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>CEM PRODUCTION TELEMETRY</span>
            </div>
            <h2 
              style={metallicShadow}
              className="text-4xl md:text-5xl font-black tracking-[0.18em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-200 uppercase"
            >
              04 / WORKSPACE
            </h2>
            
            <div className="grid grid-cols-3 gap-4 font-mono text-[9px] w-full max-w-md">
              <div className="glass-panel p-3 rounded border border-zinc-850">
                <span className="text-zinc-550 block mb-1 uppercase">Solves Speed</span>
                <span className="text-sm font-bold text-amber-550">0.08 s</span>
              </div>
              <div className="glass-panel p-3 rounded border border-zinc-850">
                <span className="text-zinc-550 block mb-1 uppercase">Training Corpus</span>
                <span className="text-sm font-bold text-zinc-300">2.8M CAD</span>
              </div>
              <div className="glass-panel p-3 rounded border border-zinc-850">
                <span className="text-zinc-550 block mb-1 uppercase">Manifold</span>
                <span className="text-sm font-bold text-emerald-500">100% Solid</span>
              </div>
            </div>

            <div className="space-y-4 pt-2 pointer-events-auto">
              <Link
                href="/workspace"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs py-4 px-10 rounded shadow-md transition-all flex items-center justify-center space-x-3 cursor-pointer"
              >
                <span>LAUNCH COMPILER WORKSPACE</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="text-[9px] font-mono text-zinc-650 uppercase tracking-wider">
                &copy; {new Date().getFullYear()} VeloLabs. AI TO MATTER COMPILER PIPELINE.
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* SCROLL RANGE SPACE DRIVER */}
      <div className="h-[550vh] w-full pointer-events-none" />

    </div>
  );
}
