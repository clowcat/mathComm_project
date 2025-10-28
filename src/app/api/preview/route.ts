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

  const html = sanitizeToHtml(body.content);
  return NextResponse.json({ html });
}
