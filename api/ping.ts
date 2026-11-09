export const config = { runtime: 'edge' };

export default function handler(): Response {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}