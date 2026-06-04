import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; filename: string }> }
) {
  try {
    const { jobId, filename } = await params;

    // Prevent directory traversal attacks by taking only the basenames
    const cleanJobId = path.basename(jobId);
    const cleanFilename = path.basename(filename);

    const filePath = path.join(process.cwd(), "public", "jobs", cleanJobId, cleanFilename);

    if (!fs.existsSync(filePath)) {
      console.warn(`[JOBS ROUTE] File not found: ${filePath}`);
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    let contentType = "application/octet-stream";
    if (cleanFilename.endsWith(".3mf")) {
      contentType = "application/vnd.ms-package.3dmanufacturing-3mf";
    } else if (cleanFilename.endsWith(".json")) {
      contentType = "application/json";
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${cleanFilename}"`,
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[JOBS ROUTE] Error serving file:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
