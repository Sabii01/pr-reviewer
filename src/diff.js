import parseDiff from "parse-diff";

export function getCommentableLines(diff) {
  const map = new Map();

  for (const file of parseDiff(diff)) {
    if (!file.to || file.to === "/dev/null") continue;

    const lines = new Set();
    for (const chunk of file.chunks) {
      for (const change of chunk.changes) {
        if (change.type === "add") lines.add(change.ln);
        if (change.type === "normal") lines.add(change.ln2);
      }
    }
    map.set(file.to, lines);
  }

  return map;
}