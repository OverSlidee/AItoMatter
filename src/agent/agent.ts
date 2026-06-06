import { searchDuckDuckGo } from "./ddgSearch";
import { ExtractedDimensionsSchema, ExtractedDimensions } from "./schema";

const PRIMARY_MODEL = "deepseek-v4-pro:cloud";
const FALLBACK_MODEL = "deepseek-v4-pro:cloud";

interface AgentMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function runAgentLoop(
  jobId: string,
  userPrompt: string,
  pdfTextContent?: string,
  logCallback?: (message: string) => void,
  parentSchema?: any
): Promise<ExtractedDimensions> {
  const log = logCallback || console.log;
  log(`[AGENT] Starting agent loop for Job ${jobId}`);

  let inputContext = `User Request: "${userPrompt}"`;
  if (pdfTextContent) {
    inputContext += `\n\nUploaded PDF Datasheet Text Content (extracted):\n${pdfTextContent}`;
  }
  if (parentSchema) {
    inputContext += `\n\n### ITERATION CONTEXT:\nThis is a modification request of a previously finalized design. You MUST modify the existing design to accommodate the changes rather than designing from scratch.\nPrevious Finalized Design Schema (use this as the base structure):\n${JSON.stringify(parentSchema, null, 2)}`;
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
A CSG node can be a boolean operation ("union", "difference", "intersection"), an infill operator ("gyroid_infill", "lattice_infill"), or a primitive ("box", "cylinder", "sphere", "gear", "gyroid").
Nodes can have:
- position: [x, y, z] translation offset relative to parent (default [0,0,0]).
- rotation: [pitch, yaw, roll] rotation in degrees around X, Y, Z axes (default [0,0,0]).
- left: CSGNode (required for union/difference/intersection and infill operators)
- right: CSGNode (required for union/difference/intersection)

PRIMITIVE DIMENSIONS REQUIRED:
1. "box": { "width": X, "height": Y, "depth": Z }
2. "cylinder": { "radius": R, "height": H } (defaults to Z-aligned)
3. "sphere": { "radius": R }
4. "gear": { "toothCount": N, "module": M, "faceWidth": W, "shaftDiameter": D, "keywayWidth": KW, "keywayDepth": KD }
5. "gyroid": { "cellPitch": P, "wallThickness": T, "width": W, "height": H, "depth": Z } (solid block of gyroid structure)

INFILL OPERATORS:
1. "gyroid_infill": Takes a shape in "left" and fills its volume with a gyroid pattern. Dimensions: { "cellPitch": P, "wallThickness": T }
2. "lattice_infill": Takes a shape in "left" and fills its volume with a beam lattice. Dimensions: { "cellSize": S, "beamThickness": T, "latticeType": L } where L = 0 for BodyCentre (default), 1 for Octahedron, 2 for RandomSpline.

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

Example D (Gyroid-infilled Box):
{
  "type": "gyroid_infill",
  "dimensions": { "cellPitch": 8.0, "wallThickness": 1.2 },
  "left": { "type": "box", "dimensions": { "width": 50, "height": 30, "depth": 10 } }
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

CRITICAL POSITIONING RULES:
1. All primitives (box, cylinder, sphere, gear) are centered around their position coordinate [x, y, z].
2. A cylinder of height H centered at [0, 0, Z] spans from Z - H/2 to Z + H/2 along the Z-axis.
3. A box of height Y (or depth Z) centered at [0, YC, 0] spans from YC - Y/2 to YC + Y/2.
4. To stack two cylinders (or primitives) of height H1 and H2 end-to-end along the Z-axis, if the bottom one is centered at [0, 0, 0], the top one must be positioned at [0, 0, (H1/2 + H2/2)]. Stacking them at [0, 0, H1] will leave a gap of H1/2 - H2/2, creating disjoint floating parts! Always calculate alignments relative to the geometric centers!

GUIDELINES FOR POPULAR CUSTOM GEOMETRIES:
- Gearboxes: A gearbox must include the gears (placed meshed at distance: module * (teeth1 + teeth2) / 2), the rotating shafts (cylinders) running through the gear bores, and a housing casing or mounting base.
  CRITICAL CASING MATH: If you design a casing box or backing plate to mount/enclose the gears:
  1. Width (X-axis): The gears span from MinX (Center1 - Radius1) to MaxX (Center2 + Radius2). The casing width must be at least (MaxX - MinX) + 2 * WallThickness. Center the casing X-position exactly at the midpoint: (MinX + MaxX) / 2.
  2. Height (Y-axis): The casing height must be at least 2 * Max(Radius1, Radius2) + 2 * WallThickness.
  3. Bounding Box containment: Never make the casing smaller than the gear envelope, otherwise teeth will protrude through the casing walls!
  4. Visualization choice: To keep the gears visible in the WebGL viewer rather than hiding them inside a solid box casing, prefer designing the housing as an "open-frame gearbox" using a mounting plate (a flat box backing plate placed behind the gears, e.g., offset along the Z-axis, with bored shaft holes) instead of an enclosed solid box.
- Engravings / Text: There is no native font renderer. You must represent text engravings symbolically by subtracting small, thin box or cylinder pockets from the surface (e.g., subtracting a pocket box where the name is etched, or subtracting thin primitive lines forming the word).
- Tablet Pens: A pen must include the pen body (cylinder), the pen tip (cylinder or cone-approximation), and any buttons or custom grip areas (unioned box/cylinders) securely stacked end-to-end using the center positioning math above. Do not leave gaps.

### PYTHON CAD ENGINE SPECIFICATION (build123d):
If the user request requires precise mechanical geometry, STEP/STL/DXF exports, B-Rep precision, assemblies, or standard parts catalog integration, you must write a valid Python script in the "cadScript" field of your finalize response.
The Python script runs in a virtualenv with the "build123d" library pre-installed.

YOUR SCRIPT MUST CONFORM TO THESE RULES:
1. Always import build123d: "from build123d import *"
2. Create parts/bodies inside build contexts:
   [python]
   with BuildPart() as part:
       Box(60, 100, 10)
       # Subtract holes, add chamfers, fillets, etc.
   [/python]
3. Export the final model to STEP and STL in the current working directory:
   [python]
   export_step(part.part, "output.step")
   export_stl(part.part, "output.stl")
   [/python]
4. If a sheet metal 2D profile is required, export as DXF:
   [python]
   export_dxf(part.part.faces().filter_by(Axis.Z)[0], "output.dxf")
   [/python]

Example cadScript:
[python]
from build123d import *
with BuildPart() as bracket:
    Box(40, 80, 8)
    with Locations((0, 20, 4)):
        Cylinder(radius=5, height=10, mode=Mode.SUBTRACT)
export_step(bracket.part, "output.step")
export_stl(bracket.part, "output.stl")
[/python]

### PYTHON SDF SIMULATION SPECIFICATION (SDFormat):
If the user request asks for simulator models, simulation worlds, frames, physics parameters, sensors, or lights, you must provide a valid XML string or a Python script generating that SDF XML in the "sdfScript" field of your finalize response.

RULES FOR GENERATING SDF:
1. Treat the Python generator script as the source of truth if programmatically building the XML, or supply direct SDF XML.
2. Direct SDF XML must begin with "<sdf version='1.12'>" or "<?xml".
3. If writing a Python generator script:
   - Your code must generate a file named "output.sdf" in the current working directory.
   - Example Python generator structure:
     [python]
     # Generate SDF XML content
     sdf_xml = """<?xml version="1.0" ?>
     <sdf version="1.12">
       <model name="sensor_rig">
         <static>true</static>
         <link name="base_link">
           <inertial>
             <mass>1.0</mass>
             <inertia>
               <ixx>0.083</ixx><ixy>0.0</ixy><ixz>0.0</ixz>
               <iyy>0.083</iyy><iyz>0.0</iyz><izz>0.083</izz>
             </inertia>
           </inertial>
           <visual name="visual">
             <geometry><box><size>0.2 0.2 0.2</size></box></geometry>
           </visual>
           <collision name="collision">
             <geometry><box><size>0.2 0.2 0.2</size></box></geometry>
           </collision>
           <sensor name="camera" type="camera">
             <camera>
               <horizontal_fov>1.047</horizontal_fov>
               <image><width>320</width><height>240</height></image>
               <clip><near>0.1</near><far>100</far></clip>
             </camera>
             <always_on>1</always_on>
             <update_rate>30</update_rate>
           </sensor>
         </link>
       </model>
     </sdf>
     """
     with open("output.sdf", "w") as f:
         f.write(sdf_xml)
     [/python]
4. Always specify frames, link inertials, collisions, visuals, and physics tags accurately when requested.
5. If visual geometry depends on companion STL files, reference them as "<mesh><uri>output.stl</uri></mesh>".

### ITERATIVE MODIFICATIONS:
If you receive "ITERATION CONTEXT", you are performing an evolutionary update to a previous design:
- Look at the previous schema's 'componentType', 'material', 'manufacturingMethod', 'dimensions', 'geometryTree', 'cadScript', and 'sdfScript'.
- Maintain the same material and manufacturing method unless asked to change them.
- To add/subtract/modify elements, you must reference the previous design's geometry tree or modify the existing Python cadScript/sdfScript directly.
- CRITICAL SIMPLIFICATION FOR DEEP TREES: To reference the previous geometry tree in your new 'geometryTree' structure (e.g., inside 'left' or 'right' of a union/difference/intersection), DO NOT write out or copy the entire parent geometry tree. Instead, simply use the string value "__PARENT_GEOMETRY__" (for example: "left": "__PARENT_GEOMETRY__"). The system will automatically substitute the parent tree. This prevents syntax and bracket count errors!
- To modify dimensions of existing primitives, locate them in the 'geometryTree' or under 'dimensions' and update their values in the new finalized schema.
- Preserve the previous structure where possible.

### SEARCH TOOL INSTRUCTIONS:
If you do not know the standard dimensions of components requested (like a 4kW motor shaft diameter or standard keyway size) or the material strength, you MUST run a search:
{
  "action": "search",
  "query": "exact search term here"
}

### FINALIZATION INSTRUCTIONS:
When you have all data, finalize the schema. Populate BOTH the flat "dimensions" parameters (so the C# engine can run easy physics safety overrides) AND build the full "geometryTree" matching those dimensions (and write a python "cadScript" if high-fidelity CAD/STEP output is required, or "sdfScript" if SDF simulation format is needed):
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
    },
    "cadScript": "from build123d import *\\nwith BuildPart() as p:...\\nexport_step(p.part, 'output.step')\\nexport_stl(p.part, 'output.stl')", // optional Python CAD script
    "sdfScript": "<?xml version='1.0' ?>\\n<sdf version='1.12'>..." // optional SDF simulation world/model XML or Python generator script
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
    const retries = 5;
    const delayMs = 5000;
    let lastError: any = null;

    for (let i = 0; i < retries; i++) {
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
        lastError = null;
        break; // Success, break out of retry loop
      } catch (err: any) {
        lastError = err;
        log(`[AGENT] Error communicating with Ollama (attempt ${i + 1}/${retries}): ${err.message}`);
        if (i < retries - 1) {
          log(`[AGENT] Waiting ${delayMs / 1000}s before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    if (lastError) {
      throw lastError;
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

      // Replace parent geometry placeholder if iterating
      if (parentSchema && parentSchema.geometryTree && schemaData.geometryTree) {
        schemaData.geometryTree = replaceParentPlaceholder(schemaData.geometryTree, parentSchema.geometryTree);
      }

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

function replaceParentPlaceholder(node: any, parentTree: any): any {
  if (!node) return node;
  if (
    node === "__PARENT_GEOMETRY__" || 
    (typeof node === "string" && node.includes("PARENT_GEOMETRY")) ||
    (typeof node === "object" && (node.type === "__PARENT_GEOMETRY__" || (typeof node.type === "string" && node.type.includes("PARENT_GEOMETRY"))))
  ) {
    return JSON.parse(JSON.stringify(parentTree));
  }
  if (typeof node === "object") {
    if (node.left) {
      node.left = replaceParentPlaceholder(node.left, parentTree);
    }
    if (node.right) {
      node.right = replaceParentPlaceholder(node.right, parentTree);
    }
  }
  return node;
}
