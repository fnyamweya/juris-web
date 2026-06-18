"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LOCK_BROADCAST_KEY = "juris-session-locked-at";
const MAX_TIMEOUT_MS = 2_147_483_647;

const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "wheel",
] as const;

const HEARTBEAT_DEBOUNCE_MS = 20_000;
const HEARTBEAT_WARN_DEBOUNCE_MS = 1_500;
const COUNTDOWN_TICK_MS = 1_000;

type HeartbeatResponse = {
  ok: boolean;
  status: string;
  lastActivityAt: string | null;
  idleTimeoutSeconds: number | null;
  warningBeforeTimeoutSeconds: number;
};

export type SessionLockTimerClientProps = {
  locale: string;
  lastActivityAt: string;
  idleTimeoutSeconds: number;
  warningBeforeTimeoutSeconds?: number;
  maskedEmail?: string;
  touchPath?: string;
};

function isSessionUtilityPath() {
  const { pathname } = window.location;
  return (
    pathname.includes("/session/locked") ||
    pathname.includes("/login") ||
    pathname.includes("/logout") ||
    pathname.startsWith("/api/")
  );
}

function broadcastLock() {
  try {
    window.localStorage.setItem(LOCK_BROADCAST_KEY, String(Date.now()));
  } catch { /* ignore */ }
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

const t = {
  card: "hsl(var(--card))",
  cardFg: "hsl(var(--card-foreground))",
  primary: "hsl(var(--primary))",
  primaryFg: "hsl(var(--primary-foreground))",
  muted: "hsl(var(--muted))",
  mutedFg: "hsl(var(--muted-foreground))",
  border: "hsl(var(--border))",
  warning: "hsl(var(--warning))",
  background: "hsl(var(--background))",
  shadow:
    "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 10px 30px -5px rgb(0 0 0 / 0.12), 0 0 0 1px hsl(var(--border))",
} as const;

export function SessionLockTimerClient({
  locale,
  lastActivityAt: initialLastActivityAt,
  idleTimeoutSeconds,
  warningBeforeTimeoutSeconds = 120,
  maskedEmail,
  touchPath = "/api/session/touch",
}: SessionLockTimerClientProps) {
  const [showWarning, _setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningBeforeTimeoutSeconds);
  const [extending, setExtending] = useState(false);
  const [extendFailed, setExtendFailed] = useState(false);

  const lastActivityMsRef = useRef<number>(Date.parse(initialLastActivityAt));
  const idleTimeoutMsRef = useRef<number>(idleTimeoutSeconds * 1000);
  const warnThresholdMsRef = useRef<number>(warningBeforeTimeoutSeconds * 1000);
  const warnTotalSecondsRef = useRef<number>(warningBeforeTimeoutSeconds);

  const redirectedRef = useRef(false);
  const heartbeatTimerRef = useRef<number | null>(null);
  const heartbeatInFlightRef = useRef(false);
  const lockTimerRef = useRef<number | null>(null);
  const warnTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const showWarningRef = useRef(false);

  const setShowWarning = useCallback((v: boolean) => {
    showWarningRef.current = v;
    _setShowWarning(v);
  }, []);

  const redirectToLocked = useCallback(() => {
    if (redirectedRef.current || isSessionUtilityPath()) return;
    redirectedRef.current = true;
    broadcastLock();
    const returnTo =
      window.location.pathname + window.location.search + window.location.hash;
    const url = new URL(
      `/${encodeURIComponent(locale)}/session/locked`,
      window.location.origin,
    );
    url.searchParams.set("returnTo", returnTo);
    window.location.assign(url.pathname + url.search);
  }, [locale]);

  const scheduleTimers = useCallback(() => {
    if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
    if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current);
    if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);

    const now = Date.now();
    const expiresMs = lastActivityMsRef.current + idleTimeoutMsRef.current;
    const warnAtMs = expiresMs - warnThresholdMsRef.current;

    const msUntilLock = Math.max(0, expiresMs - now);
    const msUntilWarn = Math.max(0, warnAtMs - now);

    if (msUntilLock === 0) { redirectToLocked(); return; }

    if (msUntilWarn < msUntilLock) {
      warnTimerRef.current = window.setTimeout(() => {
        setShowWarning(true);
        setExtendFailed(false);
        const initial = Math.round((expiresMs - Date.now()) / 1000);
        warnTotalSecondsRef.current = initial;
        setCountdown(Math.max(0, initial));

        countdownIntervalRef.current = window.setInterval(() => {
          const rem = Math.round((expiresMs - Date.now()) / 1000);
          if (rem <= 0) {
            window.clearInterval(countdownIntervalRef.current!);
            redirectToLocked();
          } else {
            setCountdown(rem);
          }
        }, COUNTDOWN_TICK_MS);
      }, Math.min(msUntilWarn, MAX_TIMEOUT_MS));
    }

    lockTimerRef.current = window.setTimeout(
      redirectToLocked,
      Math.min(msUntilLock, MAX_TIMEOUT_MS),
    );
  }, [redirectToLocked, setShowWarning]);

  const sendHeartbeat = useCallback(() => {
    if (heartbeatInFlightRef.current) return;
    heartbeatInFlightRef.current = true;
    fetch(touchPath, { method: "POST", credentials: "same-origin" })
      .then((r) => r.json() as Promise<HeartbeatResponse>)
      .then((data) => {
        heartbeatInFlightRef.current = false;
        if (!data.ok) { redirectToLocked(); return; }
        if (data.lastActivityAt) lastActivityMsRef.current = Date.parse(data.lastActivityAt);
        if (data.idleTimeoutSeconds) idleTimeoutMsRef.current = data.idleTimeoutSeconds * 1000;
        warnThresholdMsRef.current = data.warningBeforeTimeoutSeconds * 1000;
        setShowWarning(false);
        setExtending(false);
        setExtendFailed(false);
        scheduleTimers();
      })
      .catch(() => {
        heartbeatInFlightRef.current = false;
        setExtending(false);
        setExtendFailed(true);
      });
  }, [touchPath, redirectToLocked, scheduleTimers, setShowWarning]);

  const scheduleHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) window.clearTimeout(heartbeatTimerRef.current);
    heartbeatTimerRef.current = window.setTimeout(() => {
      heartbeatTimerRef.current = null;
      sendHeartbeat();
    }, HEARTBEAT_DEBOUNCE_MS);
  }, [sendHeartbeat]);


  const handleContinue = useCallback(() => {
    if (extending) return;
    setExtending(true);
    setExtendFailed(false);

    if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
    if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current);
    if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    if (heartbeatTimerRef.current) window.clearTimeout(heartbeatTimerRef.current);
    lockTimerRef.current = null;
    warnTimerRef.current = null;
    heartbeatTimerRef.current = null;

    heartbeatInFlightRef.current = false;
    sendHeartbeat();
  }, [extending, sendHeartbeat]);

  useEffect(() => {
    if (idleTimeoutSeconds <= 0 || !Number.isFinite(lastActivityMsRef.current)) return;

    scheduleTimers();

    const onActivity = () => {
      if (showWarningRef.current) {
        if (heartbeatTimerRef.current) window.clearTimeout(heartbeatTimerRef.current);
        heartbeatTimerRef.current = window.setTimeout(() => {
          heartbeatTimerRef.current = null;
          sendHeartbeat();
        }, HEARTBEAT_WARN_DEBOUNCE_MS);
      } else {
        scheduleHeartbeat();
      }
    };
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true }),
    );

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (Date.now() >= lastActivityMsRef.current + idleTimeoutMsRef.current) {
          redirectToLocked();
        } else {
          scheduleTimers();
        }
      }
    };
    const onFocus = () => {
      if (Date.now() >= lastActivityMsRef.current + idleTimeoutMsRef.current) redirectToLocked();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCK_BROADCAST_KEY) redirectToLocked();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
      if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current);
      if (heartbeatTimerRef.current) window.clearTimeout(heartbeatTimerRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    };
  }, [idleTimeoutSeconds, redirectToLocked, scheduleTimers, scheduleHeartbeat, sendHeartbeat]);

  if (!showWarning) return null;

  const total = warnTotalSecondsRef.current || warningBeforeTimeoutSeconds;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="slw-title"
      aria-describedby="slw-desc"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        backgroundColor: "hsl(var(--background) / 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "slwFadeIn 0.18s ease",
      }}
    >
      <style>{`
        @keyframes slwFadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        @keyframes slwBar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        .slw-card { width: 100%; max-width: 22rem; border-radius: var(--radius, 0.5rem); background: ${t.card}; color: ${t.cardFg}; border: 1px solid ${t.border}; box-shadow: ${t.shadow}; overflow: hidden; animation: slwFadeIn 0.22s ease; }
        .slw-progress { height: 3px; background: ${t.muted}; }
        .slw-progress-bar { height: 100%; background: ${t.warning}; transform-origin: left; animation: slwBar ${total}s linear forwards; }
        .slw-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .slw-header { display: flex; align-items: flex-start; gap: 0.875rem; }
        .slw-icon { flex-shrink: 0; width: 2.5rem; height: 2.5rem; border-radius: 50%; background: hsl(var(--warning) / 0.12); display: flex; align-items: center; justify-content: center; }
        .slw-heading { display: flex; flex-direction: column; gap: 0.1875rem; padding-top: 0.125rem; }
        .slw-title { font-size: 0.9375rem; font-weight: 600; line-height: 1.3; color: ${t.cardFg}; }
        .slw-desc { font-size: 0.8125rem; line-height: 1.5; color: ${t.mutedFg}; }
        .slw-countdown { font-variant-numeric: tabular-nums; font-weight: 700; color: ${t.cardFg}; }
        .slw-user { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: ${t.muted}; border-radius: calc(var(--radius, 0.5rem) - 2px); }
        .slw-user-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: hsl(var(--success, 145 58% 34%)); flex-shrink: 0; box-shadow: 0 0 0 2px hsl(var(--success, 145 58% 34%) / 0.25); }
        .slw-user-email { font-size: 0.8125rem; font-weight: 500; color: ${t.mutedFg}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .slw-error { font-size: 0.75rem; color: hsl(var(--destructive)); text-align: center; }
        .slw-actions { display: flex; flex-direction: column; gap: 0.5rem; }
        .slw-btn-primary { all: unset; cursor: pointer; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 0.375rem; width: 100%; height: 2.5rem; border-radius: var(--radius, 0.5rem); background: ${t.primary}; color: ${t.primaryFg}; font-size: 0.875rem; font-weight: 600; letter-spacing: 0.01em; transition: opacity 0.12s; }
        .slw-btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .slw-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .slw-btn-ghost { all: unset; cursor: pointer; box-sizing: border-box; display: flex; align-items: center; justify-content: center; width: 100%; height: 2.25rem; border-radius: var(--radius, 0.5rem); font-size: 0.8125rem; font-weight: 500; color: ${t.mutedFg}; transition: color 0.12s, background 0.12s; }
        .slw-btn-ghost:hover { color: ${t.cardFg}; background: ${t.muted}; }
        .slw-spinner { width: 0.875rem; height: 0.875rem; border: 2px solid ${t.primaryFg}; border-top-color: transparent; border-radius: 50%; animation: slwSpin 0.6s linear infinite; }
        @keyframes slwSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="slw-card">
        <div className="slw-progress">
          <div className="slw-progress-bar" />
        </div>

        <div className="slw-body">
          <div className="slw-header">
            <div className="slw-icon" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill={t.warning}
                style={{ width: "1.125rem", height: "1.125rem" }}
              >
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="slw-heading">
              <p id="slw-title" className="slw-title">
                Still there?
              </p>
              <p id="slw-desc" className="slw-desc">
                Your session will pause in{" "}
                <span className="slw-countdown">{formatCountdown(countdown)}</span>{" "}
                due to inactivity.
              </p>
            </div>
          </div>

          {maskedEmail && (
            <div className="slw-user">
              <span className="slw-user-dot" aria-hidden="true" />
              <span className="slw-user-email">{maskedEmail}</span>
            </div>
          )}

          {extendFailed && (
            <p className="slw-error">
              Couldn&rsquo;t reach the server. Sign out and back in if this persists.
            </p>
          )}

          <div className="slw-actions">
            <button
              type="button"
              className="slw-btn-primary"
              onClick={handleContinue}
              disabled={extending}
            >
              {extending ? (
                <>
                  <span className="slw-spinner" aria-hidden="true" />
                  Extending…
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    style={{ width: "0.875rem", height: "0.875rem" }}
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h2.75a.75.75 0 0 0 0-1.5H8.75v-2.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Yes, I'm here
                </>
              )}
            </button>
            <a
              href={`/api/auth/logout?locale=${encodeURIComponent(locale)}`}
              className="slw-btn-ghost"
            >
              Sign out
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
