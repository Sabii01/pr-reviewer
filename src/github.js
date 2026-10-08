import { readFileSync } from "node:fs";
import { App } from "@octokit/app";
import { config } from "./config.js";

const app = new App({
  appId: config.githubAppId,
  privateKey: readFileSync(config.githubPrivateKeyPath, "utf8"),
});

export async function getInstallationClient(installationId) {
  return app.getInstallationOctokit(installationId);
}

export async function getPRDiff(octokit, owner, repo, pullNumber) {
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner,
      repo,
      pull_number: pullNumber,
      headers: { accept: "application/vnd.github.v3.diff" },
    }
  );
  return response.data;
}

const ICONS = { high: "🔴", medium: "🟠", low: "🟡" };

function formatFinding(f) {
  let body = `${ICONS[f.severity]} **${f.severity.toUpperCase()}** · ${f.category}\n\n${f.message}`;
  if (f.suggestion) {
    body += `\n\n**Suggested fix:**\n${f.suggestion}`;
  }
  return body;
}

export async function postReview(octokit, { owner, repo, pullNumber, headSha, summary, findings }) {
  await octokit.request("POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews", {
    owner,
    repo,
    pull_number: pullNumber,
    commit_id: headSha,
    event: "COMMENT",
    body: summary,
    comments: findings.map((f) => ({
      path: f.file,
      line: f.line,
      side: "RIGHT",
      body: formatFinding(f),
    })),
  });
}