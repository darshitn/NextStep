import React, { useState, useEffect } from 'react';
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
  FileCode,
  Database,
  Send,
  FileText,
  Clock,
  Check,
  Info
} from 'lucide-react';
import './App.css';

export default function App() {
  // --- Checkpoint 1: Health State Machine ('idle' | 'loading' | 'success' | 'error') ---
  const [status, setStatus] = useState('idle');
  const [responseData, setResponseData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [latency, setLatency] = useState(null);
  const [lastCheckedUrl, setLastCheckedUrl] = useState('');

  // --- Checkpoint 2: Notes State ---
  const [notes, setNotes] = useState([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [fetchNotesError, setFetchNotesError] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Main verification call to GET /api/health
  const checkBackend = async (targetEndpoint = '/api/health') => {
    setStatus('loading');
    setErrorMessage('');
    setResponseData(null);
    setLastCheckedUrl(targetEndpoint);
    const startTime = performance.now();

    try {
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

  // Fetch saved notes (newest first) from GET /api/notes
  const fetchNotes = async () => {
    setIsLoadingNotes(true);
    setFetchNotesError('');

    try {
      const response = await fetch('/api/notes', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status} (${response.statusText || 'Error'})`);
      }

      const data = await response.json();
      setNotes(Array.isArray(data) ? data : (data.notes || []));
    } catch (err) {
      setFetchNotesError(err.message || 'Could not load notes from database');
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Save new note via POST /api/notes
  const handleSaveNote = async (e) => {
    e.preventDefault();
    const trimmed = noteBody.trim();

    if (!trimmed) {
      setSaveError('Note body cannot be empty.');
      return;
    }

    if (trimmed.length > 1000) {
      setSaveError('Note body exceeds maximum limit of 1000 characters.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ body: trimmed }),
      });

      if (response.status !== 201) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || `Save failed with HTTP status ${response.status}`);
      }

      const savedNote = await response.json();
      setNoteBody('');
      setSaveSuccess(`Note #${savedNote.id || ''} saved successfully!`);
      // Prepend the new note to the list
      setNotes((prevNotes) => [savedNote, ...prevNotes]);

      // Clear success notification after 4 seconds
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save note due to server or database error.');
    } finally {
      setIsSaving(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="badge-tag">
          <span className="badge-dot"></span>
          NIAT Hackathon Stack • Checkpoint 2: PostgreSQL Persistence
        </div>
        <h1 className="main-title">AgroPulse Stack Practice</h1>
        <p className="subtitle">
          Verifying full-stack connectivity and PostgreSQL persistence: React (Vite) on port 5173, Express on port 3001, and Replit PostgreSQL via connection pooling.
        </p>
      </header>

      {/* Architecture Strip */}
      <div className="architecture-strip">
        <div className="arch-node">
          <div className="arch-node-header">
            <span className="arch-node-title">1. Client UI</span>
            <span className="arch-port">:5173 / :3001</span>
          </div>
          <div className="arch-node-desc">React 18 + Vite SPA</div>
        </div>

        <div className="arch-node">
          <div className="arch-node-header">
            <span className="arch-node-title">2. API Server</span>
            <span className="arch-port">Node / Express</span>
          </div>
          <div className="arch-node-desc">Unified Port (0.0.0.0)</div>
        </div>

        <div className="arch-node">
          <div className="arch-node-header">
            <span className="arch-node-title">3. Database</span>
            <span className="arch-port">pg Pool</span>
          </div>
          <div className="arch-node-desc">PostgreSQL (DATABASE_URL)</div>
        </div>
      </div>

      {/* Section 1: Backend Connectivity Verification (Milestone 1) */}
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

      {/* Section 2: PostgreSQL Note Persistence (Checkpoint 2) */}
      <section className="glass-card" id="notes-section">
        <div className="panel-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Database size={22} color="#10b981" />
              <h2 className="panel-title">PostgreSQL Note Persistence</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              Endpoints: <span className="endpoint-target">POST /api/notes</span> & <span className="endpoint-target">GET /api/notes</span>
            </p>
          </div>
          <div className="meta-stats">
            <button
              id="btn-refresh-notes"
              className="btn-secondary"
              onClick={fetchNotes}
              disabled={isLoadingNotes}
              title="Refresh notes from PostgreSQL"
            >
              <RefreshCw size={14} className={isLoadingNotes ? 'spinner' : ''} />
              {isLoadingNotes ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>
        </div>

        {/* Create Note Form */}
        <form onSubmit={handleSaveNote} className="note-form" id="form-create-note">
          <label htmlFor="note-input" className="form-label">
            <span>Add Practice Note</span>
            <span className="char-counter" style={{ color: noteBody.length > 950 ? 'var(--rose-400)' : 'var(--text-dim)' }}>
              {noteBody.length} / 1000 characters
            </span>
          </label>
          <textarea
            id="note-input"
            className="note-textarea"
            rows="3"
            placeholder="Type note content to persist in PostgreSQL (e.g., 'Soil moisture reading 42% in Field B')..."
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            maxLength={1000}
            disabled={isSaving}
          />

          <div className="form-actions">
            <button
              type="submit"
              id="btn-save-note"
              className="btn-primary"
              disabled={isSaving || noteBody.trim().length === 0}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Saving to PostgreSQL...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Save Note
                </>
              )}
            </button>
          </div>
        </form>

        {/* Save Status / Error Feedback */}
        {saveSuccess && (
          <div className="alert-banner success" id="save-success-msg">
            <Check size={18} />
            <span>{saveSuccess}</span>
          </div>
        )}

        {saveError && (
          <div className="alert-banner error" id="save-error-msg">
            <AlertCircle size={18} />
            <div>
              <strong>Failed to Save Note:</strong> {saveError}
              <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: 'var(--rose-400)' }}>
                Verify that <code>DATABASE_URL</code> is configured in backend environment and migration has been run via <code>npm run migrate</code>.
              </div>
            </div>
          </div>
        )}

        {/* Saved Notes List */}
        <div className="notes-list-header">
          <h3 className="section-subtitle">
            <FileText size={18} color="#818cf8" />
            Persisted Notes ({notes.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Sorted newest first
          </span>
        </div>

        {/* Fetch Notes Error */}
        {fetchNotesError && (
          <div className="alert-banner error" id="fetch-notes-error">
            <AlertCircle size={18} />
            <div>
              <strong>Database Query Failed:</strong> {fetchNotesError}
              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--rose-400)' }}>
                Troubleshooting: Ensure <code>DATABASE_URL</code> is set in Replit Secrets (or local <code>.env</code>) and run <code>npm run migrate</code> to create the table.
              </div>
            </div>
          </div>
        )}

        {/* Loading Notes Spinner */}
        {isLoadingNotes && notes.length === 0 && (
          <div className="state-box state-loading" style={{ padding: '1.5rem', marginTop: '1rem' }}>
            <Loader2 size={24} className="spinner" />
            <span style={{ color: 'var(--indigo-400)' }}>Loading notes from PostgreSQL...</span>
          </div>
        )}

        {/* Empty Notes State */}
        {!isLoadingNotes && !fetchNotesError && notes.length === 0 && (
          <div className="state-box state-idle" id="empty-notes-state" style={{ padding: '2rem 1rem', marginTop: '1rem' }}>
            <FileText size={32} style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }} />
            <p>No notes saved in database yet.</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
              Submit a note using the form above to verify SQL <code>INSERT</code> and persistent retrieval.
            </p>
          </div>
        )}

        {/* Notes Cards */}
        {notes.length > 0 && (
          <div className="notes-grid" id="notes-container">
            {notes.map((note) => (
              <div key={note.id || Math.random()} className="note-card" id={`note-item-${note.id}`}>
                <div className="note-card-header">
                  <span className="note-id-badge">#{note.id}</span>
                  <span className="note-timestamp">
                    <Clock size={12} />
                    {note.created_at ? new Date(note.created_at).toLocaleString() : 'Just now'}
                  </span>
                </div>
                <div className="note-card-body">{note.body}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Explainer / Architectural Guide */}
      <section className="explainer-grid">
        <div className="info-card">
          <h3 className="info-title">
            <Terminal size={18} color="#818cf8" />
            Database & Runtime Commands
          </h3>
          <ul className="info-list">
            <li>
              <strong>Execute Migration:</strong> <code className="code-snippet">npm run migrate</code> (creates <code className="code-snippet">notes</code> table if not exists)
            </li>
            <li>
              <strong>Start Server:</strong> <code className="code-snippet">npm start</code> (production single-port) or <code className="code-snippet">npm run dev:server</code>
            </li>
            <li>
              <strong>Build Frontend:</strong> <code className="code-snippet">npm run build</code> (compiles to <code className="code-snippet">client/dist</code>)
            </li>
            <li>
              <strong>Install Dependencies:</strong> <code className="code-snippet">npm run install:all</code> (installs client & server deps)
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
              <code className="code-snippet">server/db.js</code>: Reuses singleton <code className="code-snippet">pg.Pool</code> reading <code className="code-snippet">DATABASE_URL</code>.
            </li>
            <li>
              <code className="code-snippet">server/migrate.js</code>: Non-destructive <code className="code-snippet">CREATE TABLE IF NOT EXISTS notes</code> schema script.
            </li>
            <li>
              <code className="code-snippet">server/index.js</code>: REST routes <code className="code-snippet">POST /api/notes</code> (parameterized INSERT) & <code className="code-snippet">GET /api/notes</code>.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
