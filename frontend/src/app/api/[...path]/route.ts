import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path?: string[] }> };

const getBackendBaseUrl = () => {
  const raw =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
};

const toBackendApiUrl = (req: NextRequest, pathSegments: string[]) => {
  const incoming = new URL(req.url);
  const backendBase = getBackendBaseUrl();
  const base = backendBase.endsWith("/api")
    ? backendBase.slice(0, -4)
    : backendBase;
  const path = pathSegments.join("/");
  return `${base}/api/${path}${incoming.search}`;
};

const proxy = async (req: NextRequest, pathSegments: string[]) => {
  const url = toBackendApiUrl(req, pathSegments);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");

  const method = req.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await req.arrayBuffer();

  const upstream = await fetch(url, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
};

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}

export async function OPTIONS(req: NextRequest, ctx: RouteContext) {
  const { path = [] } = await ctx.params;
  return proxy(req, path);
}
