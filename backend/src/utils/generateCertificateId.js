import crypto from "node:crypto";

export default function generateCertificateId() {
  const year = new Date().getFullYear();

  const randomCode = crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `SKILLCERT-${year}-${randomCode}`;
}