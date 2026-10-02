import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Identificador único de compilación / despliegue
// En Vercel se provee VERCEL_GIT_COMMIT_SHA o VERCEL_DEPLOYMENT_ID
const BUILD_IDENTIFIER =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.NEXT_PUBLIC_APP_VERSION ||
  process.env.BUILD_ID ||
  "cinv-v1.1.0";

export async function GET() {
  return NextResponse.json(
    {
      version: BUILD_IDENTIFIER,
      timestamp: Date.now(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
