"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

const studioConfig = {
  ...config,
  basePath: "/studio",
};

export default function StudioPage() {
  // @ts-ignore
  return <NextStudio config={studioConfig} />;
}
