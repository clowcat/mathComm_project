"use server";

import { NextResponse } from "next/server";

type PreviewPayload = {
  content?: unknown;
};

const HTML_ESCAPE_LOOKUP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const ESCAPE_REGEX = /[&<>"']/g;

function sanitizeToHtml(input: string) {
  const escaped = input.replace(ESCAPE_REGEX, (entity) => HTML_ESCAPE_LOOKUP[entity]);
  return escaped;
}

// Convert content to HTML while preserving LaTeX blocks
function convertToHtmlWithLatex(content: string): string {
  if (!content) return "";

  // Split content by LaTeX blocks (both inline and display)
  // Handle: $$...$$ (display), \(...\) (inline), \[...\] (display), $...$ (inline - less common)
  const latexPattern = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]+\$)/g;
  
  const parts: Array<{ text: string; isLatex: boolean }> = [];
  let lastIndex = 0;
  let match;

  // Find all LaTeX blocks
  while ((match = latexPattern.exec(content)) !== null) {
    // Add text before LaTeX
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({ text: textBefore, isLatex: false });
      }
    }
    // Add LaTeX block
    parts.push({ text: match[0], isLatex: true });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex);
    if (textAfter.trim()) {
      parts.push({ text: textAfter, isLatex: false });
    }
  }

  // If no LaTeX found, treat entire content as regular text
  if (parts.length === 0) {
    parts.push({ text: content, isLatex: false });
  }

  // Convert parts to HTML
  let html = "";
  for (const part of parts) {
    if (part.isLatex) {
      // LaTeX blocks - preserve as-is (MathJax will process them)
      html += part.text;
    } else {
      // Regular text - convert Markdown-like syntax and escape HTML
      let text = sanitizeToHtml(part.text);
      // Convert newlines to <br> or wrap in <p> tags
      text = text.replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br>");
      if (text && !text.startsWith("<p>")) {
        text = "<p>" + text + "</p>";
      }
      html += text;
    }
  }

  // Wrap in a container if needed
  return html || `<p>${sanitizeToHtml(content)}</p>`;
}

export async function POST(request: Request) {
  let body: PreviewPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (typeof body.content !== "string") {
    return NextResponse.json({ error: "Request body must include a string `content` field." }, { status: 400 });
  }

  const normalized = body.content.trim();

  if (!normalized) {
    return NextResponse.json({ html: "", info: "empty" });
  }

  // Convert to HTML with LaTeX support
  const html = convertToHtmlWithLatex(body.content);
  return NextResponse.json({ html });
}
