import fs from "node:fs";

const owner = "openclaw";
const repo = "openclaw";
const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("Missing GITHUB_TOKEN");
  process.exit(2);
}

async function gh(path) {
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "user-agent": "clawdbot-railway-template-bot",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function readCurrentTag(dockerfile) {
  const m = dockerfile.match(/\nARG OPENCLAW_GIT_REF=([^\n]+)\n/);
  return m ? m[1].trim() : null;
}

function replaceTag(dockerfile, next) {
  const re = /\nARG OPENCLAW_GIT_REF=([^\n]+)\n/;
  if (!re.test(dockerfile)) throw new Error("Could not find OPENCLAW_GIT_REF line");
  return dockerfile.replace(re, `\nARG OPENCLAW_GIT_REF=${next}\n`);
}

/** Parse a version tag like "v2026.2.9" into { major, minor, patch }. */
function parseVersion(tag) {
  const m = tag.match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

const latest = await gh(`/repos/${owner}/${repo}/releases/latest`);
const latestTag = latest.tag_name;
if (!latestTag) throw new Error("No tag_name in latest release response");

const dockerPath = "Dockerfile";
const docker = fs.readFileSync(dockerPath, "utf8");
const currentTag = readCurrentTag(docker);
if (!currentTag) throw new Error("Could not parse current OPENCLAW_GIT_REF");

console.log(`current=${currentTag} latest=${latestTag}`);

// "latest" is the dynamic default — always replace with the actual tag
// so the git history records which version was deployed.
if (currentTag === latestTag) {
  console.log("No update needed.");
  process.exit(0);
}

// If current is "latest" (dynamic default), pin it to the actual release tag.
if (currentTag === "latest") {
  console.log(`Pinning dynamic "latest" default → ${latestTag}`);
  fs.writeFileSync(dockerPath, replaceTag(docker, latestTag));
  console.log(`Updated ${dockerPath}: latest → ${latestTag}`);
  process.exit(0);
}

// Warn on major version jumps (but still proceed — CI will validate the build).
const currentVer = parseVersion(currentTag);
const latestVer = parseVersion(latestTag);
if (currentVer && latestVer && latestVer.major !== currentVer.major) {
  console.warn(
    `⚠️  Major version jump detected: ${currentTag} → ${latestTag}. ` +
    `The Docker build CI will validate compatibility.`
  );
}

fs.writeFileSync(dockerPath, replaceTag(docker, latestTag));
console.log(`Updated ${dockerPath}: ${currentTag} → ${latestTag}`);
