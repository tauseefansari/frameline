/** Decode a base64 string into an MP3 (or other) Blob. Browser-only. */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary =
    typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}
