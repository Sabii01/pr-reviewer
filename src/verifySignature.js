import crypto from "node:crypto";
import { config } from "./config.js";

export function verifySignature(req, res, next) {
  const signature = req.headers["x-hub-signature-256"];

  if (!signature) {
    return res.status(401).send("Missing signature");
  }

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", config.githubWebhookSecret)
      .update(req.rawBody)
      .digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).send("Invalid signature");
  }

  next();
}