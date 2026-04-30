import { config } from "dotenv";
import { resolve } from "node:path";
import { readFile, readdir } from "node:fs/promises";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../db/client";
import { templateStimulus, templateGuide } from "../db/schema";

async function main() {
  const dir = resolve(process.cwd(), "prompts", "templates", "stimulus");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));

  for (const f of files) {
    const kind = f.replace(/\.md$/, "");
    const body = await readFile(resolve(dir, f), "utf8");
    const title = body.split("\n")[0].replace(/^#\s*/, "").trim();
    await db
      .insert(templateStimulus)
      .values({
        kind: kind as never,
        title,
        body,
        owner: "system",
      })
      .onConflictDoNothing();

    await db
      .insert(templateGuide)
      .values({
        kind: kind as never,
        owner: "system",
        sections: [
          { key: "warmup", title: "워밍업", prompts: ["자기소개와 일상 습관"] },
        ],
      })
      .onConflictDoNothing();

    console.log(`✓ template seeded: ${kind}`);
  }

  console.log("✓ all templates seeded");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
