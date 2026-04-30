import { NextRequest, NextResponse } from "next/server";
import { buildGuide, type GuideBuilderInput } from "@/lib/guideBuilder";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GuideBuilderInput;
  try {
    const guide = await buildGuide(body);
    return NextResponse.json({ guide });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? String(e) },
      { status: 500 }
    );
  }
}
