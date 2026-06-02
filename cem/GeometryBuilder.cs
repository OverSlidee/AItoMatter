using System;
using System.Numerics;
using System.Collections.Generic;
using PicoGK;

namespace VeloLabs.CEM
{
    public static class GeometryBuilder
    {
        public static Voxels Build(EngineeringSchema schema)
        {
            // If a custom CSG tree was provided, we use it directly
            if (schema.GeometryTree != null && !string.IsNullOrEmpty(schema.GeometryTree.Type))
            {
                Console.WriteLine($"[GEOMETRY BUILDER] Compiling custom CSG tree. Root: {schema.GeometryTree.Type}");
                return EvaluateNode(schema.GeometryTree);
            }

            // Fallback: If no CSG tree exists, fall back to default template builds
            string componentType = schema.ComponentType.ToLower();
            Voxels result = new Voxels();

            if (componentType == "fluid_pipe")
            {
                double boreDiameter = schema.Dimensions.BoreDiameter;
                double wallThickness = schema.Dimensions.WallThickness;
                double pipeLength = schema.Dimensions.PipeLength;

                float rOuter = (float)((boreDiameter + 2.0 * wallThickness) / 2.0);
                float rInner = (float)(boreDiameter / 2.0);
                float length = (float)pipeLength;

                Voxels outerCylinder = new Voxels();
                ImplicitCylinder outerSdf = new ImplicitCylinder(Vector3.Zero, rOuter, length, 0, 0, 0);
                BBox3 outerBbox = new BBox3(new Vector3(-rOuter - 1, -rOuter - 1, -length/2.0f - 1), new Vector3(rOuter + 1, rOuter + 1, length/2.0f + 1));
                outerCylinder.RenderImplicit(outerSdf, outerBbox);

                Voxels innerCylinder = new Voxels();
                ImplicitCylinder innerSdf = new ImplicitCylinder(Vector3.Zero, rInner, length + 4.0f, 0, 0, 0);
                BBox3 innerBbox = new BBox3(new Vector3(-rInner - 1, -rInner - 1, -length/2.0f - 3), new Vector3(rInner + 1, rInner + 1, length/2.0f + 3));
                innerCylinder.RenderImplicit(innerSdf, innerBbox);

                result.BoolAdd(outerCylinder);
                result.BoolSubtract(innerCylinder);
            }
            else if (componentType == "bracket")
            {
                double width = schema.Dimensions.BracketWidth;
                double length = schema.Dimensions.BracketLength;
                double thickness = schema.Dimensions.BracketThickness;
                double holeDiameter = schema.Dimensions.HoleDiameter;

                float w = (float)width;
                float l = (float)length;
                float t = (float)thickness;
                float rh = (float)(holeDiameter / 2.0);

                Voxels basePlate = new Voxels();
                ImplicitBox baseSdf = new ImplicitBox(new Vector3(0, l / 2.0f, t / 2.0f), new Vector3(w / 2.0f, l / 2.0f, t / 2.0f), 0, 0, 0);
                BBox3 baseBbox = new BBox3(new Vector3(-w/2.0f - 1, -1, -1), new Vector3(w/2.0f + 1, l + 1, t + 1));
                basePlate.RenderImplicit(baseSdf, baseBbox);

                Voxels vertPlate = new Voxels();
                ImplicitBox vertSdf = new ImplicitBox(new Vector3(0, t / 2.0f, l / 2.0f), new Vector3(w / 2.0f, t / 2.0f, l / 2.0f), 0, 0, 0);
                BBox3 vertBbox = new BBox3(new Vector3(-w/2.0f - 1, -1, -1), new Vector3(w/2.0f + 1, t + 1, l + 1));
                vertPlate.RenderImplicit(vertSdf, vertBbox);

                result.BoolAdd(basePlate);
                result.BoolAdd(vertPlate);

                Voxels baseHole = new Voxels();
                ImplicitCylinder baseHoleSdf = new ImplicitCylinder(new Vector3(0, l / 2.0f, t / 2.0f), rh, t + 4.0f, 0, 0, 0, Axis.Z);
                BBox3 baseHoleBbox = new BBox3(new Vector3(-rh - 1, l/2.0f - rh - 1, -2), new Vector3(rh + 1, l/2.0f + rh + 1, t + 2));
                baseHole.RenderImplicit(baseHoleSdf, baseHoleBbox);
                result.BoolSubtract(baseHole);

                Voxels vertHole = new Voxels();
                ImplicitCylinder vertHoleSdf = new ImplicitCylinder(new Vector3(0, t / 2.0f, l / 2.0f), rh, t + 4.0f, 0, 0, 0, Axis.Y);
                BBox3 vertHoleBbox = new BBox3(new Vector3(-rh - 1, -2, l/2.0f - rh - 1), new Vector3(rh + 1, t + 2, l/2.0f + rh + 1));
                vertHole.RenderImplicit(vertHoleSdf, vertHoleBbox);
                result.BoolSubtract(vertHole);
            }
            else if (componentType == "gear")
            {
                result = BuildGearVoxels(
                    schema.Dimensions.ToothCount,
                    schema.Dimensions.Module,
                    schema.Dimensions.ShaftDiameter,
                    schema.Dimensions.FaceWidth,
                    schema.Dimensions.KeywayWidth,
                    schema.Dimensions.KeywayDepth
                );
            }

            return result;
        }

