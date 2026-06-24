import { describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const repoRoot = join(import.meta.dir, "../..");

async function readStream(stream: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!stream) return "";
  return await new Response(stream).text();
}

describe("database data directory", () => {
  it("copies missing legacy ~/.crawl files even when ~/.hasna/crawl already exists", async () => {
    const home = mkdtempSync(join(tmpdir(), "crawl-home-"));
    const env = { ...process.env, HOME: home, USERPROFILE: home };
    delete env["CRAWL_DB_PATH"];
    delete env["HASNA_CRAWL_DB_PATH"];

    const script = `
      import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
      import { join } from "path";

      const home = process.env.HOME;
      const legacy = join(home, ".crawl");
      const canonical = join(home, ".hasna", "crawl");

      mkdirSync(join(legacy, "screenshots"), { recursive: true });
      mkdirSync(canonical, { recursive: true });
      writeFileSync(join(legacy, "config.json"), "legacy-config");
      writeFileSync(join(legacy, "legacy-only.txt"), "legacy-data");
      writeFileSync(join(legacy, "screenshots", "legacy.png"), "legacy-shot");
      writeFileSync(join(canonical, "config.json"), "canonical-config");

      const { getDataDir, closeDb } = await import("./src/db/database.ts");
      const dataDir = getDataDir();

      if (dataDir !== canonical) {
        throw new Error("unexpected data dir: " + dataDir);
      }
      if (readFileSync(join(canonical, "config.json"), "utf-8") !== "canonical-config") {
        throw new Error("canonical config was overwritten");
      }
      if (readFileSync(join(canonical, "legacy-only.txt"), "utf-8") !== "legacy-data") {
        throw new Error("legacy-only file was not copied");
      }
      if (readFileSync(join(canonical, "screenshots", "legacy.png"), "utf-8") !== "legacy-shot") {
        throw new Error("nested legacy file was not copied");
      }
      if (!existsSync(join(legacy, "legacy-only.txt"))) {
        throw new Error("legacy source data was removed");
      }
      closeDb();
    `;

    try {
      const proc = Bun.spawn([process.execPath, "-e", script], {
        cwd: repoRoot,
        env,
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, stderr, exitCode] = await Promise.all([
        readStream(proc.stdout),
        readStream(proc.stderr),
        proc.exited,
      ]);

      expect(`${stdout}${stderr}`).toBe("");
      expect(exitCode).toBe(0);
    } finally {
      if (existsSync(home)) {
        rmSync(home, { recursive: true, force: true });
      }
    }
  });

  it("does not pre-create the runtime data directory during postinstall", async () => {
    const pkg = await Bun.file(join(repoRoot, "package.json")).json() as {
      scripts?: Record<string, string>;
    };

    expect(pkg.scripts?.postinstall ?? "").not.toContain(".hasna/crawl");
    expect(pkg.scripts?.postinstall ?? "").not.toContain(".crawl");
  });

  it("ignores a non-directory legacy ~/.crawl path", async () => {
    const home = mkdtempSync(join(tmpdir(), "crawl-home-file-"));
    const env = { ...process.env, HOME: home, USERPROFILE: home };
    delete env["CRAWL_DB_PATH"];
    delete env["HASNA_CRAWL_DB_PATH"];
    writeFileSync(join(home, ".crawl"), "not-a-directory");

    const script = `
      import { existsSync } from "fs";
      import { join } from "path";

      const home = process.env.HOME;
      const canonical = join(home, ".hasna", "crawl");
      const { getDataDir, closeDb } = await import("./src/db/database.ts");
      const dataDir = getDataDir();

      if (dataDir !== canonical) {
        throw new Error("unexpected data dir: " + dataDir);
      }
      if (!existsSync(canonical)) {
        throw new Error("canonical dir was not created");
      }
      closeDb();
    `;

    try {
      const proc = Bun.spawn([process.execPath, "-e", script], {
        cwd: repoRoot,
        env,
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, stderr, exitCode] = await Promise.all([
        readStream(proc.stdout),
        readStream(proc.stderr),
        proc.exited,
      ]);

      expect(`${stdout}${stderr}`).toBe("");
      expect(exitCode).toBe(0);
    } finally {
      if (existsSync(home)) {
        rmSync(home, { recursive: true, force: true });
      }
    }
  });
});
