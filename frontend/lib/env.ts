// In the browser, always route API requests through the Next.js same-origin BFF proxy ("/api")
// so cookies are 1st-party on the Next.js domain (e.g. uemp-task.vercel.app).
// This enables true server-side Next.js middleware guards, avoids cross-origin cookie loss,
// and prevents third-party cookie blocking in modern browsers.
export const BACKEND_INTERNAL_URL =
  process.env.INTERNAL_API_URL ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/v1";

export const API_URL =
  typeof window !== "undefined"
    ? "/api"
    : BACKEND_INTERNAL_URL;
