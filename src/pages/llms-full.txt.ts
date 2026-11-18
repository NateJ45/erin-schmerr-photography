// Safe to edit by hand
// /llms-full.txt, built from Sanity on every build (src/lib/llms.ts, llms-data.ts).
import type { APIRoute } from 'astro';
import { buildLlmsFull } from '@/lib/llms';
import { getLlmsData } from '@/lib/llms-data';

export const prerender = true;

export const GET: APIRoute = async () =>
  new Response(buildLlmsFull(await getLlmsData()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
