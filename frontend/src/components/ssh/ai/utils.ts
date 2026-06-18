import "highlight.js/styles/github-dark.css";

import { Marked } from "marked";
import hljs from "highlight.js";
import type { AIConfig } from "@/types";

const markdown = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : "";
      const highlighted = language
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value;

      return `<pre><code class="hljs ${language ? `language-${escapeHtml(language)}` : ""}">${highlighted}</code></pre>`;
    },
    link({ href, title, tokens }) {
      const safeHref = sanitizeUrl(href);
      const label = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noreferrer noopener"${titleAttr}>${label}</a>`;
    },
    image({ href, title, text }) {
      const safeHref = sanitizeUrl(href);
      if (safeHref === "#") {
        return escapeHtml(text || "");
      }

      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      return `<img src="${escapeHtml(safeHref)}" alt="${escapeHtml(text || "")}"${titleAttr} />`;
    },
  },
});

export function createDefaultAIConfig(): AIConfig {
  return {
    api_endpoint: "",
    api_key: "",
    model: "",
    timeout: 120,
    temperature: 1,
    max_tokens: 4096,
    top_p: 0.95,
    system_prompt: "",
  };
}

export function normalizeAIConfig(config?: Partial<AIConfig> | null): AIConfig {
  const defaults = createDefaultAIConfig();
  return {
    ...defaults,
    ...(config ?? {}),
    timeout: Number.isFinite(config?.timeout) && (config?.timeout ?? 0) > 0 ? Number(config?.timeout) : defaults.timeout,
    temperature:
      Number.isFinite(config?.temperature) && config?.temperature !== undefined
        ? Number(config?.temperature)
        : defaults.temperature,
    max_tokens:
      Number.isFinite(config?.max_tokens) && (config?.max_tokens ?? 0) > 0
        ? Number(config?.max_tokens)
        : defaults.max_tokens,
    top_p:
      config?.top_p === undefined || config?.top_p === null || Number.isNaN(Number(config.top_p))
        ? defaults.top_p
        : Number(config.top_p),
  };
}

export function formatAITimestamp(value: unknown) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

export function renderMarkdown(markdownText: string) {
  return markdown.parse(markdownText || "") as string;
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

export function sanitizeUrl(value: string) {
  const href = value.trim();
  if (!href) {
    return "#";
  }

  try {
    const url = new URL(href, window.location.origin);
    if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:") {
      return url.href;
    }
  } catch {
    if (href.startsWith("#")) {
      return href;
    }
  }

  return "#";
}
