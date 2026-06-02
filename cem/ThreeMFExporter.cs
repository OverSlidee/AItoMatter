using System;
using System.IO;
using System.IO.Compression;
using System.Numerics;
using System.Text;
using System.Xml;
using PicoGK;

namespace VeloLabs.CEM
{
    public static class ThreeMFExporter
    {
        public static void ExportTo3mf(Mesh mesh, string filePath)
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            // Create directories if they don't exist
            string? dir = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            using (FileStream fs = new FileStream(filePath, FileMode.Create))
            {
                using (ZipArchive archive = new ZipArchive(fs, ZipArchiveMode.Create))
                {
                    // 1. Write [Content_Types].xml
                    ZipArchiveEntry contentTypesEntry = archive.CreateEntry("[Content_Types].xml");
                    using (Stream entryStream = contentTypesEntry.Open())
                    using (StreamWriter sw = new StreamWriter(entryStream, Encoding.UTF8))
                    {
                        sw.Write(
                            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n" +
                            "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">\r\n" +
                            "  <Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>\r\n" +
                            "  <Default Extension=\"model\" ContentType=\"application/vnd.ms-package.3dmanufacturing-3dmodel+xml\"/>\r\n" +
                            "</Types>"
                        );
                    }

                    // 2. Write _rels/.rels
                    ZipArchiveEntry relsEntry = archive.CreateEntry("_rels/.rels");
                    using (Stream entryStream = relsEntry.Open())
                    using (StreamWriter sw = new StreamWriter(entryStream, Encoding.UTF8))
                    {
                        sw.Write(
                            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n" +
                            "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">\r\n" +
                            "  <Relationship Target=\"/3D/3dmodel.model\" Id=\"rel0\" Type=\"http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel\"/>\r\n" +
                            "</Relationships>"
                        );
                    }

                    // 3. Write 3D/3dmodel.model
                    ZipArchiveEntry modelEntry = archive.CreateEntry("3D/3dmodel.model");
                    using (Stream entryStream = modelEntry.Open())
                    {
                        XmlWriterSettings settings = new XmlWriterSettings
                        {
                            Indent = false,
                            Encoding = Encoding.UTF8,
                            OmitXmlDeclaration = false
                        };

                        using (XmlWriter writer = XmlWriter.Create(entryStream, settings))
                        {
                            writer.WriteStartDocument();
                            writer.WriteStartElement("model", "http://schemas.microsoft.com/3dmanufacturing/core/2015/02");
                            writer.WriteAttributeString("unit", "millimeter");
                            writer.WriteAttributeString("xml", "lang", null, "en-US");

                            // Metadata
                            writer.WriteStartElement("metadata");
                            writer.WriteAttributeString("name", "Title");
                            writer.WriteString("VeloLabs Autonomous Computational Engineering Output");
                            writer.WriteEndElement(); // metadata

                            writer.WriteStartElement("resources");
                            writer.WriteStartElement("object");
                            writer.WriteAttributeString("id", "1");
                            writer.WriteAttributeString("type", "model");

                            writer.WriteStartElement("mesh");

                            // Vertices
                            writer.WriteStartElement("vertices");
                            int vertexCount = mesh.nVertexCount();
                            for (int i = 0; i < vertexCount; i++)
                            {
                                Vector3 v = mesh.vecVertexAt(i);
                                writer.WriteStartElement("vertex");
                                writer.WriteAttributeString("x", v.X.ToString("F4"));
                                writer.WriteAttributeString("y", v.Y.ToString("F4"));
                                writer.WriteAttributeString("z", v.Z.ToString("F4"));
                                writer.WriteEndElement(); // vertex
                            }
                            writer.WriteEndElement(); // vertices

                            // Triangles
                            writer.WriteStartElement("triangles");
                            int triangleCount = mesh.nTriangleCount();
                            for (int i = 0; i < triangleCount; i++)
                            {
                                Triangle t = mesh.oTriangleAt(i);
                                writer.WriteStartElement("triangle");
                                writer.WriteAttributeString("v1", t.A.ToString());
                                writer.WriteAttributeString("v2", t.B.ToString());
                                writer.WriteAttributeString("v3", t.C.ToString());
                                writer.WriteEndElement(); // triangle
                            }
                            writer.WriteEndElement(); // triangles

                            writer.WriteEndElement(); // mesh
                            writer.WriteEndElement(); // object
                            writer.WriteEndElement(); // resources

                            writer.WriteStartElement("build");
                            writer.WriteStartElement("item");
                            writer.WriteAttributeString("objectid", "1");
                            writer.WriteEndElement(); // item
                            writer.WriteEndElement(); // build

                            writer.WriteEndElement(); // model
                            writer.WriteEndDocument();
                        }
                    }
                }
            }
        }
    }
}
