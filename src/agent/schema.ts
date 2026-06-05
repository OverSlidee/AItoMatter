import { z } from "zod";

// Recursive CSG (Constructive Solid Geometry) Node Schema
export interface CSGNode {
  type: "box" | "cylinder" | "sphere" | "gear" | "union" | "difference" | "intersection" | "gyroid" | "gyroid_infill" | "lattice_infill";
  dimensions?: {
    // Box: width, height, depth
    // Cylinder: radius, height
    // Sphere: radius
    // Gear: toothCount, module, faceWidth, shaftDiameter, keywayWidth, keywayDepth
    // Gyroid: cellPitch, wallThickness, width, height, depth
    // Gyroid Infill: cellPitch, wallThickness
    // Lattice Infill: cellSize, beamThickness, latticeType (0 = BodyCentre, 1 = Octahedron, 2 = RandomSpline)
    [key: string]: number;
  };
  position?: [number, number, number]; // [x, y, z] center translation offset in mm
  rotation?: [number, number, number]; // [pitch, yaw, roll] rotation angles in degrees
  left?: CSGNode;
  right?: CSGNode;
}

export const CSGNodeSchema: z.ZodType<CSGNode> = z.lazy(() =>
  z.object({
    type: z.enum(["box", "cylinder", "sphere", "gear", "union", "difference", "intersection", "gyroid", "gyroid_infill", "lattice_infill"]),
    dimensions: z.record(z.string(), z.number()).optional(),
    position: z.tuple([z.number(), z.number(), z.number()]).optional(),
    rotation: z.tuple([z.number(), z.number(), z.number()]).optional(),
    left: z.lazy(() => CSGNodeSchema).optional(),
    right: z.lazy(() => CSGNodeSchema).optional(),
  })
);

// High-level dimensions schema for engineering checks
export const MotorHousingDimensionsSchema = z.object({
  boltSpacing: z.number(),
  shaftDiameter: z.number(),
  pilotDiameter: z.number(),
  pilotDepth: z.number(),
  housingLength: z.number(),
  wallThickness: z.number(),
  boltHoleDiameter: z.number(),
});

export const FluidPipeDimensionsSchema = z.object({
  boreDiameter: z.number(),
  pressurePsi: z.number(),
  pipeLength: z.number(),
  wallThickness: z.number(),
});

export const BracketDimensionsSchema = z.object({
  loadNewtons: z.number(),
  bracketWidth: z.number(),
  bracketLength: z.number(),
  bracketThickness: z.number(),
  holeDiameter: z.number(),
});

export const GearDimensionsSchema = z.object({
  toothCount: z.number().int().min(4),
  module: z.number().min(0.1),
  shaftDiameter: z.number(),
  faceWidth: z.number(),
  keywayWidth: z.number(),
  keywayDepth: z.number(),
});

export const CustomDimensionsSchema = z.object({
  width: z.number().optional(),
  height: z.number().optional(),
  depth: z.number().optional(),
  thickness: z.number().optional(),
  boreDiameter: z.number().optional(),
  shaftDiameter: z.number().optional(),
  loadNewtons: z.number().optional(),
  pressurePsi: z.number().optional(),
  toothCount: z.number().optional(),
  module: z.number().optional(),
  faceWidth: z.number().optional(),
  keywayWidth: z.number().optional(),
  keywayDepth: z.number().optional(),
});

export const ExtractedDimensionsSchema = z.object({
  jobId: z.string().uuid(),
  componentType: z.enum(["motor_housing", "fluid_pipe", "bracket", "gear", "custom"]),
  manufacturingMethod: z.enum(["FDM_Plastic", "SLA_Resin", "SLM_Metal"]),
  material: z.string(),
  materialAllowableStressMpa: z.number(),
  dimensions: z.union([
    MotorHousingDimensionsSchema,
    FluidPipeDimensionsSchema,
    BracketDimensionsSchema,
    GearDimensionsSchema,
    CustomDimensionsSchema,
  ]),
  geometryTree: CSGNodeSchema.describe("The CSG tree representing the geometry of the component. The root node can be a boolean operation (union, difference) or a direct primitive."),
});

export type ExtractedDimensions = z.infer<typeof ExtractedDimensionsSchema>;