        // Recursive CSG Evaluation Engine
        private static Voxels EvaluateNode(CSGNode node)
        {
            if (node == null || string.IsNullOrEmpty(node.Type))
            {
                return new Voxels();
            }

            string type = node.Type.ToLower().Trim();

            // Boolean operations
            if (type == "union")
            {
                Voxels left = EvaluateNode(node.Left!);
                Voxels right = EvaluateNode(node.Right!);
                left.BoolAdd(right);
                return left;
            }
            else if (type == "difference")
            {
                Voxels left = EvaluateNode(node.Left!);
                Voxels right = EvaluateNode(node.Right!);
                left.BoolSubtract(right);
                return left;
            }
            else if (type == "intersection")
            {
                Voxels left = EvaluateNode(node.Left!);
                Voxels right = EvaluateNode(node.Right!);
                left.BoolIntersect(right);
                return left;
            }

            // Primitive parameters resolver
            Vector3 pos = Vector3.Zero;
            if (node.Position != null && node.Position.Length >= 3)
            {
                pos = new Vector3((float)node.Position[0], (float)node.Position[1], (float)node.Position[2]);
            }

            float pitch = 0, yaw = 0, roll = 0;
            if (node.Rotation != null && node.Rotation.Length >= 3)
            {
                pitch = (float)node.Rotation[0];
                yaw = (float)node.Rotation[1];
                roll = (float)node.Rotation[2];
            }

            Voxels prim = new Voxels();

            if (type == "box")
            {
                float w = (float)GetDim(node.Dimensions, "width", 10.0);
                float h = (float)GetDim(node.Dimensions, "height", 10.0);
                float d = (float)GetDim(node.Dimensions, "depth", 10.0);

                ImplicitBox sdf = new ImplicitBox(pos, new Vector3(w/2.0f, h/2.0f, d/2.0f), pitch, yaw, roll);
                BBox3 bbox = GetTransformedBBox(pos, new Vector3(w/2.0f, h/2.0f, d/2.0f), pitch, yaw, roll);
                prim.RenderImplicit(sdf, bbox);
            }
            else if (type == "cylinder")
            {
                float r = (float)GetDim(node.Dimensions, "radius", 5.0);
                float h = (float)GetDim(node.Dimensions, "height", 10.0);

                ImplicitCylinder sdf = new ImplicitCylinder(pos, r, h, pitch, yaw, roll);
                BBox3 bbox = GetTransformedBBox(pos, new Vector3(r, r, h/2.0f), pitch, yaw, roll);
                prim.RenderImplicit(sdf, bbox);
            }
            else if (type == "sphere")
            {
                float r = (float)GetDim(node.Dimensions, "radius", 5.0);

                ImplicitSphere sdf = new ImplicitSphere(pos, r);
                BBox3 bbox = new BBox3(pos - new Vector3(r + 1.0f), pos + new Vector3(r + 1.0f));
                prim.RenderImplicit(sdf, bbox);
            }
            else if (type == "gear")
            {
                int teeth = (int)GetDim(node.Dimensions, "toothCount", 20.0);
                double mod = GetDim(node.Dimensions, "module", 2.0);
                double shaft = GetDim(node.Dimensions, "shaftDiameter", 10.0);
                double face = GetDim(node.Dimensions, "faceWidth", 15.0);
                double kw = GetDim(node.Dimensions, "keywayWidth", 0.0);
                double kd = GetDim(node.Dimensions, "keywayDepth", 0.0);

                ImplicitGear sdf = new ImplicitGear(pos, pitch, yaw, roll, teeth, mod, shaft, face, kw, kd);
                float outerDia = (float)(mod * teeth + 2.0 * mod);
                float rOuter = outerDia / 2.0f;
                BBox3 bbox = GetTransformedBBox(pos, new Vector3(rOuter, rOuter, (float)face / 2.0f), pitch, yaw, roll);
                prim.RenderImplicit(sdf, bbox);
                return prim;
            }

            return prim;
        }

