import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";

export default defineConfig({
  name: "default",
  title: "Tide Raider",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "11x17yxj",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  basePath: "/studio",
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [], // Schema types will be loaded from Sanity's API
  },
});
