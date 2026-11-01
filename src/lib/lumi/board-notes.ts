/** Present the tutor's existing concise notes without discarding worked examples or practice. */
export function boardNotes(text: string) {
  return text.split(/\n+/).map(line => line.trim()).filter(Boolean).map(line =>
    line.replace(/^#{1,6}\s*/, "").replace(/^[-*•]\s+/, "")
  );
}