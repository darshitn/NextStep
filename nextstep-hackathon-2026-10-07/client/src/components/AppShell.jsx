import React, { useEffect, useRef } from 'react';
import AppearanceControl from './AppearanceControl.jsx';
import { Compass, LogOut, ShieldAlert } from 'lucide-react';
export default function AppShell({ user, onSignOut, isFixtureMode = true, sessionExpired = false, onRenewSession, children }) {
  const headerRef = useRef(null);
  useEffect(() => {
    const update = () => document.documentElement.style.setProperty('--header-offset', `${headerRef.current.getBoundingClientRect().height + 20}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);
  return <div className="app-shell">
    {sessionExpired && <div className="session-notice" role="alert">
      <ShieldAlert size={18} /><span>Your session expired. Sign in again to save your progress.</span>
      {onRenewSession && <button onClick={onRenewSession}>Sign in again</button>}
    </div>}
    <header ref={headerRef} className="app-header glass-panel"><div className="header-inner">
      <div className="app-brand"><span className="brand-symbol"><Compass size={22} /></span>
        <span className="brand-name">NextStep</span>{isFixtureMode && <span className="fixture-badge">Fixture Mode</span>}
      </div>
      <div className="header-actions"><AppearanceControl />
        {user && <><span className="account-name" title={user.name || user.email}>{user.name || user.email}</span>
          <button onClick={onSignOut} className="icon-button" aria-label="Sign out" title="Sign out"><LogOut size={18} /></button></>}
      </div>
    </div></header>
    <main className="app-content">{children}</main>
    <footer className="app-footer"><span>NextStep · One doable step at a time.</span><span>Self-reported practice · Dates in IST</span></footer>
  </div>;
}
