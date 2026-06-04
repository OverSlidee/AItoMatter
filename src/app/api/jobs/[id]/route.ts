import { NextRequest, NextResponse } from "next/server";
import { getJob, deleteJobAndDescendants } from "../../../../db/db";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await getJob(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (err: any) {
    console.error("[API] Error fetching job details:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Delete job and any sub-runs recursively from the SQLite database
    const deletedIds = await deleteJobAndDescendants(id);
    
    // 2. Remove files from the VPS public/jobs/[jobId] path
    const jobsDir = path.resolve(process.cwd(), "public", "jobs");
    for (const jobId of deletedIds) {
      const jobDir = path.join(jobsDir, jobId);
      if (fs.existsSync(jobDir)) {
        try {
          fs.rmSync(jobDir, { recursive: true, force: true });
          console.log(`[API] Deleted directory on VPS disk: ${jobDir}`);
        } catch (dirErr: any) {
          console.error(`[API] Failed to delete directory ${jobDir}:`, dirErr);
        }
      }
    }
    
    return NextResponse.json({ success: true, deletedCount: deletedIds.length });
  } catch (err: any) {
    console.error("[API] Error deleting job:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
