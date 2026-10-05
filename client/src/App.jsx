import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Server,
  Monitor,
  ArrowRight,
  ShieldAlert,
  Terminal,
  FileCode
} from 'lucide-react';
import './App.css';

export default function App() {
  // State machine: 'idle' | 'loading' | 'success' | 'error'
  const [status, setStatus] = useState('idle');
  const [responseData, setResponseData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [latency, setLatency] = useState(null);
  const [lastCheckedUrl, setLastCheckedUrl] = useState('');

  // Main verification call to GET /api/health
  const checkBackend = async (targetEndpoint = '/api/health') => {
    setStatus('loading');
    setErrorMessage('');
    setResponseData(null);
    setLastCheckedUrl(targetEndpoint);
    const startTime = performance.now();

    try {
      // Frontend calls relative URL '/api/health', which Vite proxies to http://localhost:3001/api/health
      const response = await fetch(targetEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLatency(elapsed);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} (${response.statusText || 'Unknown'})`);
      }

      const data = await response.json();

      // Ensure data.ok === true per requirement
      if (data && data.ok === true) {
        setResponseData(data);
        setStatus('success');
      } else {
        throw new Error(`Backend responded but "ok" is not true: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      setLatency(elapsed);
      setErrorMessage(err.message || 'Failed to connect to backend server');
      setStatus('error');
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="badge-tag">
          <span className="badge-dot"></span>
          NIAT Hackathon Stack • Checkpoint 1
        </div>
        <h1 className="main-title">AgroPulse Stack Practice</h1>
        <p className="subtitle">
          Verifying the local decoupled architecture: React (Vite) on port 5173, Express on port 3001, and Vite reverse proxy routing.
        </p>
      </header>

      {/* Architecture Strip */}
      <div className="architecture-strip">
        <div className="arch-node">
          <div className="arch-node-header">
            <span className="arch-node-title">1. Client UI</span>
            <span className="arch-port">:5173</span>
          </div>
          <div className="arch-node-desc">React + Vite</div>
        </div>

        <div className="arch-node">
          <div className="arch-node-header">
            <span className="arch-node-title">2. Dev Proxy</span>
            <span className="arch-port">vite.config.js</span>
          </div>
          <div className="arch-node-desc">/api ➔ localhost:3001</div>
        </div>

        <div className="arch-node">
          <div className="arch-node-header">
            <span className="arch-node-title">3. Backend API</span>
            <span className="arch-port">:3001</span>
          </div>
          <div className="arch-node-desc">Node + Express</div>
        </div>
      </div>

      {/* Interactive Control Panel */}
      <main className="glass-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Backend Connectivity Verification</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              Target Endpoint: <span className="endpoint-target">GET /api/health</span>
            </p>
          </div>
          <div className="meta-stats">
            {latency !== null && <span>Latency: <strong>{latency} ms</strong></span>}
          </div>
        </div>

        {/* Action Controls */}
        <div className="action-group">
          <button
            id="btn-check-backend"
            className="btn-primary"
            onClick={() => checkBackend('/api/health')}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="spinner" size={18} />
                Checking Backend...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Check backend
              </>
            )}
          </button>

          {/* Secondary test button to prove error state handling */}
          <button
            id="btn-simulate-error"
            className="btn-secondary"
            onClick={() => checkBackend('/api/non-existent-route')}
            disabled={status === 'loading'}
            title="Simulates calling an invalid endpoint to verify the Error state"
          >
            <ShieldAlert size={16} />
            Test 404 Error State
          </button>
        </div>

        {/* State 1: IDLE */}
        {status === 'idle' && (
          <div className="state-box state-idle" id="state-idle">
            <Server size={36} style={{ color: 'var(--text-dim)', marginBottom: '0.75rem' }} />
            <p>
              Click <strong>"Check backend"</strong> to test the Vite development proxy and retrieve
              the <code>{`{"ok": true}`}</code> response from the Express server.
            </p>
          </div>
        )}

        {/* State 2: LOADING */}
        {status === 'loading' && (
          <div className="state-box state-loading" id="state-loading">
            <div className="spinner"></div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--indigo-400)' }}>
                Connecting to backend via Vite proxy...
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Sending <code>GET {lastCheckedUrl}</code> to <code>http://localhost:5173</code>
              </div>
            </div>
          </div>
        )}

        {/* State 3: SUCCESS */}
        {status === 'success' && responseData && (
          <div className="state-box state-success" id="state-success">
            <div className="state-header">
              <span className="status-badge success">
                <CheckCircle2 size={16} />
                HTTP 200 OK — Backend Connected
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--emerald-400)', fontFamily: 'var(--font-mono)' }}>
                Endpoint: {lastCheckedUrl}
              </span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              The Vite development proxy successfully routed the request to the Express server on port 3001:
            </p>

            <pre className="json-display" id="response-payload">
              {JSON.stringify(responseData, null, 2)}
            </pre>
          </div>
        )}

        {/* State 4: ERROR */}
        {status === 'error' && (
          <div className="state-box state-error" id="state-error">
            <div className="state-header">
              <span className="status-badge error">
                <AlertCircle size={16} />
                Connection Error
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--rose-400)', fontFamily: 'var(--font-mono)' }}>
                Endpoint: {lastCheckedUrl}
              </span>
            </div>

            <div className="error-details">
              <div className="error-msg">{errorMessage}</div>
              <div className="error-tip">
                <strong>Troubleshooting Checklist:</strong>
                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem' }}>
                  <li>Is the Express backend running on <code>http://localhost:3001</code>? (Run <code>npm run dev:server</code>)</li>
                  <li>Is the Vite proxy configured in <code>vite.config.js</code> forwarding <code>/api</code>?</li>
                  <li>Check terminal logs for both Vite and Node server processes.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Explainer / Architectural Guide */}
      <section className="explainer-grid">
        <div className="info-card">
          <h3 className="info-title">
            <Terminal size={18} color="#818cf8" />
            Execution Commands & Ports
          </h3>
          <ul className="info-list">
            <li>
              <strong>Frontend Command:</strong> <code className="code-snippet">npm run dev:client</code> (or <code className="code-snippet">cd client && npm run dev</code>)
            </li>
            <li>
              <strong>Frontend Port:</strong> <code className="code-snippet">5173</code> (Vite Dev Server)
            </li>
            <li>
              <strong>Backend Command:</strong> <code className="code-snippet">npm run dev:server</code> (or <code className="code-snippet">cd server && npm start</code>)
            </li>
            <li>
              <strong>Backend Port:</strong> <code className="code-snippet">3001</code> (Node/Express Server)
            </li>
          </ul>
        </div>

        <div className="info-card">
          <h3 className="info-title">
            <FileCode size={18} color="#34d399" />
            Connection Files & Data Flow
          </h3>
          <ul className="info-list">
            <li>
              <code className="code-snippet">client/src/App.jsx</code>: Contains the <strong>"Check backend"</strong> button that invokes <code className="code-snippet">fetch('/api/health')</code> and manages UI states.
            </li>
            <li>
              <code className="code-snippet">client/vite.config.js</code>: Maps <code className="code-snippet">/api</code> requests to <code className="code-snippet">http://localhost:3001</code>, transparently bridging origins.
            </li>
            <li>
              <code className="code-snippet">server/index.js</code>: Express route handler <code className="code-snippet">app.get('/api/health')</code> responding with <code className="code-snippet">{`{"ok": true}`}</code>.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
