"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { Maximize2, RotateCcw, Box, Grid } from "lucide-react";

interface ViewerProps {
  componentType: string;
  dimensions: any;
  outputFilePath?: string | null;
}

type ViewMode = "composite" | "solid" | "wireframe";

export default function ThreeDViewer({ componentType, dimensions: rawDimensions, outputFilePath }: ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("composite");
  const viewModeRef = useRef<ViewMode>(viewMode);
  const controlsRef = useRef<OrbitControls | null>(null);

  const dimensions = typeof rawDimensions === "string" ? JSON.parse(rawDimensions || "{}") : (rawDimensions || {});

  // Keep ref up to date so useEffect can read it without re-triggering
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712); // match page background

    // Premium glowing Ground Grid Helper
    const gridHelper = new THREE.GridHelper(100, 40, 0x06b6d4, 0x1f2937);
    gridHelper.position.y = -15;
    scene.add(gridHelper);

    // Axis Helper (X: Red, Y: Green, Z: Blue)
    const axesHelper = new THREE.AxesHelper(15);
    axesHelper.position.set(-20, -14.9, -20);
    scene.add(axesHelper);

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(40, 30, 60);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clear old canvases
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    // Add OrbitControls for camera control (zoom, rotate, pan)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // don't go below ground grid too much
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 0.6);
    dirLight2.position.set(-10, -10, 15);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xa855f7, 0.5);
    dirLight3.position.set(0, 10, -20);
    scene.add(dirLight3);

    // Group to hold our custom meshes
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);

    // Material definitions
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569, // slate metal
      metalness: 0.85,
      roughness: 0.25,
      side: THREE.DoubleSide
    });

    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });

    const boreMaterial = new THREE.MeshBasicMaterial({
      color: 0x090d16,
      side: THREE.DoubleSide
    });

    const highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      metalness: 0.7,
      roughness: 0.3
    });

    // Helper to add meshes that respond to the view mode
    const addGeometry = (geometry: THREE.BufferGeometry, material: THREE.Material, isInner = false) => {
      const solidMesh = new THREE.Mesh(geometry, material);
      const wireMesh = new THREE.Mesh(geometry, wireMaterial);
      meshGroup.add(solidMesh);
      meshGroup.add(wireMesh);

      // We store refs to update visibilities on animate
      return { solidMesh, wireMesh, isInner };
    };

    const sceneObjects: Array<{ solidMesh: THREE.Mesh; wireMesh: THREE.Mesh; isInner: boolean }> = [];

    // Helper to center mesh and update grid helper y-coordinate
    const centerAndFocusMesh = () => {
      const box = new THREE.Box3().setFromObject(meshGroup);
      const center = new THREE.Vector3();
      box.getCenter(center);
      meshGroup.position.sub(center); // center the group at (0,0,0)
      
      // Position ground grid helper exactly beneath the model bounds
      gridHelper.position.y = box.min.y - center.y - 2;
    };

    const renderFallbackGeometry = () => {
      // Build Shape dynamically based on dimensions
      if (componentType === "fluid_pipe") {
        const bore = Number(dimensions.boreDiameter) || 20;
        const wall = Number(dimensions.wallThickness) || 3;
        const length = Number(dimensions.pipeLength) || 100;
        const rOuter = (bore + 2 * wall) / 2;
        const rInner = bore / 2;

        // Outer Pipe Cylinder
        const outerGeo = new THREE.CylinderGeometry(rOuter, rOuter, length, 32, 8);
        outerGeo.rotateX(Math.PI / 2);
        sceneObjects.push(addGeometry(outerGeo, metalMaterial));

        // Inner Bore cylinder
        const innerGeo = new THREE.CylinderGeometry(rInner, rInner, length + 0.2, 32, 8);
        innerGeo.rotateX(Math.PI / 2);
        sceneObjects.push(addGeometry(innerGeo, boreMaterial, true));

      } 
      else if (componentType === "bracket") {
        const width = Number(dimensions.bracketWidth) || 30;
        const length = Number(dimensions.bracketLength) || 60;
        const thickness = Number(dimensions.bracketThickness) || 4;
        const hole = Number(dimensions.holeDiameter) || 5;

        // Horizontal plate
        const horizGeo = new THREE.BoxGeometry(width, thickness, length, 6, 2, 8);
        horizGeo.translate(0, thickness / 2, length / 2);
        sceneObjects.push(addGeometry(horizGeo, metalMaterial));

        // Vertical plate
        const vertGeo = new THREE.BoxGeometry(width, length, thickness, 6, 8, 2);
        vertGeo.translate(0, length / 2, thickness / 2);
        sceneObjects.push(addGeometry(vertGeo, metalMaterial));

        // Horizontal hole
        const holeDepth = thickness + 0.4;
        const holeGeo1 = new THREE.CylinderGeometry(hole / 2, hole / 2, holeDepth, 16, 2);
        const holeMesh1 = addGeometry(holeGeo1, boreMaterial, true);
        holeMesh1.solidMesh.position.set(0, thickness / 2, length / 2);
        holeMesh1.wireMesh.position.set(0, thickness / 2, length / 2);
        sceneObjects.push(holeMesh1);

        // Vertical hole
        const holeGeo2 = new THREE.CylinderGeometry(hole / 2, hole / 2, holeDepth, 16, 2);
        holeGeo2.rotateX(Math.PI / 2);
        const holeMesh2 = addGeometry(holeGeo2, boreMaterial, true);
        holeMesh2.solidMesh.position.set(0, length / 2, thickness / 2);
        holeMesh2.wireMesh.position.set(0, length / 2, thickness / 2);
        sceneObjects.push(holeMesh2);

      } 
      else if (componentType === "motor_housing") {
        const boltSp = Number(dimensions.boltSpacing) || 31;
        const shaft = Number(dimensions.shaftDiameter) || 5;
        const pilot = Number(dimensions.pilotDiameter) || 22;
        const pilotDep = Number(dimensions.pilotDepth) || 2;
        const hLength = Number(dimensions.housingLength) || 40;
        const wall = Number(dimensions.wallThickness) || 3;
        const boltHole = Number(dimensions.boltHoleDiameter) || 3.2;

        const plateWidth = boltSp + 12;
        const plateThick = 8;

        // Faceplate
        const plateGeo = new THREE.BoxGeometry(plateWidth, plateWidth, plateThick, 6, 6, 2);
        plateGeo.translate(0, 0, plateThick / 2);
        sceneObjects.push(addGeometry(plateGeo, metalMaterial));

        // Outer housing body
        const bodyGeo = new THREE.BoxGeometry(plateWidth, plateWidth, hLength, 6, 6, 8);
        bodyGeo.translate(0, 0, plateThick + hLength / 2);
        sceneObjects.push(addGeometry(bodyGeo, metalMaterial));

        // Inner hollow cutout
        const innerW = plateWidth - 2 * wall;
        const innerGeo = new THREE.BoxGeometry(innerW, innerW, hLength + 1, 4, 4, 6);
        innerGeo.translate(0, 0, plateThick + hLength / 2 + 0.5);
        sceneObjects.push(addGeometry(innerGeo, boreMaterial, true));

        // Center pilot raise
        const pilotGeo = new THREE.CylinderGeometry(pilot / 2, pilot / 2, pilotDep, 32, 2);
        pilotGeo.rotateX(Math.PI / 2);
        const pilotMesh = addGeometry(pilotGeo, highlightMaterial);
        pilotMesh.solidMesh.position.set(0, 0, -pilotDep / 2);
        pilotMesh.wireMesh.position.set(0, 0, -pilotDep / 2);
        sceneObjects.push(pilotMesh);

        // Center shaft hole
        const shaftGeo = new THREE.CylinderGeometry(shaft / 2 + 0.5, shaft / 2 + 0.5, plateThick + 4, 16, 2);
        shaftGeo.rotateX(Math.PI / 2);
        const shaftMesh = addGeometry(shaftGeo, boreMaterial, true);
        shaftMesh.solidMesh.position.set(0, 0, plateThick / 2);
        shaftMesh.wireMesh.position.set(0, 0, plateThick / 2);
        sceneObjects.push(shaftMesh);

        // Corner bolt holes
        const offset = boltSp / 2;
        const corners = [
          [-offset, -offset],
          [-offset, offset],
          [offset, -offset],
          [offset, offset]
        ];

        corners.forEach(([cx, cy]) => {
          const hGeo = new THREE.CylinderGeometry(boltHole / 2, boltHole / 2, plateThick + 0.4, 12, 2);
          hGeo.rotateX(Math.PI / 2);
          const hMesh = addGeometry(hGeo, boreMaterial, true);
          hMesh.solidMesh.position.set(cx, cy, plateThick / 2);
          hMesh.wireMesh.position.set(cx, cy, plateThick / 2);
          sceneObjects.push(hMesh);
        });
      }
      else if (componentType === "gear") {
        const teeth = Number(dimensions.toothCount) || 20;
        const mod = Number(dimensions.module) || 2.0;
        const shaft = Number(dimensions.shaftDiameter) || 28;
        const faceWidth = Number(dimensions.faceWidth) || 20;
        const keyW = Number(dimensions.keywayWidth) || 8;
        const keyD = Number(dimensions.keywayDepth) || 3.5;

        const pitchDia = mod * teeth;
        const outerDia = pitchDia + 2.0 * mod;
        const rootDia = pitchDia - 2.5 * mod;

        // Base gear cylinder body
        const bodyGeo = new THREE.CylinderGeometry(rootDia / 2, rootDia / 2, faceWidth, 32, 2);
        bodyGeo.rotateX(Math.PI / 2);
        sceneObjects.push(addGeometry(bodyGeo, metalMaterial));

        // Teeth generation (radial extrusion blocks)
        const toothThick = (Math.PI * mod) / 2.0; // Circular pitch width
        const toothHeight = 2.25 * mod;

        for (let i = 0; i < teeth; i++) {
          const angle = (i * 2 * Math.PI) / teeth;
          
          // Custom box geometry for the tooth
          const toothGeo = new THREE.BoxGeometry(toothThick, toothHeight, faceWidth);
          // Translate outwards radially
          const radiusPos = rootDia / 2 + toothHeight / 4;
          toothGeo.translate(0, radiusPos, 0);
          toothGeo.rotateZ(angle);
          
          // Lay flat matching Z-axis alignment
          toothGeo.rotateX(Math.PI / 2);

          sceneObjects.push(addGeometry(toothGeo, metalMaterial));
        }

        // Shaft Bore center cylinder (Z-aligned)
        const shaftGeo = new THREE.CylinderGeometry(shaft / 2, shaft / 2, faceWidth + 0.4, 32, 2);
        shaftGeo.rotateX(Math.PI / 2);
        sceneObjects.push(addGeometry(shaftGeo, boreMaterial, true));

        // Keyway slot (subtracted box visual)
        const keyGeo = new THREE.BoxGeometry(keyW, keyD + shaft / 2, faceWidth + 0.6);
        keyGeo.translate(0, shaft / 4 + keyD / 2, 0);
        keyGeo.rotateX(Math.PI / 2);
        sceneObjects.push(addGeometry(keyGeo, boreMaterial, true));
      } else {
        // Default / Custom components: Render a composite body (mounting base + cylindrical boss)
        const width = Number(dimensions.width) || Number(dimensions.bracketWidth) || 40;
        const height = Number(dimensions.height) || Number(dimensions.bracketThickness) || 12;
        const depth = Number(dimensions.depth) || Number(dimensions.bracketLength) || 60;
        const hole = Number(dimensions.holeDiameter) || Number(dimensions.shaftDiameter) || 8;

        // Base box block
        const baseGeo = new THREE.BoxGeometry(width, height, depth, 6, 2, 8);
        baseGeo.translate(0, height / 2, 0);
        sceneObjects.push(addGeometry(baseGeo, metalMaterial));

        // Raised cylindrical boss in center
        const bossR = Math.min(width, depth) / 3;
        const bossH = height;
        const bossGeo = new THREE.CylinderGeometry(bossR, bossR, bossH, 32, 2);
        const bossMesh = addGeometry(bossGeo, highlightMaterial);
        bossMesh.solidMesh.position.set(0, height + bossH / 2, 0);
        bossMesh.wireMesh.position.set(0, height + bossH / 2, 0);
        sceneObjects.push(bossMesh);

        // Bored hole through both
        const holeDepth = height + bossH + 0.4;
        const holeGeo = new THREE.CylinderGeometry(hole / 2, hole / 2, holeDepth, 16, 2);
        const holeMesh = addGeometry(holeGeo, boreMaterial, true);
        holeMesh.solidMesh.position.set(0, (height + bossH) / 2, 0);
        holeMesh.wireMesh.position.set(0, (height + bossH) / 2, 0);
        sceneObjects.push(holeMesh);
      }
      centerAndFocusMesh();
    };

    const loader = new ThreeMFLoader();
    if (outputFilePath) {
      console.log("[ThreeDViewer] Loading 3MF model from:", outputFilePath);
      loader.load(
        outputFilePath,
        (object) => {
          console.log("[ThreeDViewer] 3MF Model loaded successfully");
          object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = metalMaterial;
              child.castShadow = true;
              child.receiveShadow = true;
              
              const wireMesh = new THREE.Mesh(child.geometry, wireMaterial);
              meshGroup.add(child);
              meshGroup.add(wireMesh);
              sceneObjects.push({ solidMesh: child, wireMesh, isInner: false });
            }
          });
          centerAndFocusMesh();
        },
        undefined,
        (error) => {
          console.error("[ThreeDViewer] Error loading 3MF model, rendering fallback:", error);
          renderFallbackGeometry();
        }
      );
    } else {
      renderFallbackGeometry();
    }

    // Animation / Render Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Update objects based on chosen ViewMode
      const mode = viewModeRef.current;
      sceneObjects.forEach(({ solidMesh, wireMesh, isInner }) => {
        if (mode === "composite") {
          solidMesh.visible = true;
          // Hide wires for internal bores to keep preview clean
          wireMesh.visible = !isInner;
        } else if (mode === "solid") {
          solidMesh.visible = true;
          wireMesh.visible = false;
        } else if (mode === "wireframe") {
          solidMesh.visible = isInner; // keep inside bores solid black for clarity
          wireMesh.visible = true;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Window Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [componentType, rawDimensions, outputFilePath]);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80">
      
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Floating UI Header */}
      <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800/80 px-3 py-1 rounded text-[10px] font-mono text-cyan-400 flex items-center space-x-1.5 shadow-md">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>INTERACTIVE CAD VIEWER</span>
      </div>

      {/* Orbit Controls Instruction Banner */}
      <div className="absolute bottom-3 left-3 bg-slate-900/70 backdrop-blur px-2.5 py-1 rounded text-[9px] font-mono text-slate-400 select-none pointer-events-none hidden sm:block">
        Left-Click + Drag: Rotate | Scroll: Zoom | Right-Click: Pan
      </div>

      {/* Floating Control Panel */}
      <div className="absolute top-3 right-3 flex flex-col space-y-2">
        
        {/* View Mode Selectors */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800/80 rounded-lg p-1 flex items-center space-x-1 shadow-lg">
          <button
            onClick={() => setViewMode("composite")}
            className={`p-1.5 rounded text-xs font-mono font-bold tracking-wider flex items-center space-x-1 cursor-pointer transition-all ${
              viewMode === "composite"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Composite Mesh View"
          >
            <Box className="h-3 w-3" />
            <span className="text-[9px] uppercase">Composite</span>
          </button>
          
          <button
            onClick={() => setViewMode("solid")}
            className={`p-1.5 rounded text-xs font-mono font-bold tracking-wider flex items-center space-x-1 cursor-pointer transition-all ${
              viewMode === "solid"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Solid Material View"
          >
            <span className="text-[9px] uppercase">Solid</span>
          </button>
          
          <button
            onClick={() => setViewMode("wireframe")}
            className={`p-1.5 rounded text-xs font-mono font-bold tracking-wider flex items-center space-x-1 cursor-pointer transition-all ${
              viewMode === "wireframe"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Wireframe Mesh Grid"
          >
            <Grid className="h-3 w-3" />
            <span className="text-[9px] uppercase">Mesh Grid</span>
          </button>
        </div>

        {/* Camera Reset Utilities */}
        <button
          onClick={handleResetCamera}
          className="self-end bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 p-2 rounded-lg shadow-lg cursor-pointer transition-all flex items-center space-x-1"
          title="Reset Camera Target"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="text-[9px] font-mono uppercase">Reset Camera</span>
        </button>
      </div>

    </div>
  );
}
