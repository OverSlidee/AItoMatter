import { NextRequest, NextResponse } from "next/server";
import { createJob, getAllJobs } from "../../../db/db";
import { extractTextFromPdf } from "../../../agent/pdfParser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt") as string;
    const file = formData.get("file") as File | null;
    const parentId = formData.get("parentId") as string | null;
    
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt parameter." }, { status: 400 });
    }

    const jobId = crypto.randomUUID();
    let pdfTextContent = "";

    if (file) {
      console.log(`[API] Processing uploaded file: ${file.name} (${file.size} bytes)`);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      pdfTextContent = await extractTextFromPdf(buffer);
    }

    // Insert job into SQLite with status = "pending"
    await createJob(jobId, prompt, parentId);

    // If PDF text was found, we will append a system log and store it temporarily in a public workspace
    if (pdfTextContent) {
      const fs = require("fs");
      const path = require("path");
      const jobDir = path.resolve(process.cwd(), "public", "jobs", jobId);
      if (!fs.existsSync(jobDir)) {
        fs.mkdirSync(jobDir, { recursive: true });
      }
      fs.writeFileSync(path.join(jobDir, "pdf_extracted.txt"), pdfTextContent);
    }

    console.log(`[API] Job created successfully in SQLite queue. Job ID: ${jobId}`);
    return NextResponse.json({ success: true, jobId });
  } catch (err: any) {
    console.error("[API] Error creating job:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const jobs = await getAllJobs();
    return NextResponse.json({ jobs });
  } catch (err: any) {
    console.error("[API] Error fetching jobs:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
