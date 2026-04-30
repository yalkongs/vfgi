import { NextRequest, NextResponse } from "next/server";
import { samplePanel, type SampleInput } from "@/lib/personaSampler";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SampleInput;
  const panel = await samplePanel(body);
  return NextResponse.json({ panel, count: panel.length });
}
