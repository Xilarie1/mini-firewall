function parseLogLine(line) {
  if (!line || typeof line !== "string") return null;

  const parts = line.trim().split(/\s+/);

  if (parts.length < 5) {
    return null;
  }
  const [timestamp, ip, method, path, status] = parts;

  return {
    timestamp,
    ip,
    method,
    path,
    status: Number(status) || null,
  };
}

module.exports = parseLogLine;
