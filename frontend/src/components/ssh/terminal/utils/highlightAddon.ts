const ANSI_RE = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

export function stripAnsi(text: string) {
  return text.replace(ANSI_RE, "");
}

export function highlightOutput(text: string) {
  return stripAnsi(text);
}