        private static double GetDim(Dictionary<string, double>? dims, string key, double defaultValue)
        {
            if (dims == null) return defaultValue;
            
            foreach (var k in new string[] { key, key.ToLower(), key.ToUpper() })
            {
                if (dims.TryGetValue(k, out double val))
                {
                    return val;
                }
            }
            return defaultValue;
        }

        // Bounding box calculator for transformed primitives
        public static BBox3 GetTransformedBBox(Vector3 center, Vector3 localHalfSize, float pitchDeg, float yawDeg, float rollDeg)
        {
            Vector3[] corners = new Vector3[8]
            {
                new Vector3(-localHalfSize.X, -localHalfSize.Y, -localHalfSize.Z),
                new Vector3( localHalfSize.X, -localHalfSize.Y, -localHalfSize.Z),
                new Vector3(-localHalfSize.X,  localHalfSize.Y, -localHalfSize.Z),
                new Vector3( localHalfSize.X,  localHalfSize.Y, -localHalfSize.Z),
                new Vector3(-localHalfSize.X, -localHalfSize.Y,  localHalfSize.Z),
                new Vector3( localHalfSize.X, -localHalfSize.Y,  localHalfSize.Z),
                new Vector3(-localHalfSize.X,  localHalfSize.Y,  localHalfSize.Z),
                new Vector3( localHalfSize.X,  localHalfSize.Y,  localHalfSize.Z)
            };

            float pr = pitchDeg * MathF.PI / 180.0f;
            float yr = yawDeg * MathF.PI / 180.0f;
            float rr = rollDeg * MathF.PI / 180.0f;

            Vector3 min = new Vector3(float.MaxValue);
            Vector3 max = new Vector3(float.MinValue);

            for (int i = 0; i < 8; i++)
            {
                Vector3 pt = corners[i];

                // Rotate X (Pitch)
                if (pr != 0)
                {
                    float cos = MathF.Cos(pr);
                    float sin = MathF.Sin(pr);
                    pt = new Vector3(pt.X, pt.Y * cos - pt.Z * sin, pt.Y * sin + pt.Z * cos);
                }

                // Rotate Y (Yaw)
                if (yr != 0)
                {
                    float cos = MathF.Cos(yr);
                    float sin = MathF.Sin(yr);
                    pt = new Vector3(pt.X * cos + pt.Z * sin, pt.Y, -pt.X * sin + pt.Z * cos);
                }

                // Rotate Z (Roll)
                if (rr != 0)
                {
                    float cos = MathF.Cos(rr);
                    float sin = MathF.Sin(rr);
                    pt = new Vector3(pt.X * cos - pt.Y * sin, pt.X * sin + pt.Y * cos, pt.Z);
                }

                Vector3 globalPt = pt + center;
                min = Vector3.Min(min, globalPt);
                max = Vector3.Max(max, globalPt);
            }

            return new BBox3(min - Vector3.One, max + Vector3.One);
        }

