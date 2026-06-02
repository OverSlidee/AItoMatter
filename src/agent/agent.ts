import { searchDuckDuckGo } from "./ddgSearch";
import { ExtractedDimensionsSchema, ExtractedDimensions } from "./schema";

const PRIMARY_MODEL = "deepseek-v4-pro:cloud";
const FALLBACK_MODEL = "qwen3.5:4b";

interface AgentMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function runAgentLoop(
  jobId: string,
  userPrompt: string,
  pdfTextContent?: string,
  logCallback?: (message: string) => void
): Promise<ExtractedDimensions> {
  const log = logCallback || console.log;
  log(`[AGENT] Starting agent loop for Job ${jobId}`);

  let inputContext = `User Request: "${userPrompt}"`;
  if (pdfTextContent) {
    inputContext += `\n\nUploaded PDF Datasheet Text Content (extracted):\n${pdfTextContent}`;
  }

  const systemPrompt = `You are VeloLabs Computational Engineering Parser Agent.
Your job is to parse a user request, perform web searches if details are missing, extract dimensions, and design a Constructive Solid Geometry (CSG) tree that represents the geometry.

### COMPONENT TYPES SUPPORTED:
- "fluid_pipe": A hollow tube channel.
- "bracket": An L-shaped or flat support connector with mounting holes.
- "gear": A radial spur gear with teeth and a central shaft bore (optionally with a keyway).
- "custom": Any other arbitrary mechanical component.

### MANUFACTURING AND MATERIALS:
- manufacturingMethod: "FDM_Plastic" | "SLA_Resin" | "SLM_Metal" (Choose based on intent. FDM/SLA for plastics/resins, SLM for metals like Titanium/Aluminum).
- material: string (e.g. PLA, Aluminum, Titanium, Steel, Resin).
- materialAllowableStressMpa: number (PLA = 30, ABS = 35, Resin = 40, Aluminum = 220, Titanium = 800, Steel = 250).

### GEOMETRY CSG TREE SPECIFICATION:
You must represent the 3D geometry of the part as a recursive CSG tree in "geometryTree".
A CSG node can be a boolean operation ("union", "difference", "intersection") or a primitive ("box", "cylinder", "sphere", "gear").
Nodes can have:
- position: [x, y, z] translation offset relative to parent (default [0,0,0]).
- rotation: [pitch, yaw, roll] rotation in degrees around X, Y, Z axes (default [0,0,0]).
- left: CSGNode (required for union/difference/intersection)
- right: CSGNode (required for union/difference/intersection)

PRIMITIVE DIMENSIONS REQUIRED:
1. "box": { "width": X, "height": Y, "depth": Z }
2. "cylinder": { "radius": R, "height": H } (defaults to Z-aligned)
3. "sphere": { "radius": R }
4. "gear": { "toothCount": N, "module": M, "faceWidth": W, "shaftDiameter": D, "keywayWidth": KW, "keywayDepth": KD }

CSG EXAMPLE TREES:

Example A (Hollow Pipe):
{
  "type": "difference",
  "left": { "type": "cylinder", "dimensions": { "radius": 13, "height": 100 } },
  "right": { "type": "cylinder", "dimensions": { "radius": 10, "height": 104 } }
}

Example B (Keyed Spur Gear):
{
  "type": "gear",
  "dimensions": { "toothCount": 20, "module": 2.0, "faceWidth": 15, "shaftDiameter": 8, "keywayWidth": 3, "keywayDepth": 1.5 }
}

Example C (Bracket Plate with a mounting hole):
{
  "type": "difference",
  "left": { "type": "box", "dimensions": { "width": 40, "height": 6, "depth": 80 }, "position": [0, 0, 3] },
  "right": { "type": "cylinder", "dimensions": { "radius": 3.0, "height": 12 }, "position": [0, 20, 3] }
}

### SEARCH LIMITS AND FALLBACK RULES:
- Limit searches to a maximum of 3 turns to avoid search scraping loops.
- If searches yield no results, or after 3 turns, IMMEDIATELY use pre-existing mechanical knowledge.
- Common fallback standard dimensions:
  - 4kW electric motor (IEC 112M standard frame): shaftDiameter = 28mm, boltSpacing = 190.5mm, pilotDiameter = 180mm.
  - Shaft standard keyways: For 28mm shaft, keywayWidth = 8mm, keywayDepth = 4.1mm. For 24mm shaft (3kW), keywayWidth = 8mm, keywayDepth = 4.0mm.
- Proceed to finalize the schema with these assumed parameters instead of continuing to search. Log your assumptions in your reasoning.

### DESIGNING COMBINED OR CUSTOM GEOMETRIES:
- If the user asks for a component connected to another component or a combination (e.g., "a gear connected to a 4kW motor"), set componentType: "custom".
- Design a composite CSG tree (using "union", "difference", or "intersection") that represents the combined assembly.
- For example, to represent a gear connected to a motor:
  - Create a "union" node.
  - The "left" node can be a "gear" primitive representing the spur gear (with its toothCount, module, faceWidth, shaftDiameter, keywayWidth, keywayDepth).
  - The "right" node can be a "cylinder" primitive representing the motor shaft (or a "box" representing the motor housing), positioned/translated next to it or through it.
- Ensure you set appropriate "position" (translation) offsets on the primitives to position them correctly relative to each other (e.g., translating the motor housing box along the Z-axis relative to the gear).

### SEARCH TOOL INSTRUCTIONS:
If you do not know the standard dimensions of components requested (like a 4kW motor shaft diameter or standard keyway size) or the material strength, you MUST run a search:
{
  "action": "search",
  "query": "exact search term here"
}

### FINALIZATION INSTRUCTIONS:
When you have all data, finalize the schema. Populate BOTH the flat "dimensions" parameters (so the C# engine can run easy physics safety overrides) AND build the full "geometryTree" matching those dimensions:
{
  "action": "finalize",
  "schema": {
    "jobId": "${jobId}",
    "componentType": "motor_housing" | "fluid_pipe" | "bracket" | "gear" | "custom",
    "manufacturingMethod": "FDM_Plastic" | "SLA_Resin" | "SLM_Metal",
    "material": "Steel",
    "materialAllowableStressMpa": 250,
    "dimensions": {
      // High-level parameters based on selected type
      // For gear: toothCount, module, faceWidth, shaftDiameter, keywayWidth, keywayDepth
      // For custom: loadNewtons, torqueNm, width, height, etc.
    },
    "geometryTree": {
      // The fully populated recursive CSG geometry tree
    }
  }
}

CRITICAL: Output ONLY valid raw JSON. Do not write text before or after the JSON.`;

  const messages: AgentMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Please process this input:\n\n${inputContext}` }
  ];

  let activeModel = PRIMARY_MODEL;
  let attempts = 0;
  const maxAttempts = 8;

  try {
    const listRes = await fetch("http://127.0.0.1:11434/api/tags");
    if (listRes.ok) {
      const data = await listRes.json();
      const models: any[] = data.models || [];
      const hasPrimary = models.some(m => m.name === PRIMARY_MODEL || m.name.startsWith(PRIMARY_MODEL));
      if (!hasPrimary) {
        log(`[AGENT] Primary model "${PRIMARY_MODEL}" not found. Checking fallback...`);
        const hasFallback = models.some(m => m.name === FALLBACK_MODEL || m.name.startsWith(FALLBACK_MODEL));
        if (hasFallback) {
          activeModel = FALLBACK_MODEL;
        } else if (models.length > 0) {
          activeModel = models[0].name;
        }
      }
    }
  } catch (err) {
    log(`[AGENT] Could not connect to local Ollama. Using default connection.`);
  }

  log(`[AGENT] Utilizing model: "${activeModel}"`);

  while (attempts < maxAttempts) {
    attempts++;
    log(`[AGENT] Turn ${attempts}/${maxAttempts}`);

    let responseText = "";
    try {
      const res = await fetch("http://127.0.0.1:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: activeModel,
          messages: messages,
          options: { temperature: 0.1 },
          stream: false
        })
      });

      if (!res.ok) {
        throw new Error(`Ollama chat returned status ${res.status}`);
      }

      const body = await res.json();
      responseText = body.message?.content || "";
    } catch (err: any) {
      log(`[AGENT] Error communicating with Ollama: ${err.message}`);
      if (activeModel === PRIMARY_MODEL) {
        log(`[AGENT] Retrying with fallback model "${FALLBACK_MODEL}"`);
        activeModel = FALLBACK_MODEL;
        attempts--;
        continue;
      }
      throw err;
    }

    let cleanText = responseText.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
    }

    log(`[AGENT] Model output:\n${cleanText}`);

    let parsedOutput: any;
    try {
      parsedOutput = JSON.parse(cleanText);
    } catch (err) {
      log(`[AGENT] Failed to parse model output as JSON. Prompting to retry.`);
      messages.push({ role: "assistant", content: responseText });
      messages.push({
        role: "user",
        content: "Error: Your response was not valid JSON. Please reply with ONLY a raw JSON block containing 'action': 'search' or 'action': 'finalize'."
      });
      continue;
    }

    if (parsedOutput.action === "search") {
      const query = parsedOutput.query;
      log(`[AGENT] Agent requested web search: "${query}"`);
      const searchResults = await searchDuckDuckGo(query);
      log(`[AGENT] Web search returned context.`);

      messages.push({ role: "assistant", content: JSON.stringify(parsedOutput) });
      messages.push({
        role: "user",
        content: `Search Results Observation:\n\n${searchResults}\n\nBased on these results, fill in dimensions and geometryTree, then finalize.`
      });
    } 
    else if (parsedOutput.action === "finalize") {
      const schemaData = parsedOutput.schema;
      schemaData.jobId = jobId;

      log(`[AGENT] Agent finalized dimensions. Running Zod validation...`);
      const validationResult = ExtractedDimensionsSchema.safeParse(schemaData);

      if (validationResult.success) {
        log(`[AGENT] Zod Schema Validation SUCCEEDED!`);
        return validationResult.data;
      } else {
        const errors = validationResult.error.issues
          .map((e: any) => `- Field '${e.path.join(".")}' error: ${e.message}`)
          .join("\n");
        log(`[AGENT] Zod Schema Validation FAILED:\n${errors}`);

        messages.push({ role: "assistant", content: JSON.stringify(parsedOutput) });
        messages.push({
          role: "user",
          content: `Zod Validation Schema Errors:\n${errors}\n\nPlease fix the properties and output a valid finalize JSON schema.`
        });
      }
    } 
    else {
      log(`[AGENT] Unknown agent action: "${parsedOutput.action}"`);
      messages.push({ role: "assistant", content: JSON.stringify(parsedOutput) });
      messages.push({
        role: "user",
        content: "Error: Unknown action. Please reply with action: 'search' or action: 'finalize'."
      });
    }
  }

  throw new Error(`Agent failed to stabilize schema within ${maxAttempts} turns.`);
}
