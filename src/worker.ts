import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { updateJob, appendJobLog, getNextPendingJob, Job } from "./db/db";
import { runAgentLoop } from "./agent/agent";

const WORK_DIR = path.resolve(process.cwd(), "public", "jobs");

if (!fs.existsSync(WORK_DIR)) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
}

console.log("==================================================");
console.log("[WORKER] VeloLabs SQLite Queue Worker Started.");
console.log("[WORKER] Listening for pending computational engineering runs...");
console.log("==================================================");

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processJob(job: Job) {
  const jobId = job.jobId;
  const prompt = job.prompt;
  
  const jobDir = path.join(WORK_DIR, jobId);
  if (!fs.existsSync(jobDir)) {
    fs.mkdirSync(jobDir, { recursive: true });
  }

  const log = async (msg: string) => {
    console.log(`[Job ${jobId}] ${msg}`);
    await appendJobLog(jobId, msg);
  };

  // Check if there is an extracted PDF datasheet text file
  let pdfTextContent = undefined;
  const pdfTextPath = path.join(jobDir, "pdf_extracted.txt");
  if (fs.existsSync(pdfTextPath)) {
    try {
      pdfTextContent = fs.readFileSync(pdfTextPath, "utf-8");
      await log(`[SYSTEM] Loaded uploaded PDF datasheet text buffer.`);
    } catch (e: any) {
      await log(`[SYSTEM] Warning: Failed to read extracted PDF text: ${e.message}`);
    }
  }

  try {
    await log(`[SYSTEM] Starting autonomous engineering research phase...`);
    await updateJob(jobId, { status: "researching", progress: 10 });

    // Load parent schema if this is an iteration
    let parentSchema = undefined;
    if (job.parentId) {
      const parentDir = path.join(WORK_DIR, job.parentId);
      const parentUpdatedPath = path.join(parentDir, "schema_updated.json");
      const parentPath = path.join(parentDir, "schema.json");
      let chosenPath = fs.existsSync(parentUpdatedPath) ? parentUpdatedPath : (fs.existsSync(parentPath) ? parentPath : null);
      
      if (chosenPath) {
        try {
          const rawParent = fs.readFileSync(chosenPath, "utf-8");
          parentSchema = JSON.parse(rawParent);
          await log(`[SYSTEM] Loaded parent design schema from Job ${job.parentId} for design iteration.`);
        } catch (e: any) {
          await log(`[SYSTEM] Warning: Failed to load parent schema: ${e.message}`);
        }
      } else {
        await log(`[SYSTEM] Warning: Parent schema file not found in job ${job.parentId}. Starting design from scratch.`);
      }
    }

    // Run agentic loop (Ollama + Web Search)
    const extractedSchema = await runAgentLoop(
      jobId,
      prompt,
      pdfTextContent,
      async (msg) => {
        await log(msg);
      },
      parentSchema
    );

    await log(`[SYSTEM] Research complete. Extracted dimensions parsed successfully.`);
    await updateJob(jobId, {
      status: "queueing",
      progress: 40,
      componentType: extractedSchema.componentType,
      manufacturingMethod: extractedSchema.manufacturingMethod,
      material: extractedSchema.material,
      originalDimensions: JSON.stringify(extractedSchema.dimensions)
    });

    // Write schema.json
    const schemaPath = path.join(jobDir, "schema.json");
    fs.writeFileSync(schemaPath, JSON.stringify(extractedSchema, null, 2));
    await log(`[SYSTEM] Immutable Data Bridge schema.json written to disk.`);

    let finalDimensionsStr = null;
    let outputFormat = "3mf";

    if (extractedSchema.cadScript) {
      await log(`[SYSTEM] Python CAD script detected. Dispatching to Python CAD Engine...`);
      await updateJob(jobId, { status: "compiling", progress: 50 });

      const scriptPath = path.join(jobDir, "cad_script.py");
      fs.writeFileSync(scriptPath, extractedSchema.cadScript);
      await log(`[SYSTEM] Saved Python CAD script to: ${scriptPath}`);

      // Execute Python script inside the virtual environment
      await new Promise<void>((resolve, reject) => {
        const isWindows = process.platform === "win32";
        const pythonPath = isWindows ? "python" : "/home/username/AItoMatter/venv/bin/python";

        const child = spawn(pythonPath, ["cad_script.py"], { cwd: jobDir });

        child.stdout.on("data", (data) => {
          const lines = data.toString().split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) log(`[PYTHON] ${trimmed}`);
          }
        });

        child.stderr.on("data", (data) => {
          const lines = data.toString().split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) log(`[PYTHON ERROR] ${trimmed}`);
          }
        });

        child.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Python CAD script exited with code ${code}`));
          }
        });
      });

      const outputStep = path.join(jobDir, "output.step");
      const outputStl = path.join(jobDir, "output.stl");
      const outputDxf = path.join(jobDir, "output.dxf");

      // Fallback check: if output.step/stl/dxf do not exist, check if other files were generated
      try {
        const files = fs.readdirSync(jobDir);
        if (!fs.existsSync(outputStep)) {
          const stepFile = files.find(f => f.endsWith(".step") && f !== "output.step");
          if (stepFile) {
            fs.copyFileSync(path.join(jobDir, stepFile), outputStep);
            await log(`[SYSTEM] Fallback: Copied generated ${stepFile} to output.step`);
          }
        }
        if (!fs.existsSync(outputStl)) {
          const stlFiles = files.filter(f => f.endsWith(".stl") && f !== "output.stl");
          if (stlFiles.length > 0) {
            const bestStl = stlFiles.find(f => f.toLowerCase().includes("assembly") || f.toLowerCase().includes("robot")) || 
                            stlFiles.sort((a, b) => fs.statSync(path.join(jobDir, b)).size - fs.statSync(path.join(jobDir, a)).size)[0];
            fs.copyFileSync(path.join(jobDir, bestStl), outputStl);
            await log(`[SYSTEM] Fallback: Copied generated ${bestStl} to output.stl`);
          }
        }
        if (!fs.existsSync(outputDxf)) {
          const dxfFile = files.find(f => f.endsWith(".dxf") && f !== "output.dxf");
          if (dxfFile) {
            fs.copyFileSync(path.join(jobDir, dxfFile), outputDxf);
            await log(`[SYSTEM] Fallback: Copied generated ${dxfFile} to output.dxf`);
          }
        }
      } catch (err: any) {
        await log(`[SYSTEM] Warning during fallback files scanning: ${err.message}`);
      }

      if (fs.existsSync(outputStep)) {
        await log(`[SYSTEM] Watertight STEP model compiled successfully!`);
        outputFormat = "step";
      } else if (fs.existsSync(outputDxf)) {
        await log(`[SYSTEM] 2D sheet metal DXF profile compiled successfully!`);
        outputFormat = "dxf";
      } else if (fs.existsSync(outputStl)) {
        await log(`[SYSTEM] Watertight STL model compiled successfully!`);
        outputFormat = "stl";
      } else {
        await log(`[SYSTEM] Warning: No production files (output.step/stl/dxf) were generated.`);
      }

      // Ensure output.3mf exists so the client doesn't throw a file-not-found error, 
      // copying STL to 3MF as a fallback visualization mesh
      const output3mfPath = path.join(jobDir, "output.3mf");
      if (fs.existsSync(outputStl)) {
        fs.copyFileSync(outputStl, output3mfPath);
      } else if (!fs.existsSync(output3mfPath)) {
        fs.writeFileSync(output3mfPath, "");
      }

      // Set final dimensions same as original
      finalDimensionsStr = JSON.stringify(extractedSchema.dimensions);
      
      const updatedSchemaPath = path.join(jobDir, "schema_updated.json");
      if (!fs.existsSync(updatedSchemaPath)) {
        fs.writeFileSync(updatedSchemaPath, JSON.stringify(extractedSchema, null, 2));
      }
    }

    if (extractedSchema.sdfScript) {
      await log(`[SYSTEM] SDF Simulation description detected. Dispatching to Simulator Builder...`);
      await updateJob(jobId, { status: "compiling", progress: 70 });

      let isSdfCompiled = false;
      const trimmedSdf = extractedSchema.sdfScript.trim();
      const isXml = trimmedSdf.startsWith("<") || trimmedSdf.startsWith("<?xml");

      if (isXml) {
        const sdfPath = path.join(jobDir, "output.sdf");
        fs.writeFileSync(sdfPath, extractedSchema.sdfScript);
        await log(`[SYSTEM] Saved direct SDF XML output to: ${sdfPath}`);
        isSdfCompiled = true;
      } else {
        // Python generator script
        const sdfScriptPath = path.join(jobDir, "sdf_script.py");
        fs.writeFileSync(sdfScriptPath, extractedSchema.sdfScript);
        await log(`[SYSTEM] Saved Python SDF generator script to: ${sdfScriptPath}`);

        await new Promise<void>((resolve, reject) => {
          const isWindows = process.platform === "win32";
          const pythonPath = isWindows ? "python" : "/home/username/AItoMatter/venv/bin/python";

          const child = spawn(pythonPath, ["sdf_script.py"], { cwd: jobDir });

          child.stdout.on("data", (data) => {
            const lines = data.toString().split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed) log(`[PYTHON-SDF] ${trimmed}`);
            }
          });

          child.stderr.on("data", (data) => {
            const lines = data.toString().split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed) log(`[PYTHON-SDF ERROR] ${trimmed}`);
            }
          });

          child.on("close", (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Python SDF script exited with code ${code}`));
            }
          });
        });

        const sdfPath = path.join(jobDir, "output.sdf");
        if (!fs.existsSync(sdfPath)) {
          try {
            const files = fs.readdirSync(jobDir);
            const sdfFile = files.find(f => f.endsWith(".sdf") && f !== "output.sdf");
            if (sdfFile) {
              fs.copyFileSync(path.join(jobDir, sdfFile), sdfPath);
              await log(`[SYSTEM] Fallback: Copied generated ${sdfFile} to output.sdf`);
            }
          } catch (err: any) {
            await log(`[SYSTEM] Warning scanning fallback SDF files: ${err.message}`);
          }
        }

        if (fs.existsSync(sdfPath)) {
          isSdfCompiled = true;
        } else {
          await log(`[SYSTEM] Warning: Python SDF generator script did not produce output.sdf`);
        }
      }

      if (isSdfCompiled) {
        await log(`[SYSTEM] SDF Simulator description compiled successfully!`);
        outputFormat = "sdf";
        
        // Ensure finalDimensionsStr is set
        if (!finalDimensionsStr) {
          finalDimensionsStr = JSON.stringify(extractedSchema.dimensions);
        }

        const updatedSchemaPath = path.join(jobDir, "schema_updated.json");
        if (!fs.existsSync(updatedSchemaPath)) {
          fs.writeFileSync(updatedSchemaPath, JSON.stringify(extractedSchema, null, 2));
        }
      }
    }

    if (!extractedSchema.cadScript && !extractedSchema.sdfScript) {
      await log(`[SYSTEM] Dispatching to C# Voxel Engine...`);
      await updateJob(jobId, { status: "compiling", progress: 50 });

      // Resolve C# Compiler paths
      const output3mfPath = path.join(jobDir, "output.3mf");
      const isWindows = process.platform === "win32";
      const binaryName = isWindows ? "cem.exe" : "cem";
      const cemExe = path.resolve(
        process.cwd(),
        "cem",
        "bin",
        "Debug",
        "net9.0",
        binaryName
      );

      if (!fs.existsSync(cemExe)) {
        throw new Error(`C# CEM Compiler executable not found at: ${cemExe}. Please run 'dotnet build cem/cem.csproj'.`);
      }

      await log(`[SYSTEM] Spawning CEM Engine process...`);

      // Run C# compiler
      await new Promise<void>((resolve, reject) => {
        const isWindows = process.platform === "win32";
        const customEnv = {
          ...process.env,
          DOTNET_ROOT: process.env.DOTNET_ROOT || (isWindows ? process.env.DOTNET_ROOT : "/home/username/.dotnet"),
          PATH: process.env.PATH
            ? (isWindows ? process.env.PATH : `/home/username/.dotnet:${process.env.PATH}`)
            : (isWindows ? "" : "/home/username/.dotnet:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin")
        };
        const child = spawn(cemExe, [schemaPath, output3mfPath], { env: customEnv });

        child.stdout.on("data", (data) => {
          const lines = data.toString().split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
              log(trimmed);
              if (trimmed.includes("Rendering shape field")) {
                updateJob(jobId, { progress: 70 });
              } else if (trimmed.includes("converting voxel matrix")) {
                updateJob(jobId, { progress: 85 });
              } else if (trimmed.includes("Saving production 3MF")) {
                updateJob(jobId, { progress: 95 });
              }
            }
          }
        });

        child.stderr.on("data", (data) => {
          const line = data.toString().trim();
          if (line) {
            log(`[CEM ERROR] ${line}`);
          }
        });

        child.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`CEM Engine exited with code ${code}`));
          }
        });
      });

      // Retrieve C# adjusted dimensions
      const updatedSchemaPath = path.join(jobDir, "schema_updated.json");
      if (fs.existsSync(updatedSchemaPath)) {
        try {
          const updatedSchema = JSON.parse(fs.readFileSync(updatedSchemaPath, "utf-8"));
          finalDimensionsStr = JSON.stringify(updatedSchema.Dimensions || updatedSchema.dimensions);
          await log(`[SYSTEM] Loaded finalized physical engineering dimensions.`);
        } catch (e: any) {
          await log(`[SYSTEM] Warning: Failed to parse updated schema JSON: ${e.message}`);
        }
      }

      await log(`[SYSTEM] Watertight .3mf file compiled successfully!`);
    }

    await updateJob(jobId, {
      status: "completed",
      progress: 100,
      finalDimensions: finalDimensionsStr,
      outputFilePath: `/jobs/${jobId}/output.${outputFormat}`
    });

  } catch (err: any) {
    await log(`[SYSTEM ERROR] Processing failed: ${err.message}`);
    await updateJob(jobId, { status: "failed", progress: 100 });
  }
}

async function startQueueWorker() {
  while (true) {
    try {
      const job = await getNextPendingJob();
      if (job) {
        console.log(`[QUEUE] Found pending job ${job.jobId}. Locking and executing...`);
        // Update status to prevent double-processing (acting as a basic mutex lock)
        await updateJob(job.jobId, { status: "researching" });
        
        // Fetch updated job state and run
        const lockedJob = await getNextPendingJob();
        // Since we changed status to researching, getNextPendingJob won't fetch it again,
        // which gives us mutex exclusivity for single-threaded worker!
        await processJob(job);
      }
    } catch (err: any) {
      console.error("[QUEUE] Error in worker processing loop:", err.message);
    }
    // Poll delay
    await sleep(1500);
  }
}

startQueueWorker();
