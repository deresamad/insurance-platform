import https from "https";
import type { IncomingHttpHeaders } from "http";
import { NextRequest, NextResponse } from "next/server";

const API_ORIGIN = process.env.INSURANCE_API_ORIGIN || "https://127.0.0.1:5001";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host"
]);

/** Do not forward — body is a fresh buffer; wrong encoding/length breaks JSON in the browser. */
const STRIP_FROM_BACKEND_RESPONSE = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding"
]);

function buildTargetUrl(pathSegments: string[], search: string): string {
  const path = pathSegments.length ? pathSegments.join("/") : "";
  const base = `${API_ORIGIN}/api/${path}`;
  return search ? `${base}${search}` : base;
}

async function proxy(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const url = buildTargetUrl(pathSegments, req.nextUrl.search);
  const method = req.method.toUpperCase();
  const body =
    method !== "GET" && method !== "HEAD" && method !== "OPTIONS"
      ? await req.arrayBuffer()
      : undefined;

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    headers[key] = value;
  });
  if (body && !headers["content-length"] && !headers["Content-Length"]) {
    headers["Content-Length"] = String(body.byteLength);
  }

  const u = new URL(url);
  const insecureDev = process.env.NODE_ENV === "development";

  const { statusCode, resHeaders, resBody } = await new Promise<{
    statusCode: number;
    resHeaders: IncomingHttpHeaders;
    resBody: Buffer;
  }>((resolve, reject) => {
    const opts: https.RequestOptions = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method,
      headers,
      rejectUnauthorized: !insecureDev
    };

    const proxyReq = https.request(opts, (proxyRes) => {
      const chunks: Buffer[] = [];
      proxyRes.on("data", (c: Buffer) => chunks.push(c));
      proxyRes.on("end", () => {
        resolve({
          statusCode: proxyRes.statusCode || 500,
          resHeaders: proxyRes.headers,
          resBody: Buffer.concat(chunks)
        });
      });
    });
    proxyReq.on("error", reject);
    if (body && body.byteLength) {
      proxyReq.write(Buffer.from(body));
    }
    proxyReq.end();
  });

  const out = new Headers();
  for (const [key, value] of Object.entries(resHeaders)) {
    if (value === undefined) continue;
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || STRIP_FROM_BACKEND_RESPONSE.has(lower)) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => out.append(key, v));
    } else {
      out.set(key, value);
    }
  }

  return new NextResponse(new Uint8Array(resBody), {
    status: statusCode,
    headers: out
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function OPTIONS(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}
