import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getVesselsByUser } from "@/lib/db/queries/vessels";
import { getVeinsByUser } from "@/lib/db/queries/veins";

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  const [vessels, veins] = await Promise.all([
    getVesselsByUser(userId),
    getVeinsByUser(userId),
  ]);

  const usedVeinIds = new Set(vessels.flatMap((v) => v.veinIds as string[]));
  const activeVeins = veins.filter((v) => !usedVeinIds.has(v.id));

  return NextResponse.json({ vessels, activeVeins, totalVeins: veins.length });
}