        // Parametric spur gear voxels generator
        public static Voxels BuildGearVoxels(int toothCount, double module, double shaftDiameter, double faceWidth, double keywayWidth, double keywayDepth)
        {
            float mod = (float)module;
            float pitchDia = mod * toothCount;
            float outerDia = pitchDia + 2.0f * mod;
            float rootDia = pitchDia - 2.5f * mod;
            float face = (float)faceWidth;
            float rRoot = rootDia / 2.0f;

            Console.WriteLine($"[GEOMETRY BUILDER] Building Gear: Teeth={toothCount}, Module={module}mm, Shaft={shaftDiameter}mm, Face={faceWidth}mm");

            Voxels gear = new Voxels();

            // 1. Root Cylinder
            ImplicitCylinder rootSdf = new ImplicitCylinder(Vector3.Zero, rRoot, face, 0, 0, 0);
            BBox3 rootBbox = new BBox3(new Vector3(-rRoot - 1, -rRoot - 1, -face/2.0f - 1), new Vector3(rRoot + 1, rRoot + 1, face/2.0f + 1));
            gear.RenderImplicit(rootSdf, rootBbox);

            // 2. Render Teeth radially
            float toothThick = (MathF.PI * mod) / 2.0f; // Approx width of tooth
            float toothHeight = 2.25f * mod;
            float rCenterPos = rRoot + toothHeight / 4.0f;

            for (int i = 0; i < toothCount; i++)
            {
                float angle = (i * 2.0f * MathF.PI) / toothCount;
                float angleDeg = angle * 180.0f / MathF.PI;

                // Tooth box primitive centered radially
                // Position is offset along Y direction by rCenterPos, and then rotated around Z (Roll) by angleDeg
                float cos = MathF.Cos(angle);
                float sin = MathF.Sin(angle);
                Vector3 toothPos = new Vector3(-rCenterPos * sin, rCenterPos * cos, 0);

                Voxels tooth = new Voxels();
                ImplicitBox toothSdf = new ImplicitBox(toothPos, new Vector3(toothThick / 2.0f, toothHeight / 2.0f, face / 2.0f), 0, 0, angleDeg);
                
                // Allow generous bounding box to capture rotated teeth
                float maxBound = MathF.Max(toothThick, MathF.Max(toothHeight, face)) * 1.5f;
                BBox3 toothBbox = new BBox3(toothPos - new Vector3(maxBound), toothPos + new Vector3(maxBound));
                tooth.RenderImplicit(toothSdf, toothBbox);

                gear.BoolAdd(tooth);
            }

            // 3. Drill central bore hole
            float rBore = (float)(shaftDiameter / 2.0);
            Voxels bore = new Voxels();
            ImplicitCylinder boreSdf = new ImplicitCylinder(Vector3.Zero, rBore, face + 4.0f, 0, 0, 0);
            BBox3 boreBbox = new BBox3(new Vector3(-rBore - 1, -rBore - 1, -face/2.0f - 3), new Vector3(rBore + 1, rBore + 1, face/2.0f + 3));
            bore.RenderImplicit(boreSdf, boreBbox);
            gear.BoolSubtract(bore);

            // 4. Drill keyway slot if dimensions provided
            if (keywayWidth > 0 && keywayDepth > 0)
            {
                float kw = (float)keywayWidth;
                float kd = (float)keywayDepth;
                
                // Keyway box shifted upwards in Y direction
                Vector3 keywayPos = new Vector3(0, rBore + kd / 2.0f, 0);
                Voxels keyway = new Voxels();
                ImplicitBox keywaySdf = new ImplicitBox(keywayPos, new Vector3(kw / 2.0f, kd / 2.0f, face / 2.0f + 2.0f), 0, 0, 0);
                BBox3 keywayBbox = new BBox3(new Vector3(-kw/2.0f - 1, rBore - 1, -face/2.0f - 3), new Vector3(kw/2.0f + 1, rBore + kd + 1, face/2.0f + 3));
                keyway.RenderImplicit(keywaySdf, keywayBbox);
                
                gear.BoolSubtract(keyway);
            }

            return gear;
        }

