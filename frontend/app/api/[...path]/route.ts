import { NextRequest, NextResponse } from "next/server";

// Upstream NestJS API URL (configured in Vercel or local env)
function getUpstreamBaseUrl(): string {
  const url =
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000/v1";
  return url.replace(/\/+$/, "");
}

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const targetPath = path.join("/");
  const upstreamBase = getUpstreamBaseUrl();
  const search = request.nextUrl.search; // includes ?query=...
  const targetUrl = `${upstreamBase}/${targetPath}${search}`;

  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!["host", "connection", "content-length"].includes(lower)) {
      forwardHeaders.set(key, value);
    }
  });

  const method = request.method;
  const body = ["GET", "HEAD"].includes(method) ? undefined : await request.arrayBuffer();

  try {
    const upstreamRes = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      redirect: "manual",
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    upstreamRes.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (
        lower !== "set-cookie" &&
        lower !== "content-encoding" &&
        lower !== "transfer-encoding"
      ) {
        responseHeaders.set(key, value);
      }
    });

    const clientRes = new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: responseHeaders,
    });

    // Forward Set-Cookie headers from upstream
    const setCookies = upstreamRes.headers.getSetCookie
      ? upstreamRes.headers.getSetCookie()
      : [];

    for (const cookieStr of setCookies) {
      // Remove any upstream Domain=... so the cookie binds to the Next.js domain (host-only)
      const sanitized = cookieStr.replace(/;\s*Domain=[^;]+/gi, "");
      clientRes.headers.append("Set-Cookie", sanitized);
    }

    return clientRes;
  } catch (error) {
    console.error(`[API Proxy] Error forwarding ${method} to ${targetUrl}:`, error);
    return NextResponse.json(
      {
        success: false,
        statusCode: 502,
        message: "Failed to connect to backend service",
      },
      { status: 502 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const HEAD = proxyRequest;
