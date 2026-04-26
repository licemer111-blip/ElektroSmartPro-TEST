import { NextResponse } from "next/server";
import { getKnrMultiplier } from "@/lib/global-benchmarks";

export async function GET() {
  try {
    const multiplier = await getKnrMultiplier();
    return NextResponse.json({ multiplier });
  } catch (error) {
    console.error("Failed to fetch KNR multiplier:", error);
    return NextResponse.json({ multiplier: 1.5 }, { status: 500 });
  }
}
