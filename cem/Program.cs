using System;
using System.IO;
using System.Text.Json;
using System.Collections.Generic;
using PicoGK;

namespace VeloLabs.CEM
{
    class Program
    {
        static int Main(string[] args)
        {
            Console.WriteLine("========================================");
            Console.WriteLine("VeloLabs CEM Voxel Engine Starting...");
            Console.WriteLine("========================================");

            if (args.Length < 2)
            {
                Console.Error.WriteLine("ERROR: Missing arguments.");
                Console.Error.WriteLine("Usage: VeloLabs.CEM <input_schema_path> <output_3mf_path>");
                return 1;
            }

            string inputPath = args[0];
            string outputPath = args[1];

            if (!File.Exists(inputPath))
            {
                Console.Error.WriteLine($"ERROR: Input schema file not found at: {inputPath}");
                return 1;
            }

            try
            {
                // 1. Read and parse schema.json
                Console.WriteLine($"[CEM ENGINE] Reading schema file: {inputPath}");
                string jsonText = File.ReadAllText(inputPath);
                
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    WriteIndented = true
                };

                EngineeringSchema schema = JsonSerializer.Deserialize<EngineeringSchema>(jsonText, options) 
                    ?? throw new Exception("Failed to deserialize schema JSON.");

                Console.WriteLine($"[CEM ENGINE] Job ID: {schema.JobId}");
                Console.WriteLine($"[CEM ENGINE] Component: {schema.ComponentType}");
                Console.WriteLine($"[CEM ENGINE] Material: {schema.Material} ({schema.MaterialAllowableStressMpa} MPa allowable)");

                // 2. Apply Physics Safety Checks and Overrides
                PhysicsOverride.Apply(schema);

                // 3. Apply Tolerances and Print Shrinkage micro-offsets
                ToleranceEngine.Apply(schema);

                // 4. Save updated schema back to disk (in the same directory) so Node.js brain knows about overrides
                string updatedPath = Path.Combine(Path.GetDirectoryName(inputPath) ?? "", "schema_updated.json");
                Console.WriteLine($"[CEM ENGINE] Writing adjusted mechanical dimensions to: {updatedPath}");
                string updatedJson = JsonSerializer.Serialize(schema, options);
                File.WriteAllText(updatedPath, updatedJson);

                // 5. Initialize PicoGK in headless mode
                // Voxel resolution of 0.25mm for high geometric accuracy
                float voxelSizeMM = 0.25f;
                Console.WriteLine($"[CEM ENGINE] Initializing Voxel Kernel (Resolution: {voxelSizeMM}mm)...");
                Library lib = new Library(voxelSizeMM);
                Library.RegisterGlobalLibrary(lib);
                Console.WriteLine("[CEM ENGINE] Voxel Kernel active.");

                // 6. Build the geometry using PicoGK SDF voxels
                Console.WriteLine("[CEM ENGINE] Rendering shape field...");
                Voxels voxels = GeometryBuilder.Build(schema);

                // 7. Extract the manifold triangle mesh
                Console.WriteLine("[CEM ENGINE] Converting voxel matrix to watertight triangle mesh...");
                Mesh mesh = new Mesh(in voxels);
                Console.WriteLine($"[CEM ENGINE] Mesh compiled: {mesh.nVertexCount()} vertices, {mesh.nTriangleCount()} triangles");

                // 8. Package and write as a .3mf ZIP package
                Console.WriteLine($"[CEM ENGINE] Saving production 3MF file to: {outputPath}");
                ThreeMFExporter.ExportTo3mf(mesh, outputPath);

                // 9. Clean up PicoGK Core Library
                Console.WriteLine("[CEM ENGINE] Finalizing kernel resources...");
                lib.Dispose();

                Console.WriteLine("========================================");
                Console.WriteLine("CEM Geometry Compilation SUCCESSFUL!");
                Console.WriteLine("========================================");
                return 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("\n========================================");
                Console.Error.WriteLine("CEM ENGINE CRITICAL EXCEPTION:");
                Console.Error.WriteLine(ex.ToString());
                Console.Error.WriteLine("========================================");
                return 1;
            }
        }
    }

    public class Dimensions
    {
        // Motor Housing
        public double BoltSpacing { get; set; }
        public double ShaftDiameter { get; set; }
        public double PilotDiameter { get; set; }
        public double PilotDepth { get; set; }
        public double HousingLength { get; set; }
        public double WallThickness { get; set; }
        public double BoltHoleDiameter { get; set; }

        // Fluid Pipe
        public double PressurePsi { get; set; }
        public double BoreDiameter { get; set; }
        public double PipeLength { get; set; }

        // Bracket
        public double LoadNewtons { get; set; }
        public double BracketWidth { get; set; }
        public double BracketLength { get; set; }
        public double BracketThickness { get; set; }
        public double HoleDiameter { get; set; }

        // Gear
        public int ToothCount { get; set; }
        public double Module { get; set; }
        public double FaceWidth { get; set; }
        public double KeywayWidth { get; set; }
        public double KeywayDepth { get; set; }

        // Custom
        public double Width { get; set; }
        public double Height { get; set; }
        public double Depth { get; set; }
        public double Thickness { get; set; }
    }

    public class CSGNode
    {
        public string Type { get; set; } = string.Empty; // box, cylinder, sphere, gear, union, difference, intersection
        public Dictionary<string, double>? Dimensions { get; set; }
        public double[]? Position { get; set; } // [x, y, z] center offset
        public double[]? Rotation { get; set; } // [pitch, yaw, roll] rotation
        public CSGNode? Left { get; set; }
        public CSGNode? Right { get; set; }
    }

    public class EngineeringSchema
    {
        public string JobId { get; set; } = string.Empty;
        public string ComponentType { get; set; } = string.Empty;
        public string ManufacturingMethod { get; set; } = string.Empty;
        public string Material { get; set; } = string.Empty;
        public double MaterialAllowableStressMpa { get; set; }
        public Dimensions Dimensions { get; set; } = new Dimensions();
        public CSGNode GeometryTree { get; set; } = new CSGNode();
    }
}
