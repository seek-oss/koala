import type Koa from 'koa';

/**
 * Adds HTTP response headers that opt-in to stricter browser security policies
 *
 * This middleware makes the following assumptions:
 * 1. The app's domain does not mix HTTP and HTTPS
 * 2. The response is an API response, i.e. it is not being directly rendered
 *    by the browser
 * 3. The responses have an accurate `Content-Type` header
 */
export const middleware: Koa.Middleware = async (ctx, next) => {
  // WARNING: Any semantic changes to these headers should be treated as a
  // breaking change of Koala.

  // Enforce HTTPS when connecting to this domain for a year.
  // This works with local testing over HTTP - the header is ignored when
  // received over HTTP;
  ctx.set('Strict-Transport-Security', 'max-age=31536000');

  // Disable HTML from loading resources from any source.
  // This prevents the browser from rendering any complex HTML beyond e.g.
  // trivial error pages.
  ctx.set('Content-Security-Policy', "default-src 'none'");

  // Do not render this content if a reflected XSS attack is detected.
  // This is mostly redundant as our `Content-Security-Policy` does not allow
  // inline scripts.
  ctx.set('X-XSS-Protection', '1; mode=block');

  // Prevent us from being framed or embedded.
  ctx.set('X-Frame-Options', 'deny');

  // Disable MIME type sniffing.
  // This prevents attacks where the attacker can manipulate the response in to
  // being detected the wrong MIME type.
  ctx.set('X-Content-Type-Options', 'nosniff');

  await next();
};
