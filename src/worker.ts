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

    // Run agentic loop (Ollama + Web Search)
    const extractedSchema = await runAgentLoop(
      jobId,
      prompt,
      pdfTextContent,
      async (msg) => {
        await log(msg);
      }
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

    await log(`[SYSTEM] Dispatching to C# Voxel Engine...`);
    await updateJob(jobId, { status: "compiling", progress: 50 });

    // Resolve C# Compiler paths
    const output3mfPath = path.join(jobDir, "output.3mf");
    const cemExe = path.resolve(
      process.cwd(),
      "cem",
      "bin",
      "Debug",
      "net9.0",
      "cem.exe"
    );

    if (!fs.existsSync(cemExe)) {
      throw new Error(`C# CEM Compiler executable not found at: ${cemExe}. Please run 'dotnet build cem/cem.csproj'.`);
    }

    await log(`[SYSTEM] Spawning CEM Engine process...`);

    // Run C# compiler
    await new Promise<void>((resolve, reject) => {
      const child = spawn(cemExe, [schemaPath, output3mfPath]);

      child.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            log(trimmed);
            // Update status progress based on C# engine milestones
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
    let finalDimensionsStr = null;
    
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
    
    await updateJob(jobId, {
      status: "completed",
      progress: 100,
      finalDimensions: finalDimensionsStr,
      outputFilePath: `/jobs/${jobId}/output.3mf`
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
