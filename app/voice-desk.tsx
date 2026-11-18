'use client';

import { useEffect, useRef, useState } from 'react';
import type { Call } from '@guava-ai/guava-sdk/webrtc';

type RecordEntry = { id: string; at: string; fields: Record<string, unknown> };

export default function VoiceDesk({ code }: { code: string }) {
  const callRef = useRef<Call | null>(null);
  const [state, setState] = useState('not-started');
  const [error, setError] = useState('');
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [online, setOnline] = useState(false);
  const [dataError, setDataError] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const active = !['not-started', 'ended'].includes(state);

  useEffect(() => {
    let alive = true;
    async function refresh() {
      try {
        const response = await fetch('/api/records', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to read records');
        const data = await response.json();
        if (alive) { setRecords(data.records); setOnline(data.agentOnline); setDataError(false); }
      } catch { if (alive) setDataError(true); }
    }
    void refresh();
    const interval = setInterval(refresh, 3000);
    return () => { alive = false; clearInterval(interval); void callRef.current?.hangup(); };
  }, []);

  useEffect(() => {
    if (state !== 'connected') return;
    const interval = setInterval(() => setElapsed(value => value + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

  async function startCall() {
    setBusy(true); setError(''); setElapsed(0); setState('starting');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone access needs localhost or HTTPS and a supported browser.');
      const { Call } = await import('@guava-ai/guava-sdk/webrtc');
      const call = new Call({ webrtcCode: code });
      callRef.current = call;
      call.onStateChange(next => setState(next));
      await call.start();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not connect. Check microphone permission and your Guava agent.');
      try { await callRef.current?.hangup(); } catch { /* The failed connection may already be closed. */ }
      callRef.current = null; setState('ended');
    } finally { setBusy(false); }
  }

  async function endCall() {
    setBusy(true);
    try { await callRef.current?.hangup(); callRef.current = null; setState('ended'); }
    catch { setError('Could not close the call. Close this browser tab to stop microphone access.'); }
    finally { setBusy(false); }
  }

  const label: Record<string, string> = {
    'not-started': 'Ready when you are', starting: 'Starting your call…',
    'waiting-for-permission': 'Allow microphone access', connecting: 'Connecting to your agent…',
    connected: 'You’re connected', ended: 'Call ended',
  };

  return <main>
    <nav><a className="brand" href="/"><span className="brand-icon">g</span> guava<span className="brand-sub">/ voice desk</span></a><a className="dashboard" href="https://app.goguava.ai" target="_blank" rel="noreferrer">Guava dashboard ↗</a></nav>
    <header><span className="eyebrow">YOUR CUSTOMER INTAKE ASSISTANT</span><h1>A conversation.<br/><span>A better connection.</span></h1><p>Give your voice assistant a call. Let it listen, ask the right<br className="desktop"/> questions, and collect the details for you.</p></header>
    <div className="workspace">
      <section className="call-card" aria-labelledby="call-heading">
        <div className="card-top"><span className="pill">BROWSER CALL</span><span className="secure">◈ Microphone required</span></div>
        <div className={`orb-scene ${state === 'connected' ? 'speaking' : ''}`} aria-hidden="true"><div className="ring ring-one"/><div className="ring ring-two"/><div className="orb"><svg width="50" height="50" viewBox="0 0 50 50" fill="none"><path d="M13 21v8m8-16v24m8-30v36m8-24v12" stroke="white" strokeWidth="4" strokeLinecap="round"/></svg></div></div>
        <h2 id="call-heading" aria-live="polite">{label[state] || state}</h2>
        <p className="call-caption">{state === 'connected' ? `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')} · Speak naturally. Your assistant is listening.` : 'A real conversation with your Guava agent.'}</p>
        <button className={`call-button ${active ? 'end' : ''}`} disabled={busy} onClick={() => void (active ? endCall() : startCall())}>{active ? 'End call' : '↗ Start a test call'}</button>
        <p className="hint">Use headphones for the clearest conversation.</p>
        {error && <div role="alert" className="error">{error}<br/>Check that an agent is listening to this WebRTC code in Guava.</div>}
        <div className="phone-row"><div><span className="tiny-label">PREFER YOUR PHONE?</span><a href="tel:+12677470494">+1 (267) 747-0494 ↗</a></div><span className="phone-note">Carrier charges<br/>may apply</span></div>
      </section>
      <aside>
        <section className="guide-card"><div className="section-heading"><h2>The conversation plan</h2><span className="small-badge">DEMO</span></div><p>A simple customer enquiry, one question at a time.</p><ol><li><span>01</span><div><strong>Make an introduction</strong><p>The assistant introduces itself as AI.</p></div></li><li><span>02</span><div><strong>Get the essential details</strong><p>Name, callback number, and what you need.</p></div></li><li><span>03</span><div><strong>Confirm & save</strong><p>Read the details back before saving.</p></div></li></ol><div className="agent-status"><span className={`dot ${online ? 'online' : ''}`}/>{online ? 'Local intake agent is running' : 'Local intake agent is not running'}</div>{!online && <p className="setup-note">An existing Guava-hosted agent can still answer. To use this demo’s collection flow, add your new key to <code>.env.local</code> and run <code>npm run agent</code>.</p>}</section>
        <section className="note-card"><span>✦</span><div><strong>Try saying hello in Bangla</strong><p>The demo asks the agent to follow your language. Bangla quality depends on Guava’s voice support.</p></div></section>
      </aside>
    </div>
    <section className="records-card"><div className="section-heading"><div><span className="eyebrow">AFTER THE CONVERSATION</span><h2>Collected details <span className="count">{records.length}</span></h2></div><span className="auto-refresh">↻ Updates every 3 seconds</span></div>{dataError ? <div className="empty">Couldn’t load saved details. Check the local server and refresh.</div> : records.length ? <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Callback number</th><th>Request</th><th>Collected</th></tr></thead><tbody>{records.map(record => <tr key={record.id}><td>{String(record.fields.customer_name ?? '—')}</td><td>{String(record.fields.phone_number ?? '—')}</td><td>{String(record.fields.customer_request ?? '—')}</td><td>{new Date(record.at).toLocaleString()}</td></tr>)}</tbody></table></div> : <div className="empty"><span className="empty-symbol">☷</span><strong>Your next conversation starts here</strong><p>Confirmed details from the local intake agent will appear here.<br/>Calls handled by another hosted agent won’t populate this panel.</p></div>}</section>
    <footer><span>Built with Guava · Voice, with a purpose.</span><span>Local test workspace</span></footer>
  </main>;
}
