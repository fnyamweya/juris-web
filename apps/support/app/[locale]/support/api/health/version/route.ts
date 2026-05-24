import { createVersionResponse } from "@repo/platform/health";
import { appManifest } from "@/manifest";

export const runtime = "edge";

export function GET() {
  return createVersionResponse(appManifest);
}
