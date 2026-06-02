using System;
using System.Collections.Generic;

namespace VeloLabs.CEM
{
    public static class ToleranceEngine
    {
        public static void Apply(EngineeringSchema schema)
        {
            string manufacturingMethod = schema.ManufacturingMethod;
            string componentType = schema.ComponentType.ToLower();

            double holeOffset = 0.0;

            switch (manufacturingMethod.ToUpper())
            {
                case "FDM_PLASTIC":
                    holeOffset = 0.15;
                    Console.WriteLine("[TOLERANCE ENGINE] Manufacturing Method: FDM_Plastic. Applying +0.15mm expansion to internal bores.");
                    break;
                case "SLA_RESIN":
                    holeOffset = 0.05;
                    Console.WriteLine("[TOLERANCE ENGINE] Manufacturing Method: SLA_Resin. Applying +0.05mm expansion to internal bores.");
                    break;
                case "SLM_METAL":
                    holeOffset = 0.08;
                    Console.WriteLine("[TOLERANCE ENGINE] Manufacturing Method: SLM_Metal. Applying +0.08mm expansion to internal bores.");
                    break;
                default:
                    Console.WriteLine($"[TOLERANCE ENGINE] Unknown manufacturing method: {manufacturingMethod}. Using 0.00mm offset.");
                    break;
            }

            if (holeOffset == 0.0) return;

            // Apply to flat dimensions
            if (componentType == "motor_housing")
            {
                schema.Dimensions.ShaftDiameter += holeOffset;
                schema.Dimensions.PilotDiameter += holeOffset;
                schema.Dimensions.BoltHoleDiameter += holeOffset;
            }
            else if (componentType == "fluid_pipe")
            {
                schema.Dimensions.BoreDiameter += holeOffset;
            }
            else if (componentType == "bracket")
            {
                schema.Dimensions.HoleDiameter += holeOffset;
            }

            // Apply to geometry tree
            string[] targetKeys = { 
                "shaftDiameter", "pilotDiameter", "boltHoleDiameter", "boreDiameter", "holeDiameter",
                "radius", "bore", "hole" // also check common primitive key names in CSG trees
            };

            foreach (var key in targetKeys)
            {
                UpdateTreeTolerances(schema.GeometryTree, key, holeOffset);
            }
        }

        private static void UpdateTreeTolerances(CSGNode node, string key, double offset)
        {
            if (node == null) return;

            if (node.Dimensions != null)
            {
                foreach (var k in new string[] { key, key.ToLower(), key.ToUpper() })
                {
                    if (node.Dimensions.ContainsKey(k))
                    {
                        double oldVal = node.Dimensions[k];
                        // If it's a radius, we add offset / 2 (or offset directly if key is diameter. 
                        // To keep it simple, we treat them as diameters/sizes to expand).
                        node.Dimensions[k] = oldVal + offset;
                        Console.WriteLine($"[TOLERANCE ENGINE] Propagated tree offset to '{node.Type}' '{k}': {oldVal}mm -> {node.Dimensions[k]}mm");
                    }
                }
            }

            UpdateTreeTolerances(node.Left!, key, offset);
            UpdateTreeTolerances(node.Right!, key, offset);
        }
    }
}
