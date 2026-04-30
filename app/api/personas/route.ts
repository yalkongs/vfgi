import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { persona } from "@/db/schema";
import { and, gte, lte, inArray, sql, desc, type SQL } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const provinces = sp.getAll("province");
  const sexes = sp.getAll("sex");
  const ageMin = sp.get("ageMin");
  const ageMax = sp.get("ageMax");
  const q = sp.get("q");
  const limit = Math.min(Number(sp.get("limit") ?? "100"), 500);

  const where: SQL[] = [];
  if (provinces.length > 0) where.push(inArray(persona.province, provinces));
  if (sexes.length > 0) where.push(inArray(persona.sex, sexes));
  if (ageMin) where.push(gte(persona.age, Number(ageMin)));
  if (ageMax) where.push(lte(persona.age, Number(ageMax)));
  if (q) {
    where.push(sql`(${persona.occupation} ILIKE ${"%" + q + "%"} OR ${persona.name} ILIKE ${"%" + q + "%"})`);
  }

  const rows = await db
    .select()
    .from(persona)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(persona.createdAt))
    .limit(limit);

  return NextResponse.json({ personas: rows, count: rows.length });
}