        // Coordinate space translator and rotator (inverse transformations for SDF)
        public static Vector3 TransformVector(Vector3 vec, Vector3 translation, float pitchDeg, float yawDeg, float rollDeg)
        {
            Vector3 local = vec - translation;

            // Pitch (X), Yaw (Y), Roll (Z) angles inverted
            float pr = -pitchDeg * MathF.PI / 180.0f;
            float yr = -yawDeg * MathF.PI / 180.0f;
            float rr = -rollDeg * MathF.PI / 180.0f;

            // Z rotation (Roll)
            if (rr != 0)
            {
                float cos = MathF.Cos(rr);
                float sin = MathF.Sin(rr);
                float x = local.X * cos - local.Y * sin;
                float y = local.X * sin + local.Y * cos;
                local = new Vector3(x, y, local.Z);
            }

            // Y rotation (Yaw)
            if (yr != 0)
            {
                float cos = MathF.Cos(yr);
                float sin = MathF.Sin(yr);
                float x = local.X * cos + local.Z * sin;
                float z = -local.X * sin + local.Z * cos;
                local = new Vector3(x, local.Y, z);
            }

            // X rotation (Pitch)
            if (pr != 0)
            {
                float cos = MathF.Cos(pr);
                float sin = MathF.Sin(pr);
                float y = local.Y * cos - local.Z * sin;
                float z = local.Y * sin + local.Z * cos;
                local = new Vector3(local.X, y, z);
            }

            return local;
        }
    }

    public enum Axis { X, Y, Z }

    public class ImplicitCylinder : IImplicit
    {
        private readonly Vector3 _center;
        private readonly float _radius;
        private readonly float _height;
        private readonly float _pitch;
        private readonly float _yaw;
        private readonly float _roll;
        private readonly Axis _axis;

        public ImplicitCylinder(Vector3 center, float radius, float height, float pitch, float yaw, float roll, Axis axis = Axis.Z)
        {
            _center = center;
            _radius = radius;
            _height = height;
            _pitch = pitch;
            _yaw = yaw;
            _roll = roll;
            _axis = axis;
        }

        public float fSignedDistance(in Vector3 vec)
        {
            // Transform coordinates
            Vector3 local = GeometryBuilder.TransformVector(vec, _center, _pitch, _yaw, _roll);

            float radialDist = 0.0f;
            float axialDist = 0.0f;

            switch (_axis)
            {
                case Axis.X:
                    radialDist = MathF.Sqrt(local.Y * local.Y + local.Z * local.Z) - _radius;
                    axialDist = MathF.Abs(local.X) - _height / 2.0f;
                    break;
                case Axis.Y:
                    radialDist = MathF.Sqrt(local.X * local.X + local.Z * local.Z) - _radius;
                    axialDist = MathF.Abs(local.Y) - _height / 2.0f;
                    break;
                case Axis.Z:
                default:
                    radialDist = MathF.Sqrt(local.X * local.X + local.Y * local.Y) - _radius;
                    axialDist = MathF.Abs(local.Z) - _height / 2.0f;
                    break;
            }

            float outside = MathF.Sqrt(MathF.Max(radialDist, 0.0f) * MathF.Max(radialDist, 0.0f) + MathF.Max(axialDist, 0.0f) * MathF.Max(axialDist, 0.0f));
            float inside = MathF.Min(MathF.Max(radialDist, axialDist), 0.0f);
            return outside + inside;
        }
    }

    public class ImplicitBox : IImplicit
    {
        private readonly Vector3 _center;
        private readonly Vector3 _halfSize;
        private readonly float _pitch;
        private readonly float _yaw;
        private readonly float _roll;

        public ImplicitBox(Vector3 center, Vector3 halfSize, float pitch, float yaw, float roll)
        {
            _center = center;
            _halfSize = halfSize;
            _pitch = pitch;
            _yaw = yaw;
            _roll = roll;
        }

        public float fSignedDistance(in Vector3 vec)
        {
            // Transform coordinates
            Vector3 local = GeometryBuilder.TransformVector(vec, _center, _pitch, _yaw, _roll);

            Vector3 d = Vector3.Abs(local) - _halfSize;
            float outside = Vector3.Max(d, Vector3.Zero).Length();
            float inside = MathF.Min(MathF.Max(d.X, MathF.Max(d.Y, d.Z)), 0.0f);
            return outside + inside;
        }
    }

    public class ImplicitSphere : IImplicit
    {
        private readonly Vector3 _center;
        private readonly float _radius;

        public ImplicitSphere(Vector3 center, float radius)
        {
            _center = center;
            _radius = radius;
        }

