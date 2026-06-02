using System;
using System.Collections.Generic;

namespace VeloLabs.CEM
{
    public static class PhysicsOverride
    {
        // 1 PSI = 0.00689476 MPa
        private const double PsiToMpa = 0.00689475729;

        public static void Apply(EngineeringSchema schema)
        {
            string componentType = schema.ComponentType.ToLower();
            double allowableStress = schema.MaterialAllowableStressMpa;

            Console.WriteLine($"[PHYSICS ENGINE] Verifying mechanics using allowable tensile stress: {allowableStress} MPa");

            if (componentType == "fluid_pipe")
            {
                double pressurePsi = schema.Dimensions.PressurePsi;
                double boreDiameter = schema.Dimensions.BoreDiameter;
                double wallThickness = schema.Dimensions.WallThickness;

                double pressureMpa = pressurePsi * PsiToMpa;

                // Hoop stress formula: safe thickness = (P * d) / (2 * allowable_stress)
                double minSafeThickness = (pressureMpa * boreDiameter) / (2.0 * allowableStress);
                double designThickness = Math.Round(minSafeThickness * 1.5, 2); // 1.5x safety factor

                if (designThickness < 1.5) designThickness = 1.5;

                if (wallThickness < designThickness)
                {
                    Console.WriteLine($"[PHYSICS OVERRIDE] Warning: User wall thickness of {wallThickness}mm is unsafe under {pressurePsi} PSI pressure.");
                    Console.WriteLine($"[PHYSICS OVERRIDE] Hoop-stress limit: {minSafeThickness:F2}mm (with 1.5x safety: {designThickness:F2}mm).");
                    
                    // Update flat schema
                    schema.Dimensions.WallThickness = designThickness;
                    
                    // Propagate to CSG Tree
                    UpdateTreeDimensions(schema.GeometryTree, "wallThickness", designThickness);
                    
                    Console.WriteLine($"[PHYSICS OVERRIDE] Wall thickness OVERRIDDEN to {designThickness:F2}mm.");
                }
                else
                {
                    Console.WriteLine($"[PHYSICS ENGINE] Wall thickness of {wallThickness}mm is mathematically SAFE (min required: {designThickness}mm).");
                }
            }
            else if (componentType == "bracket")
            {
                double loadN = schema.Dimensions.LoadNewtons;
                double width = schema.Dimensions.BracketWidth;
                double length = schema.Dimensions.BracketLength;
                double thickness = schema.Dimensions.BracketThickness;

                // Max bending stress: sigma = (6 * F * L) / (W * t^2) => t_safe = sqrt((6 * F * L) / (W * allowable_stress))
                double tBendingSafe = Math.Sqrt((6.0 * loadN * length) / (width * allowableStress));
                double tShearSafe = loadN / (0.577 * width * allowableStress);
                double rawSafeThickness = Math.Max(tBendingSafe, tShearSafe);
                double designThickness = Math.Round(rawSafeThickness * 1.3, 2); // 1.3x safety factor

                if (designThickness < 2.0) designThickness = 2.0;

                if (thickness < designThickness)
                {
                    Console.WriteLine($"[PHYSICS OVERRIDE] Warning: User bracket thickness of {thickness}mm is unsafe under {loadN} N load.");
                    Console.WriteLine($"[PHYSICS OVERRIDE] Calculated limit: {rawSafeThickness:F2}mm (with 1.3x safety: {designThickness:F2}mm).");
                    
                    // Update flat schema
                    schema.Dimensions.BracketThickness = designThickness;
                    
                    // Propagate to CSG Tree
                    UpdateTreeDimensions(schema.GeometryTree, "bracketThickness", designThickness);
                    UpdateTreeDimensions(schema.GeometryTree, "thickness", designThickness);
                    
                    Console.WriteLine($"[PHYSICS OVERRIDE] Bracket thickness OVERRIDDEN to {designThickness:F2}mm.");
                }
                else
                {
                    Console.WriteLine($"[PHYSICS ENGINE] Bracket thickness of {thickness}mm is mathematically SAFE (min required: {designThickness}mm).");
                }
            }
            else if (componentType == "gear")
            {
                // Physical check for gears: Torque Transmission Keyway Shear
                // We assume a standard 4kW motor running at 1500 RPM -> Torque = 25.46 N.m
                double torqueNm = 25.46; // standard 4kW torque baseline
                double shaftRad = schema.Dimensions.ShaftDiameter / 2.0;
                double keyW = schema.Dimensions.KeywayWidth;
                double faceWidth = schema.Dimensions.FaceWidth;

                if (shaftRad > 0 && keyW > 0)
                {
                    double shearForce = torqueNm / (shaftRad / 1000.0); // N
                    // Shear stress tau = force / (keyW * faceWidth) <= 0.577 * allowableStress
                    double minFaceWidth = shearForce / (keyW * 0.577 * allowableStress);
                    double designFaceWidth = Math.Round(minFaceWidth * 1.2, 2); // 1.2x safety factor

                    if (designFaceWidth < 10.0) designFaceWidth = 10.0;

                    if (faceWidth < designFaceWidth)
                    {
                        Console.WriteLine($"[PHYSICS OVERRIDE] Warning: User gear faceWidth of {faceWidth}mm is too thin to transmit torque.");
                        Console.WriteLine($"[PHYSICS OVERRIDE] Calculated keyway shear limit: {minFaceWidth:F2}mm (with 1.2x safety: {designFaceWidth:F2}mm).");
                        
                        // Update flat schema
                        schema.Dimensions.FaceWidth = designFaceWidth;
                        
                        // Propagate to CSG Tree
                        UpdateTreeDimensions(schema.GeometryTree, "faceWidth", designFaceWidth);
                        
                        Console.WriteLine($"[PHYSICS OVERRIDE] Gear faceWidth OVERRIDDEN to {designFaceWidth:F2}mm.");
                    }
                    else
                    {
                        Console.WriteLine($"[PHYSICS ENGINE] Gear faceWidth of {faceWidth}mm is mathematically SAFE.");
                    }
                }
            }
            else
            {
                Console.WriteLine("[PHYSICS ENGINE] No active safety overrides registered for this component type.");
            }
        }

        // Recursive tree scanner to update dimensions in the geometry tree
        private static void UpdateTreeDimensions(CSGNode node, string key, double newVal)
        {
            if (node == null) return;
            
            if (node.Dimensions != null)
            {
                // Check both case-sensitive and case-insensitive keys
                foreach (var k in new string[] { key, key.ToLower(), key.ToUpper() })
                {
                    if (node.Dimensions.ContainsKey(k))
                    {
                        node.Dimensions[k] = newVal;
                    }
                }
            }

            UpdateTreeDimensions(node.Left!, key, newVal);
            UpdateTreeDimensions(node.Right!, key, newVal);
        }
    }
}
