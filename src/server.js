import express from "express";
import {config} from "./config.js";
import { testConnection } from "./db.js";
import { verifySignature } from "./verifySignature.js";
import { getInstallationClient, getPRDiff, postReview } from "./github.js";
import { reviewDiff } from "./llm.js";
import { getCommentableLines } from "./diff.js";
import { createReview, completeReview, failReview } from "./store.js";

const app = express();

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get("/health", (req,res) => {
    res.json({status: "ok"});
});

app.post("/webhook", verifySignature, (req, res) => {
  res.sendStatus(200);

  const event = req.headers["x-github-event"];
  const { action, pull_request, repository, installation } = req.body;
    console.log(`Event: ${event} / ${action}`);

  if (event !== "pull_request" || !["opened", "synchronize"].includes(action)) {
    return;
  }

  handlePullRequest({
    owner: repository.owner.login,
    repo: repository.name,
    pullNumber: pull_request.number,
    headSha: pull_request.head.sha,
    installationId: installation.id,
  }).catch((err) => console.error("Review failed:", err.message));
});

async function handlePullRequest({ owner, repo, pullNumber, headSha, installationId }) {
  console.log(`Reviewing ${owner}/${repo}#${pullNumber}`);

  const reviewId = await createReview({
    repoFullName: `${owner}/${repo}`,
    prNumber: pullNumber,
    headSha,
  });

  try {
    const octokit = await getInstallationClient(installationId);
    const diff = await getPRDiff(octokit, owner, repo, pullNumber);

    const review = await reviewDiff(diff);

    const commentable = getCommentableLines(diff);
    const findings = review.findings.filter((f) => commentable.get(f.file)?.has(f.line));

    const dropped = review.findings.length - findings.length;
    if (dropped > 0) {
      console.warn(`Dropped ${dropped} finding(s): line not in diff`);
    }

    await postReview(octokit, {
      owner,
      repo,
      pullNumber,
      headSha,
      summary: review.summary,
      findings,
    });

    await completeReview(reviewId, review.summary, findings);
    console.log(`Posted review #${reviewId} with ${findings.length} comment(s)`);
  } catch (err) {
    await failReview(reviewId);
    throw err;
  }
}

async function start() {
  try {
    await testConnection();
    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error("Failed to connect to database:", err.message);
    process.exit(1);
  }
}

start();


