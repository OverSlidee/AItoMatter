"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Layers, 
  Cpu, 
  Sparkles, 
  Activity, 
  Gauge,
  Binary,
  FileText,
  Sliders,
  Download,
  Terminal,
  Check
} from "lucide-react";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";

function HeaderButton({ label, start, end, smoothScroll, onClick }: { label: string, start: number, end: number, smoothScroll: any, onClick: () => void }) {
  const color = useTransform(
    smoothScroll,
    [start - 0.02, start, end, end + 0.02],
    ["#a1a1aa", "#f59e0b", "#f59e0b", "#a1a1aa"] // zinc-400 to amber-500
  );
  
  return (
    <button onClick={onClick} className="cursor-pointer transition-colors text-[9px] font-mono tracking-widest">
      <motion.span style={{ color }}>{label}</motion.span>
    </button>
  );
}

function DotIndicator({ item, smoothScroll, onClick }: { item: any, smoothScroll: any, onClick: () => void }) {
  const scale = useTransform(
    smoothScroll,
    [item.activeStart - 0.02, item.activeStart, item.activeEnd, item.activeEnd + 0.02],
    [1, 1.25, 1.25, 1]
  );
  
  const color = useTransform(
    smoothScroll,
    [item.activeStart - 0.02, item.activeStart, item.activeEnd, item.activeEnd + 0.02],
    ["#3f3f46", "#f59e0b", "#f59e0b", "#3f3f46"]
  );
  
  const opacity = useTransform(
    smoothScroll,
    [item.activeStart - 0.02, item.activeStart, item.activeEnd, item.activeEnd + 0.02],
    [0.4, 1, 1, 0.4]
  );

  return (
    <button 
      onClick={onClick} 
      className="group flex items-center space-x-4 justify-end focus:outline-none cursor-pointer text-right"
    >
      <span className="text-[8px] font-mono tracking-widest text-zinc-500 group-hover:text-amber-500 transition-all opacity-0 group-hover:opacity-100 uppercase pointer-events-none transform translate-x-2 group-hover:translate-x-0">
        {item.label}
      </span>
      <motion.div
        style={{ scale, backgroundColor: color, opacity }}
        className="w-2.5 h-2.5 rounded-full border border-zinc-950 shadow-sm transition-shadow group-hover:shadow-[0_0_8px_rgba(245,158,11,0.5)]"
      />
    </button>
  );
}

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Cinematic loading preloader states
  const [loading, setLoading] = useState(true);
  const [loadPct, setLoadPct] = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  // Framer Motion Scroll Progress Indicator
  const { scrollYProgress } = useScroll();
  
  // Custom spring physics to mimic the deceleration and inertia of oryzo.ai
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 20, // Lower stiffness for a heavier, cinematic feel
    damping: 24,    // Damps out micro-stutters and adds smooth ease-out inertia
    mass: 0.8,
    restDelta: 0.0001
  });

  const scrollToSection = (progress: number) => {
    const targetY = progress * (document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({
      top: targetY,
      behavior: "smooth"
    });
  };

  // Beat 0b: Build By VeloLabs (0.0 to 0.14)
  const opacity0b = useTransform(smoothScroll, [0.0, 0.10, 0.14], [1, 1, 0]);
  const y0b = useTransform(smoothScroll, [0.0, 0.10, 0.14], [0, 0, -40]);
  const blur0b = useTransform(smoothScroll, [0.0, 0.10, 0.14], ["blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat Aether: Aether Reveal (0.55 to 0.70)
  const opacityAether = useTransform(smoothScroll, [0.52, 0.55, 0.68, 0.72], [0, 1, 1, 0]);
  const yAether = useTransform(smoothScroll, [0.52, 0.55, 0.68, 0.72], [40, 0, 0, -40]);
  const blurAether = useTransform(smoothScroll, [0.52, 0.55, 0.68, 0.72], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // Pointer event mappings to prevent background overlay clicks when hidden
  const pointer0b = useTransform(opacity0b, (v) => v > 0.15 ? "auto" : "none");
  const pointerAether = useTransform(opacityAether, (v) => v > 0.15 ? "auto" : "none");

  // Dot Navigation visibility adjustments (fade out past Aether section)
  const dotsOpacity = useTransform(smoothScroll, [0.70, 0.73], [1, 0]);
  const dotsPointerEvents = useTransform(smoothScroll, (v) => v > 0.71 ? "none" : "auto");

  // Scroll indicator chevron opacity (only active in intro block)
  const scrollIndicatorOpacity = useTransform(smoothScroll, [0.0, 0.05], [1, 0]);

  // Ambient glow shifts linked to spring progress
  const orb1Scale = useTransform(smoothScroll, [0, 0.5, 1], [1, 1.3, 1]);
  const orb1Opacity = useTransform(smoothScroll, [0, 0.3, 0.7, 1], [0.25, 0.4, 0.3, 0.2]);
  const orb1Y = useTransform(smoothScroll, [0, 1], ["0px", "100px"]);

  const orb2Scale = useTransform(smoothScroll, [0, 0.5, 1], [1, 1.2, 1.5]);
  const orb2Opacity = useTransform(smoothScroll, [0, 0.4, 0.8, 1], [0.15, 0.3, 0.2, 0.3]);
  const orb2X = useTransform(smoothScroll, [0, 1], ["0px", "-150px"]);

  // 3D tilted grid shift
  const gridY = useTransform(smoothScroll, [0, 1], ["0px", "-120px"]);
  const gridOpacity = useTransform(smoothScroll, [0, 0.5, 1], [0.45, 0.2, 0.45]);

  // Cinematic loading preloader simulation & coordination with video loading
  useEffect(() => {
    // Safety fallback timeout to ensure preloader always finishes
    const fallbackTimeout = setTimeout(() => {
      setVideoReady(true);
    }, 3500);

    const interval = setInterval(() => {
      setLoadPct((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        // If video not ready, cap progression at 90%
        if (prev >= 90 && !videoReady) {
          return prev;
        }

        // Speed up to finish once video is ready, otherwise progress organically
        const step = videoReady 
          ? Math.random() * 12 + 6 
          : Math.random() * 6 + 2;
        
        return Math.min(videoReady ? 100 : 90, Math.floor(prev + step));
      });
    }, 40);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimeout);
    };
  }, [videoReady]);

  // Initial check in case video is cached and readyState is already loaded
  useEffect(() => {
    // Force page scroll to top on reload/load to ensure video starts at the beginning
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const video = videoRef.current;
    if (video) {
      if (video.readyState >= 3) {
        setVideoReady(true);
      }
    }
  }, []);

  useEffect(() => {
    if (loadPct === 100) {
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 450); // Small pause at 100% for smooth unmounting
      return () => clearTimeout(timeout);
    }
  }, [loadPct]);

  // Eased Video Scrubbing Engine (Awwwards-Level)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animFrame: number;
    let smoothTime = 0;
    let lastTime = 0;

    const updateVideo = () => {
      animFrame = requestAnimationFrame(updateVideo);
      
      const duration = 10.0; // Hardcoded length in seconds (10s)
      const targetScroll = smoothScroll.get();
      
      // Map scroll progress [0.0, 0.75] to video timeline [0.0, 10.0] seconds
      const scrollPctForVideo = Math.min(1.0, targetScroll / 0.75);
      const targetTime = scrollPctForVideo * duration;

      // Filter micro-jittering in browsers by easing targetTime
      smoothTime += (targetTime - smoothTime) * 0.10;
      
      const boundedTime = Math.max(0, Math.min(duration - 0.02, smoothTime));

      const now = performance.now();
      
      // Throttle seeking slightly to allow GPU decoder to load frames smoothly
      if (now - lastTime > 20) { 
        if (Math.abs(video.currentTime - boundedTime) > 0.01 && !video.seeking) {
          video.currentTime = boundedTime;
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
  }, [smoothScroll]);

  // Metallic Text Shadow for readability over glowing video core
  const metallicShadow = {
    textShadow: "0 0 35px rgba(0,0,0,0.95), 0 4px 12px rgba(0,0,0,0.85)"
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen text-zinc-100 relative bg-black overflow-hidden">
      
      {/* Cinematic Organic Noise Overlay */}
      <div className="noise-overlay" />

      {/* Scroll Progress Bar at the top of the viewport */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-amber-500 origin-left z-50"
        style={{ scaleX: smoothScroll }}
      />

      {/* Subtle Background Parallax Ambient Bronze Orbs & Grids */}
      <motion.div 
        style={{ scale: orb1Scale, opacity: orb1Opacity, y: orb1Y }}
        className="fixed -top-20 -left-20 w-[600px] h-[600px] bronze-glow-orb pointer-events-none z-10" 
      />
      <motion.div 
        style={{ scale: orb2Scale, opacity: orb2Opacity, x: orb2X }}
        className="fixed -bottom-20 -right-20 w-[600px] h-[600px] copper-glow-orb pointer-events-none z-10" 
      />
      <motion.div 
        style={{ y: gridY, opacity: gridOpacity, perspective: 1000, rotateX: 45 }}
        className="dot-grid fixed inset-0 pointer-events-none z-10 origin-center" 
      />

      {/* Cinematic loading preloader overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center font-mono"
          >
            {/* Ambient background glow inside preloader */}
            <div className="absolute w-[300px] h-[300px] rounded-full bg-amber-500/5 blur-[80px]" />
            
            <div className="space-y-6 text-center max-w-xs px-6 relative z-10">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border border-dashed border-amber-500/40 rounded-full flex items-center justify-center mx-auto"
              >
                <Layers className="h-5 w-5 text-amber-500" />
              </motion.div>
              
              <div className="space-y-2">
                <div className="text-[10px] tracking-[0.3em] text-zinc-550 uppercase">SYSTEM DIAGNOSTIC LOAD</div>
                <div className="text-3xl font-extrabold text-amber-500 tracking-wider">
                  {loadPct}%
                </div>
              </div>

              {/* Progress bar line */}
              <div className="w-48 h-[1px] bg-zinc-900 rounded overflow-hidden mx-auto relative">
                <motion.div 
                  className="h-full bg-amber-500 absolute left-0 top-0 bottom-0"
                  style={{ width: `${loadPct}%` }}
                />
              </div>

              <div className="text-[8px] tracking-[0.25em] text-zinc-500 uppercase h-4">
                {loadPct < 30 && "INITIALIZING CEM KERNEL..."}
                {loadPct >= 30 && loadPct < 70 && "PARSING VOXEL TENSOR PIPELINE..."}
                {loadPct >= 70 && loadPct < 100 && "BUFFERING NEURAL CORE VIDEO..."}
                {loadPct === 100 && "COMPILER PIPELINE READY"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL-SCREEN FIXED VIDEO CONTAINER */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none flex items-center justify-center overflow-hidden bg-black">
        {/* HUD backdrop elements centered under the video */}
        <div className="absolute w-[95vw] h-[95vw] lg:w-[60vw] lg:h-[60vw] rounded-full border border-zinc-900/35 pointer-events-none z-0 animate-spin-slow opacity-25" />
        <div className="absolute w-[75vw] h-[75vw] lg:w-[45vw] lg:h-[45vw] rounded-full border border-dashed border-amber-500/5 pointer-events-none z-0 animate-pulse-slow" />
        
        <video
          ref={videoRef}
          src="/neural_core.mp4"
          preload="auto"
          muted
          playsInline
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          className="w-full h-full object-cover scale-[1.03] relative z-10 opacity-70 mix-blend-screen"
          style={{ filter: "contrast(1.15) brightness(0.95)" }}
        />
      </div>

      {/* CENTERED FIXED SCROLLYTELLING OVERLAY CONTAINER */}
      <div className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="max-w-4xl mx-auto px-6 w-full flex flex-col items-center justify-center text-center relative min-h-[350px] md:min-h-[450px]">
          
          {/* Beat 0b: Build By VeloLabs */}
          <motion.div 
            style={{ opacity: opacity0b, y: y0b, filter: blur0b, pointerEvents: pointer0b }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-4 py-1.5 rounded-full text-amber-555 text-[9px] md:text-[10px] font-mono shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>COMPUTATIONAL ENGINEERING EXPERIMENT</span>
            </div>
            <h1 
              style={{ textShadow: "0 0 35px rgba(245,158,11,0.25), 0 4px 12px rgba(0,0,0,0.85)" }}
              className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-[0.2em] leading-none text-amber-500 uppercase"
            >
              BUILD BY VELOLABS
            </h1>
            <p className="text-amber-500/80 text-[10px] sm:text-xs font-mono tracking-[0.15em] sm:tracking-[0.2em] uppercase leading-relaxed max-w-lg">
              SCROLL TO DECONSTRUCT THE CORE &amp; EXPLORE PLATFORM CAPABILITIES.
            </p>
          </motion.div>

          {/* Beat Aether: Aether Core Reveal */}
          <motion.div 
            style={{ opacity: opacityAether, y: yAether, filter: blurAether, pointerEvents: pointerAether }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="text-amber-500/80 font-mono text-[8px] md:text-[9px] tracking-[0.3em] uppercase">SYSTEM / CORE ACTIVATED</div>
            <h2 
              style={{ textShadow: "0 0 45px rgba(245,158,11,0.3), 0 4px 15px rgba(0,0,0,0.9)" }}
              className="text-4xl sm:text-6xl md:text-8xl font-black tracking-[0.25em] leading-none text-amber-500 uppercase"
            >
              AETHER
            </h2>
            <p className="text-amber-500 text-[10px] sm:text-xs font-mono tracking-[0.15em] sm:tracking-[0.2em] uppercase leading-relaxed max-w-xl">
              AI to Matter CEM engine
            </p>
            
            <div className="space-y-4 pt-3 md:pt-4 pointer-events-auto w-full flex flex-col items-center">
              <Link
                href="/workspace"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-[10px] md:text-xs py-3.5 md:py-4 px-6 md:px-10 rounded shadow-md transition-all flex items-center justify-center space-x-3 cursor-pointer"
              >
                <span>LAUNCH COMPILER WORKSPACE</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="text-[8px] md:text-[9px] font-mono text-zinc-455 uppercase tracking-wider">
                &copy; {new Date().getFullYear()} VeloLabs. AI TO MATTER COMPILER PIPELINE.
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* VERTICAL DOT NAVIGATION */}
      <motion.div 
        style={{ opacity: dotsOpacity, pointerEvents: dotsPointerEvents }}
        className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col space-y-6 z-45 hidden sm:flex"
      >
        {[
          { label: "00 / BUILD", val: 0.0, activeStart: 0.0, activeEnd: 0.14 },
          { label: "01 / AETHER", val: 0.62, activeStart: 0.52, activeEnd: 0.70 },
        ].map((item, idx) => (
          <DotIndicator key={idx} item={item} smoothScroll={smoothScroll} onClick={() => scrollToSection(item.val)} />
        ))}
      </motion.div>

      {/* Scroll indicator chevron */}
      <motion.div 
        style={{ opacity: scrollIndicatorOpacity }}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 text-zinc-550 z-30 pointer-events-none"
      >
        <span className="text-[9px] font-mono tracking-[0.3em] uppercase animate-pulse">SCROLL TO OPERATE CORE</span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-amber-500 to-transparent animate-bounce" />
      </motion.div>

      {/* SCROLL RANGE SPACE DRIVER */}
      <div className="h-[450vh] w-full pointer-events-none" />

      {/* DYNAMIC CAPABILITIES SHOWCASE SECTION */}
      <div className="relative z-20 bg-black border-t border-zinc-900/60 pb-32 pt-24">
        {/* Decorative background grid inside capabilities */}
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-4 py-1.5 rounded-full text-amber-550 text-[10px] font-mono shadow-sm">
              <Cpu className="h-3.5 w-3.5 text-amber-500" />
              <span>AETHER IN ACTION</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase">
              Platform Capabilities
            </h2>
            <p className="text-sm text-zinc-400 font-mono tracking-wider uppercase">
              Physical engineering parts generated directly from simple prompts.
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Text to CAD */}
            <div className="glass-panel p-6 rounded-xl border border-zinc-900/80 bg-zinc-950/40 relative flex flex-col h-full group glow-card">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 w-fit mb-5">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mb-2">1. Plain-English Compiler</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Type what you need—like a custom gear, bracket, or casing—and Aether compiles it directly into physical 3D geometry. No CAD experience required.
              </p>
              
              {/* Mockup */}
              <div className="mt-auto bg-zinc-950/80 border border-zinc-900 rounded-lg p-3.5 font-mono text-[9px] text-zinc-550">
                <div className="text-[8px] text-zinc-600 mb-1.5 uppercase border-b border-zinc-900/50 pb-1 flex justify-between">
                  <span>Prompt Compiler</span>
                  <span className="text-amber-500 animate-pulse">● Live</span>
                </div>
                <div className="text-zinc-300 leading-normal italic mb-2.5">
                  &ldquo;create a double-flanged shaft bracket, 40mm length, 12mm bore diameter&rdquo;
                </div>
                <div className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[8px] py-1.5 px-2 rounded text-center transition-colors">
                  COMPILE TO 3D MESH
                </div>
              </div>
            </div>

            {/* Card 2: Iterative Timelines */}
            <div className="glass-panel p-6 rounded-xl border border-zinc-900/80 bg-zinc-950/40 relative flex flex-col h-full group glow-card">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 w-fit mb-5">
                <Sliders className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mb-2">2. Iterative Design History</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Don&apos;t worry about getting it perfect on the first try. You can modify designs with follow-up instructions and navigate version history dynamically.
              </p>
              
              {/* Mockup */}
              <div className="mt-auto bg-zinc-950/80 border border-zinc-900 rounded-lg p-3.5 font-mono text-[9px] text-zinc-550">
                <div className="text-[8px] text-zinc-650 mb-2 uppercase border-b border-zinc-900/50 pb-1">
                  Revision Timeline
                </div>
                <div className="space-y-2.5 relative pl-4 before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
                  <div className="flex items-center space-x-2 relative">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 absolute -left-[16px] border border-zinc-950" />
                    <span className="text-zinc-550">v1.0</span>
                    <span className="text-zinc-450 truncate">Base Bracket Model</span>
                  </div>
                  <div className="flex items-center space-x-2 relative">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 absolute -left-[16px] border border-zinc-950" />
                    <span className="text-zinc-555">v1.1</span>
                    <span className="text-zinc-450 truncate">Added Central Cylinder</span>
                  </div>
                  <div className="flex items-center space-x-2 relative">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute -left-[16px] border border-zinc-950 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <span className="text-amber-500 font-bold">v1.2</span>
                    <span className="text-zinc-300 truncate font-semibold">Tension Rib Reinforced</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Live Compilation Logs */}
            <div className="glass-panel p-6 rounded-xl border border-zinc-900/80 bg-zinc-950/40 relative flex flex-col h-full group glow-card">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 w-fit mb-5">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mb-2">3. Diagnostic Compiler Logs</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Watch Aether build your physical geometry frame-by-frame. Observe voxel tensor operations, physical stress audits, and compliance checks live.
              </p>
              
              {/* Mockup */}
              <div className="mt-auto bg-zinc-950/80 border border-zinc-900 rounded-lg p-3.5 font-mono text-[8px] text-zinc-550">
                <div className="text-[8px] text-zinc-650 mb-1.5 uppercase border-b border-zinc-900/50 pb-1">
                  Active Compiler Console
                </div>
                <div className="space-y-1.5 text-zinc-450">
                  <div className="flex justify-between">
                    <span>[info] parsing voxel model...</span>
                    <span className="text-zinc-600">0.02s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>[info] manifold check: solid 100%</span>
                    <span className="text-emerald-500">pass</span>
                  </div>
                  <div className="flex justify-between">
                    <span>[info] optimizing SLA mesh...</span>
                    <span className="text-zinc-600">0.04s</span>
                  </div>
                  <div className="text-amber-500 font-bold border-t border-zinc-900/50 pt-1 flex justify-between mt-1">
                    <span>[done] compilation complete</span>
                    <span>0.08s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Material Optimization */}
            <div className="glass-panel p-6 rounded-xl border border-zinc-900/80 bg-zinc-950/40 relative flex flex-col h-full group glow-card">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 w-fit mb-5">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mb-2">4. Multi-Material Settings</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Specify your manufacturing target—Plastic, Resin, or Metal—and our compiler automatically builds solid meshes optimized for your material characteristics.
              </p>
              
              {/* Mockup */}
              <div className="mt-auto bg-zinc-950/80 border border-zinc-900 rounded-lg p-3.5 font-mono text-[9px] text-zinc-550">
                <div className="text-[8px] text-zinc-600 mb-2 uppercase border-b border-zinc-900/50 pb-1">
                  Manufacturing Method
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[7px]">
                  <div className="bg-zinc-900 border border-zinc-850 py-1.5 rounded text-zinc-500 uppercase">
                    FDM Plastic
                  </div>
                  <div className="bg-zinc-900 border border-zinc-850 py-1.5 rounded text-zinc-500 uppercase">
                    SLA Resin
                  </div>
                  <div className="bg-amber-500/15 border border-amber-500/50 py-1.5 rounded text-amber-500 font-bold uppercase shadow-[0_0_6px_rgba(245,158,11,0.15)]">
                    SLM Metal
                  </div>
                </div>
                <div className="mt-2.5 text-[8px] text-zinc-400 flex items-center space-x-1.5">
                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>Configuring voxel resolution for alloy sintering.</span>
                </div>
              </div>
            </div>

            {/* Card 5: WebGL 3D Preview */}
            <div className="glass-panel p-6 rounded-xl border border-zinc-900/80 bg-zinc-950/40 relative flex flex-col h-full group glow-card">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 w-fit mb-5">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mb-2">5. Interactive 3D Viewer</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Inspect your designs in real-time. Use the browser viewport to rotate, zoom, and verify structure before clicking download.
              </p>
              
              {/* Mockup */}
              <div className="mt-auto bg-zinc-950/80 border border-zinc-900 rounded-lg p-3.5 font-mono text-[9px] text-zinc-550 h-20 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                  {/* Mock grid lines */}
                  <div className="w-full h-[1px] bg-white absolute top-1/2" />
                  <div className="h-full w-[1px] bg-white absolute left-1/2" />
                  <div className="w-12 h-12 border border-white rounded transform rotate-45 animate-spin-slow" />
                </div>
                <div className="text-[7px] text-zinc-600 uppercase relative z-10 flex justify-between">
                  <span>3D Viewport</span>
                  <span>90 FPS</span>
                </div>
                <div className="text-[7px] text-zinc-450 relative z-10 bg-zinc-900/60 w-fit px-1.5 py-0.5 rounded border border-zinc-850">
                  Rotate: Click &amp; Drag
                </div>
              </div>
            </div>

            {/* Card 6: Watertight Exports */}
            <div className="glass-panel p-6 rounded-xl border border-zinc-900/80 bg-zinc-950/40 relative flex flex-col h-full group glow-card">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 w-fit mb-5">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mb-2">6. 3D-Printer Ready Files</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Export generated structures directly to watertight 3MF and STL formats. Guaranteed solid geometry with zero open mesh boundaries.
              </p>
              
              {/* Mockup */}
              <div className="mt-auto bg-zinc-950/80 border border-zinc-900 rounded-lg p-3.5 font-mono text-[9px] text-zinc-550">
                <div className="text-[8px] text-zinc-650 mb-1.5 uppercase border-b border-zinc-900/50 pb-1">
                  Compile Output
                </div>
                <div className="flex justify-between items-center bg-zinc-900/60 p-1.5 rounded border border-zinc-850 mb-2">
                  <span className="text-zinc-305 font-bold truncate">bracket_v1.2_slm.3mf</span>
                  <span className="text-zinc-500 text-[8px] shrink-0">1.8 MB</span>
                </div>
                <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 font-bold text-[8px] py-1.5 px-2 rounded text-center transition-colors flex items-center justify-center space-x-1">
                  <Download className="h-2.5 w-2.5" />
                  <span>DOWNLOAD WATERTIGHT 3MF</span>
                </div>
              </div>
            </div>

          </div>

          {/* CTA Footer */}
          <div className="mt-20 text-center space-y-4">
            <Link
              href="/workspace"
              className="inline-flex bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs py-4 px-10 rounded shadow-md transition-all items-center space-x-3 cursor-pointer"
            >
              <span>LAUNCH LIVE WORKSPACE NOW</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              No registration or setup needed to run initial compiles.
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
