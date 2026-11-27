// SPDX-License-Identifier: AGPL-3.0-or-later
/** Serves the demo build from static assets. The Worker only adds the legal pages, the font proxy and security headers. */
import { handleFonts } from "./fonts";
import { LEGAL_PATHS, legalPage, parseLegal } from "./legal";

interface Env {
  ASSETS: Fetcher;
  /** JSON with the operator details for the imprint and privacy policy. Unset hides both. */
  LEGAL?: string;
}

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'"
].join("; ");

const SECURITY: Record<string, string> = {
  "content-security-policy": CSP,
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "DENY",
  "permissions-policy": "geolocation=(), camera=(), microphone=(), interest-cohort=()",
  "strict-transport-security": "max-age=31536000; includeSubDomains"
};

const withSecurity = (res: Response): Response => {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY)) out.headers.set(k, v);
  return out;
};

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const get = req.method === "GET" || req.method === "HEAD";

    const font = get ? await handleFonts(req, ctx) : null;
    if (font) return font;

    const legal = parseLegal(env.LEGAL);
    const kind = LEGAL_PATHS[url.pathname];
    if (kind && get) {
      if (!legal) {
        const page = await env.ASSETS.fetch(new Request(new URL("/404", url), req));
        return withSecurity(new Response(page.body, { status: 404, headers: page.headers }));
      }
      return withSecurity(
        new Response(legalPage(kind, legal), {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600" }
        })
      );
    }

    const res = await env.ASSETS.fetch(req);
    const isStart = url.pathname === "/" || url.pathname === "/index.html";
    if (isStart && !legal && (res.headers.get("content-type") || "").includes("text/html")) {
      // Without operator details there are no legal pages, so their footer links go too.
      return withSecurity(
        new HTMLRewriter()
          .on("[data-legal]", {
            element(el) {
              el.remove();
            }
          })
          .transform(res)
      );
    }
    return withSecurity(res);
  }
} satisfies ExportedHandler<Env>;
