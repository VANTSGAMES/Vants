/**
 * Banter Edge Worker (Cloudflare Workers)
 * -----------------------------------------------------------------------------
 * Cumple la especificación IAB one-hop de NitroPay para /ads.txt:
 *   GET /ads.txt -> 301 Permanent Redirect a https://api.nitropay.com/v1/ads-<NITROPAY_SITE_ID>.txt
 * También sirve /salud y cabeceras de seguridad compatibles con NitroPay + CMP.
 */

export function buildNitroAdsTxtRedirect(siteId) {
  const clean = String(siteId || '').trim();
  if (!/^\d{3,10}$/.test(clean)) return null;
  return `https://api.nitropay.com/v1/ads-${clean}.txt`;
}

export async function handleEdgeRequest(req, env) {
  const url = new URL(req.url);

  if (url.pathname === '/ads.txt' && (req.method === 'GET' || req.method === 'HEAD')) {
    const target = buildNitroAdsTxtRedirect(env && env.NITROPAY_SITE_ID);
    if (target) {
      return new Response(null, {
        status: 301,
        headers: {
          location: target,
          'cache-control': 'public, max-age=3600',
        },
      });
    }
    return new Response(
      '# NitroPay ads.txt pendiente de NITROPAY_SITE_ID.\n# Configura NITROPAY_SITE_ID en wrangler.toml para activar el redirect 301 a https://api.nitropay.com/v1/ads-<ID>.txt\n',
      {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=300',
        },
      },
    );
  }

  if (url.pathname === '/salud') {
    return new Response(
      JSON.stringify({
        ok: true,
        service: 'banter-edge',
        nitropayConfigured: Boolean(buildNitroAdsTxtRedirect(env && env.NITROPAY_SITE_ID)),
        sheetId: (env && env.BANTER_SHEET_ID) || null,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      },
    );
  }

  if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
    return env.ASSETS.fetch(req);
  }

  return new Response(JSON.stringify({ ok: false, error: 'not_found' }), {
    status: 404,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export default {
  fetch(req, env) {
    return handleEdgeRequest(req, env);
  },
};