        public float fSignedDistance(in Vector3 vec)
        {
            return (vec - _center).Length() - _radius;
        }
    }

    public class ImplicitGear : IImplicit
    {
        private readonly Vector3 _center;
        private readonly float _pitch;
        private readonly float _yaw;
        private readonly float _roll;
        
        private readonly int _teeth;
        private readonly float _mod;
        private readonly float _rRoot;
        private readonly float _face;
        private readonly float _toothThick;
        private readonly float _toothHeight;
        private readonly float _rCenterPos;
        private readonly float _rBore;
        private readonly float _kw;
        private readonly float _kd;

        public ImplicitGear(Vector3 center, float pitch, float yaw, float roll, int teeth, double module, double shaftDiameter, double faceWidth, double keywayWidth, double keywayDepth)
        {
            _center = center;
            _pitch = pitch;
            _yaw = yaw;
            _roll = roll;
            
            _teeth = teeth;
            _mod = (float)module;
            float pitchDia = _mod * teeth;
            float rootDia = pitchDia - 2.5f * _mod;
            _rRoot = rootDia / 2.0f;
            _face = (float)faceWidth;
            
            _toothThick = (MathF.PI * _mod) / 2.0f;
            _toothHeight = 2.25f * _mod;
            _rCenterPos = _rRoot + _toothHeight / 4.0f;
            _rBore = (float)(shaftDiameter / 2.0);
            _kw = (float)keywayWidth;
            _kd = (float)keywayDepth;
        }

        public float fSignedDistance(in Vector3 vec)
        {
            // Transform coordinates
            Vector3 local = GeometryBuilder.TransformVector(vec, _center, _pitch, _yaw, _roll);

            // 1. Distance to root cylinder
            float dist = CylinderSdf(local, _rRoot, _face);

            // 2. Add teeth radially
            for (int i = 0; i < _teeth; i++)
            {
                float angle = (i * 2.0f * MathF.PI) / _teeth;
                float angleDeg = angle * 180.0f / MathF.PI;

                float cos = MathF.Cos(angle);
                float sin = MathF.Sin(angle);
                Vector3 toothPos = new Vector3(-_rCenterPos * sin, _rCenterPos * cos, 0);

                float toothDist = BoxSdf(local, toothPos, new Vector3(_toothThick / 2.0f, _toothHeight / 2.0f, _face / 2.0f), 0, 0, angleDeg);
                
                // Union operation
                dist = MathF.Min(dist, toothDist);
            }

            // 3. Drill central bore hole
            float boreDist = CylinderSdf(local, _rBore, _face + 4.0f);
            dist = MathF.Max(dist, -boreDist);

            // 4. Drill keyway slot if dimensions provided
            if (_kw > 0 && _kd > 0)
            {
                Vector3 keywayPos = new Vector3(0, _rBore + _kd / 2.0f, 0);
                float keywayDist = BoxSdf(local, keywayPos, new Vector3(_kw / 2.0f, _kd / 2.0f, _face / 2.0f + 2.0f), 0, 0, 0);
                dist = MathF.Max(dist, -keywayDist);
            }

            return dist;
        }

        private float CylinderSdf(Vector3 local, float radius, float height)
        {
            float radialDist = MathF.Sqrt(local.X * local.X + local.Y * local.Y) - radius;
            float axialDist = MathF.Abs(local.Z) - height / 2.0f;
            float outside = MathF.Sqrt(MathF.Max(radialDist, 0.0f) * MathF.Max(radialDist, 0.0f) + MathF.Max(axialDist, 0.0f) * MathF.Max(axialDist, 0.0f));
            float inside = MathF.Min(MathF.Max(radialDist, axialDist), 0.0f);
            return outside + inside;
        }

        private float BoxSdf(Vector3 local, Vector3 center, Vector3 halfSize, float pitch, float yaw, float roll)
        {
            Vector3 localBox = GeometryBuilder.TransformVector(local, center, pitch, yaw, roll);
            Vector3 d = Vector3.Abs(localBox) - halfSize;
            float outside = Vector3.Max(d, Vector3.Zero).Length();
            float inside = MathF.Min(MathF.Max(d.X, MathF.Max(d.Y, d.Z)), 0.0f);
            return outside + inside;
        }
    }
}
