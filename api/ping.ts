export const config = { runtime: 'edge', regions: ['hkg1'] };

export default function handler(): Response {
  return new Response(JSON.stringify({
    status: 'ok',
    region: process.env.VERCEL_REGION ?? 'unknown',
    edge: typeof (globalThis as { EdgeRuntime?: string }).EdgeRuntime === 'string',
  }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}