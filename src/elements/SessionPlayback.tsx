import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../config";

interface Session {
  session_id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  max_viewers: number;
}

interface Snapshot {
  snapshot_id: string;
  code: string;
  language: string;
  filename: string;
  timestamp_ms: number;
}

interface Props {
  roomId: string;
  onClose: () => void;
}

function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}:${s.toString().padStart(2, "0")}`;
}

function SessionPlayback({ roomId, onClose }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/sessions/room/${roomId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [roomId]);

  const loadSession = async (sessionId: string) => {
    setSelectedSession(sessionId);
    setCurrentIdx(0);
    setPlaying(false);
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}/snapshots`);
      const data = await res.json();
      setSnapshots(Array.isArray(data) ? data : []);
    } catch {
      setSnapshots([]);
    }
  };

  const play = () => {
    if (snapshots.length < 2) return;
    setPlaying(true);
    let idx = currentIdx;
    timerRef.current = setInterval(() => {
      idx++;
      if (idx >= snapshots.length) {
        setPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      setCurrentIdx(idx);
    }, 1500);
  };

  const pause = () => {
    setPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const currentSnap = snapshots[currentIdx];

  if (selectedSession && snapshots.length > 0) {
    return (
      <div className="playback-panel">
        <div className="info-header">
          <h3>Playback</h3>
          <button className="info-close" onClick={() => setSelectedSession(null)}>x</button>
        </div>
        <div className="playback-controls">
          <button className="hdr-btn" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={playing}>
            &lt;
          </button>
          {playing ? (
            <button className="hdr-btn" onClick={pause}>Pause</button>
          ) : (
            <button className="hdr-btn run" onClick={play}>Play</button>
          )}
          <button className="hdr-btn" onClick={() => setCurrentIdx(Math.min(snapshots.length - 1, currentIdx + 1))} disabled={playing}>
            &gt;
          </button>
          <span className="playback-counter">
            {currentIdx + 1}/{snapshots.length}
          </span>
          {currentSnap && (
            <span className="playback-time">{formatDuration(currentSnap.timestamp_ms)}</span>
          )}
        </div>
        <div className="playback-code">
          <div className="playback-filename">{currentSnap?.filename || "main"}</div>
          <pre className="playback-pre">{currentSnap?.code || ""}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="playback-panel">
      <div className="info-header">
        <h3>Sessions</h3>
        <button className="info-close" onClick={onClose}>x</button>
      </div>
      <div className="sessions-list">
        {sessions.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 12, padding: "8px 12px", fontFamily: "var(--font-mono)" }}>
            No recorded sessions yet. Click "Go Live" to start recording.
          </p>
        )}
        {sessions.map((s) => (
          <div
            key={s.session_id}
            className="session-item"
            onClick={() => loadSession(s.session_id)}
          >
            <div className="session-item-header">
              <span className="session-title">{s.title}</span>
              {s.is_active && <span className="session-live-badge">LIVE</span>}
            </div>
            <div className="session-item-meta">
              <span>{new Date(s.started_at).toLocaleString()}</span>
              <span>{s.max_viewers} viewers</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SessionPlayback;
