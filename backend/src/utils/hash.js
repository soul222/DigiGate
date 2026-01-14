import crypto from "crypto";

export function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function normalizePlate(text) {
  return String(text || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}
