import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let content = '';
    let agentOnline = false;
    try { content = await readFile(path.join(process.cwd(), 'data', 'records.jsonl'), 'utf8'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    try { agentOnline = (await fetch('http://127.0.0.1:4828/ready', { signal: AbortSignal.timeout(1000), cache: 'no-store' })).ok; }
    catch { /* No ready local agent. A hosted agent may still answer browser calls. */ }
    const records = content.split('\n').filter(Boolean).flatMap(line => {
      try { return [JSON.parse(line)]; } catch { return []; }
    }).slice(-100).reverse();
    return Response.json({ records, agentOnline }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Unable to read local call records.' }, { status: 500 });
  }
}
