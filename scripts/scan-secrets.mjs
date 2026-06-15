import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const allowlistedFiles = new Set([".env.example"]);
const allowlistedLinePatterns = [
  /your-[a-z0-9-]+/i,
  /placeholder/i,
  /example/i,
  /VITE_CHAT_DEBUG_SHA256=/,
];

const secretPatterns = [
  {
    name: "Google API key",
    pattern: /AIza[0-9A-Za-z_-]{20,}/,
  },
  {
    name: "Google reCAPTCHA key",
    pattern: /(^|[^0-9A-Za-z_-])6L[0-9A-Za-z_-]{30,}/,
  },
  {
    name: "Environment secret assignment",
    pattern:
      /^\s*(?:export\s+)?[A-Z0-9_]*(?:PASS|PASSWORD|SECRET|TOKEN|API_?KEY|ACCESS_?KEY|PRIVATE_?KEY|CLIENT_?SECRET)[A-Z0-9_]*\s*=\s*["']?[^"'\s#]{8,}/,
  },
  {
    name: "Airbnb iCal URL",
    pattern: /https:\/\/www\.airbnb\.[^\s"']+\/calendar\/ical\/[^\s"']+/i,
  },
];

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function getCandidateFiles() {
  const staged = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
  if (staged) return staged.split("\n").filter(Boolean);

  const tracked = git(["ls-files"]);
  return tracked ? tracked.split("\n").filter(Boolean) : [];
}

const findings = [];

for (const file of getCandidateFiles()) {
  if (allowlistedFiles.has(file) || !existsSync(file)) continue;

  const content = readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (allowlistedLinePatterns.some((pattern) => pattern.test(line))) return;

    for (const { name, pattern } of secretPatterns) {
      if (pattern.test(line)) {
        findings.push({ file, line: index + 1, name });
      }
    }
  });
}

if (findings.length > 0) {
  console.error("\nSecret scan failed. Remove these values before committing:\n");
  for (const finding of findings) {
    console.error(`- ${finding.name}: ${finding.file}:${finding.line}`);
  }
  console.error("\nUse .env for real secrets and .env.example for placeholders only.\n");
  process.exit(1);
}

console.log("Secret scan passed.");
