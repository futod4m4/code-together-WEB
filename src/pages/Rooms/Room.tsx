import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import * as monaco from "monaco-editor";
import "../../styles/Rooms/room.css";
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { useNavigate, useParams } from "react-router-dom";
import FileTree from "../../elements/FileTree";
import InfoPanel from "../../elements/InfoPanel";
import SessionPlayback from "../../elements/SessionPlayback";
import { API_URL, WS_URL } from "../../config";

import { registerLanguageCompletions } from "../../monaco-languages";

// Use local monaco-editor instead of CDN for full language support
loader.config({ monaco });
registerLanguageCompletions();

function stringToColor(str: string): string {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
    "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
    "#F8C471", "#82E0AA", "#F1948A", "#85929E", "#73C6B6",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface Participant {
  name: string;
  color: string;
  clientId: number;
}

interface ChatMessage {
  message_id?: string;
  room_id: string;
  user_id?: string;
  nickname: string;
  content: string;
  created_at: string;
}

function Room() {
  const params = useParams();
  const navigate = useNavigate();
  const joinCode = params["joinCode"];
  const ydoc = useMemo(() => new Y.Doc(), []);
  const [editor, setEditor] = useState<any | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [binding, setBinding] = useState<MonacoBinding | null>(null);
  const [language, setLanguage] = useState<string>("javascript");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [roomCodeId, setRoomCodeId] = useState("");
  const [compileResult, setCompileResult] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const editorRef = useRef<any>(null);
  const languageRef = useRef<string>("javascript");

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("Anonymous");

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [saveStatus, setSaveStatus] = useState<string>("Saved");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>("");

  const [notifications, setNotifications] = useState<{ id: number; text: string; type: string }[]>([]);
  const prevParticipantsRef = useRef<Set<number>>(new Set());
  const notifIdRef = useRef(0);

  const [sidePanelWidth, setSidePanelWidth] = useState(30);
  const isResizingRef = useRef(false);

  const [files, setFiles] = useState<any[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("editor");
  const fileContentsRef = useRef<Record<string, string>>({});

  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  // Members panel
  const [showMembers, setShowMembers] = useState(false);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [roomOwnerId, setRoomOwnerId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isGuest, setIsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Live session
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [liveStartTime, setLiveStartTime] = useState<number | null>(null);
  const [liveElapsed, setLiveElapsed] = useState("");
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Room settings
  const [showSettings, setShowSettings] = useState(false);
  const [roomDescription, setRoomDescription] = useState("");
  const [roomIsPrivate, setRoomIsPrivate] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Fetch current user - show auth modal if not logged in
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setCurrentUser(data.nickname || "Anonymous");
        setCurrentUserId(data.user_id || "");
        setAuthChecked(true);
      })
      .catch(() => {
        setShowAuthModal(true);
        setAuthChecked(true);
      });
  }, []);

  const continueAsGuest = () => {
    const guestName = "Guest_" + Math.floor(Math.random() * 1000);
    setCurrentUser(guestName);
    setIsGuest(true);
    setUserRole("viewer");
    setShowAuthModal(false);
  };

  // Fetch room data (language is immutable, comes from DB)
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`${API_URL}/room/code/${joinCode}`);
        if (!response.ok) throw new Error("Failed to fetch room data");
        const data = await response.json();
        setRoomId(data.room_id);
        setLanguage(data.language);
        languageRef.current = data.language;
        setRoomName(data.room_name);
        setRoomOwnerId(data.owner_id || "");
        setRoomDescription(data.description || "");
        setRoomIsPrivate(data.is_private || false);
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };
    fetchRoomData();
  }, [joinCode]);

  // Fetch room code ID
  useEffect(() => {
    if (!roomId) return;
    fetch(`${API_URL}/room_code/code/${roomId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch room code ID");
        return res.json();
      })
      .then((data) => setRoomCodeId(data))
      .catch((error) => console.error("Error fetching room code ID:", error));
  }, [roomId]);

  // Fetch files for room
  useEffect(() => {
    if (!roomId) return;
    fetch(`${API_URL}/files/room/${roomId}`)
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFiles(data);
          for (const f of data) {
            fileContentsRef.current[f.file_id] = f.content || "";
          }
          if (!activeFileId) setActiveFileId(data[0].file_id);
        }
      })
      .catch(() => {});
  }, [roomId]);

  // Switch file
  const switchToFile = useCallback((fileId: string) => {
    if (!editor || fileId === activeFileId) return;

    // Save current file content
    if (activeFileId) {
      fileContentsRef.current[activeFileId] = editor.getValue();
      const currentFile = files.find((f) => f.file_id === activeFileId);
      if (currentFile) {
        fetch(`${API_URL}/files/${activeFileId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editor.getValue(), language: currentFile.language }),
        }).catch(() => {});
      }
    }

    // Update syntax highlighting for new file
    const newFile = files.find((f) => f.file_id === fileId);
    if (newFile) {
      const extToLang: Record<string, string> = {
        ".js": "javascript", ".ts": "typescript", ".py": "python", ".java": "java",
        ".go": "go", ".rs": "rust", ".php": "php", ".json": "json",
        ".html": "html", ".css": "css", ".md": "markdown",
      };
      const ext = "." + newFile.filename.split(".").pop();
      const fileLang = extToLang[ext] || newFile.language || languageRef.current;
      updateEditorLanguage(fileLang);
    }

    // Setting activeFileId triggers MonacoBinding re-creation with new Yjs text
    setActiveFileId(fileId);
  }, [editor, activeFileId, files]);

  // Check ownership + fetch user's role in this room
  useEffect(() => {
    if (currentUserId && roomOwnerId) {
      setIsOwner(currentUserId === roomOwnerId);
    }
    // Determine role from members list
    if (currentUserId && roomMembers.length > 0) {
      const me = roomMembers.find((m) => m.user_id === currentUserId);
      if (me) {
        setUserRole(me.role);
      }
    }
  }, [currentUserId, roomOwnerId, roomMembers]);

  // Fetch room members
  const fetchMembers = useCallback(() => {
    if (!roomId) return;
    fetch(`${API_URL}/members/${roomId}`, { credentials: "include" })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => { if (Array.isArray(data)) setRoomMembers(data); })
      .catch(() => {});
  }, [roomId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const changeMemberRole = async (userId: string, role: string) => {
    if (!roomId) return;
    await fetch(`${API_URL}/members/${roomId}/role`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, role }),
    });
    fetchMembers();
  };

  const kickMember = async (userId: string) => {
    if (!roomId) return;
    // Remove from members
    await fetch(`${API_URL}/members/${roomId}/${userId}`, {
      method: "DELETE", credentials: "include",
    });
    // Signal kick via Yjs
    const kickMap = ydoc.getMap<string>("kicked");
    kickMap.set(userId, Date.now().toString());
    fetchMembers();
    addNotification("Member kicked", "leave");
  };

  const banMember = async (userId: string, nickname: string) => {
    if (!roomId || !window.confirm(`Ban ${nickname} from this project?`)) return;
    await fetch(`${API_URL}/bans/user`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: roomId, user_id: userId, reason: "Banned by owner" }),
    });
    // Also kick
    const kickMap = ydoc.getMap<string>("kicked");
    kickMap.set(userId, Date.now().toString());
    fetchMembers();
    addNotification(`${nickname} banned`, "leave");
  };

  const kickGuest = (clientId: number) => {
    const kickMap = ydoc.getMap<string>("kicked");
    kickMap.set(`guest_${clientId}`, Date.now().toString());
    addNotification("Guest kicked", "leave");
  };

  const setGuestRole = (clientId: number, role: string) => {
    const guestRolesMap = ydoc.getMap<string>("guestRoles");
    guestRolesMap.set(clientId.toString(), role);
  };

  const saveRoomSettings = async () => {
    if (!roomId) return;
    setSettingsSaving(true);
    try {
      await fetch(`${API_URL}/room/${roomId}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_name: roomName, description: roomDescription, is_private: roomIsPrivate }),
      });
      addNotification("Settings saved", "join");
      setShowSettings(false);
    } catch {} finally {
      setSettingsSaving(false);
    }
  };

  // Live session controls
  const startLiveSession = async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`${API_URL}/sessions/start`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, title: `${roomName} - Live` }),
      });
      if (res.ok) {
        const sess = await res.json();
        setLiveSessionId(sess.session_id);
        setIsLive(true);
        setLiveStartTime(Date.now());
        addNotification("Live session started", "join");
        // Start snapshot interval (every 10s)
        snapshotIntervalRef.current = setInterval(() => {
          if (!editor) return;
          fetch(`${API_URL}/sessions/snapshot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sess.session_id,
              code: editor.getValue(),
              language,
              filename: files.find((f) => f.file_id === activeFileId)?.filename || "main",
              timestamp_ms: Date.now() - (liveStartTime || Date.now()),
            }),
          }).catch(() => {});
        }, 10000);
      }
    } catch {}
  };

  const stopLiveSession = async () => {
    if (!liveSessionId) return;
    // Save final snapshot
    if (editor) {
      await fetch(`${API_URL}/sessions/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: liveSessionId,
          code: editor.getValue(),
          language,
          filename: files.find((f) => f.file_id === activeFileId)?.filename || "main",
          timestamp_ms: Date.now() - (liveStartTime || Date.now()),
        }),
      }).catch(() => {});
    }
    await fetch(`${API_URL}/sessions/stop/${liveSessionId}`, {
      method: "POST", credentials: "include",
    }).catch(() => {});
    if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
    setIsLive(false);
    setLiveSessionId(null);
    setLiveStartTime(null);
    addNotification("Live session ended", "leave");
  };

  // Live elapsed timer
  useEffect(() => {
    if (!isLive || !liveStartTime) return;
    const timer = setInterval(() => {
      const elapsed = Date.now() - liveStartTime;
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      setLiveElapsed(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive, liveStartTime]);

  // Update viewer count during live session
  useEffect(() => {
    if (!isLive || !liveSessionId) return;
    fetch(`${API_URL}/sessions/viewers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: liveSessionId, count: participants.length }),
    }).catch(() => {});
  }, [participants.length, isLive, liveSessionId]);

  // Load chat history from DB
  useEffect(() => {
    if (!roomId) return;
    fetch(`${API_URL}/chat/${roomId}?limit=50`)
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setChatMessages(data);
      })
      .catch(() => {});
  }, [roomId]);

  // WebSocket + Yjs provider + Awareness (no language sync - language is immutable)
  useEffect(() => {
    const wsProvider = new WebsocketProvider(
      `${WS_URL}/room/join/${joinCode}`,
      "monaco-react-2",
      ydoc
    );
    setProvider(wsProvider);

    const userColor = stringToColor(currentUser);
    wsProvider.awareness.setLocalStateField("user", {
      name: currentUser,
      color: userColor,
    });

    const updateParticipants = () => {
      const states = wsProvider.awareness.getStates();
      const users: Participant[] = [];
      states.forEach((state, clientId) => {
        if (state.user) {
          users.push({
            name: state.user.name,
            color: state.user.color,
            clientId,
          });
        }
      });
      setParticipants(users);
    };

    wsProvider.awareness.on("change", updateParticipants);
    updateParticipants();

    // Chat sync via Yjs Array (for real-time between connected clients)
    const chatArray = ydoc.getArray<ChatMessage>("chat");
    const syncChat = () => {
      const msgs = chatArray.toArray();
      setChatMessages((prev) => {
        const merged = [...prev];
        for (const msg of msgs) {
          const exists = merged.some(
            (m) => m.content === msg.content && m.nickname === msg.nickname && m.created_at === msg.created_at
          );
          if (!exists) merged.push(msg);
        }
        return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });
    };
    chatArray.observe(syncChat);

    // Guest role management via Yjs Map (owner assigns, guests read)
    const guestRolesMap = ydoc.getMap<string>("guestRoles");
    const syncGuestRole = () => {
      const myClientId = ydoc.clientID.toString();
      const myRole = guestRolesMap.get(myClientId);
      if (typeof myRole === "string") {
        setUserRole(myRole);
      }
    };
    guestRolesMap.observe(syncGuestRole);
    syncGuestRole();

    // Kick detection: if owner sets "kicked" flag for this user, redirect
    const kickMap = ydoc.getMap<string>("kicked");
    kickMap.observe(() => {
      // Check if kicked by user_id
      if (currentUserId && kickMap.has(currentUserId)) {
        alert("You have been removed from this project.");
        window.location.href = "/";
      }
      // Check if kicked as guest by clientId
      if (kickMap.has(`guest_${ydoc.clientID}`)) {
        alert("You have been removed from this project.");
        window.location.href = "/";
      }
    });

    return () => {
      wsProvider.awareness.off("change", updateParticipants);
      wsProvider?.destroy();
      ydoc.destroy();
    };
  }, [ydoc, joinCode, currentUser]);

  // Monaco binding — per-file Yjs text
  useEffect(() => {
    if (!provider || !editor) return;
    const fileKey = activeFileId || "default";
    const ytext = ydoc.getText(`file:${fileKey}`);

    // If Yjs text is empty and we have cached content, initialize it
    if (ytext.length === 0 && activeFileId) {
      const cached = fileContentsRef.current[activeFileId];
      if (cached) {
        ytext.insert(0, cached);
      }
    }

    const newBinding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      provider?.awareness
    );
    setBinding(newBinding);
    return () => {
      newBinding.destroy();
    };
  }, [ydoc, provider, editor, activeFileId]);

  // Inject dynamic cursor styles per user (colors + nickname labels)
  useEffect(() => {
    const styleId = "yjs-cursor-styles";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const css = participants
      .filter((p) => p.clientId !== ydoc.clientID)
      .map((p) => {
        const c = p.color;
        return `
.yRemoteSelection-${p.clientId} { background-color: ${c}40 !important; }
.yRemoteSelectionHead-${p.clientId} {
  border-left: 2px solid ${c} !important;
}
.yRemoteSelectionHead-${p.clientId}::after {
  background: ${c} !important;
  border: 2px solid ${c} !important;
}
.yRemoteSelectionHead-${p.clientId}::before {
  content: "${p.name}" !important;
  background: ${c} !important;
  color: #000 !important;
}`;
      })
      .join("\n");

    styleEl.textContent = css;

    return () => {
      if (styleEl) styleEl.textContent = "";
    };
  }, [participants, ydoc.clientID]);

  // Set editor language once room data loads
  useEffect(() => {
    if (editor && language) {
      updateEditorLanguage(language);
    }
  }, [editor, language]);

  // Auto-save
  useEffect(() => {
    if (!editor || !roomCodeId) return;
    const model = editor.getModel();
    if (!model) return;

    const disposable = model.onDidChangeContent(() => {
      setSaveStatus("Unsaved");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const content = model.getValue();
        if (content !== lastSavedContentRef.current) {
          autoSave(content);
        }
      }, 3000);
    });

    return () => {
      disposable.dispose();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [editor, roomCodeId]);

  const autoSave = async (content: string) => {
    setSaveStatus("Saving...");
    try {
      if (roomCodeId) {
        await fetch(`${API_URL}/room_code/${roomCodeId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: content }),
        });
      }
      if (activeFileId && files.length > 0) {
        fileContentsRef.current[activeFileId] = content;
        const activeFile = files.find((f) => f.file_id === activeFileId);
        await fetch(`${API_URL}/files/${activeFileId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, language: activeFile?.language || language }),
        });
      }
      lastSavedContentRef.current = content;
      setSaveStatus("Saved");
    } catch {
      setSaveStatus("Save failed");
    }
  };

  // Notifications
  const addNotification = useCallback((text: string, type: string = "join") => {
    const id = ++notifIdRef.current;
    setNotifications((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const currentIds = new Set(participants.map((p) => p.clientId));
    const prevIds = prevParticipantsRef.current;
    if (prevIds.size > 0) {
      for (const p of participants) {
        if (!prevIds.has(p.clientId)) addNotification(`${p.name} joined`, "join");
      }
      for (const id of prevIds) {
        if (!currentIds.has(id)) addNotification("Someone left", "leave");
      }
    }
    prevParticipantsRef.current = currentIds;
  }, [participants, addNotification]);

  // Resizable panel
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const containerWidth = document.querySelector(".editor-container")?.clientWidth || window.innerWidth;
      const newWidth = ((containerWidth - ev.clientX) / containerWidth) * 100;
      setSidePanelWidth(Math.max(15, Math.min(60, newWidth)));
    };
    const onMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  const downloadCode = () => {
    if (!editor) return;
    const code = editor.getValue();
    const ext: Record<string, string> = {
      javascript: ".js", python: ".py", java: ".java",
      go: ".go", rust: ".rs", php: ".php",
    };
    const filename = "code" + (ext[language] || ".txt");
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export all files as ZIP
  const exportAsZip = async () => {
    // Save current editor content first
    if (editor && activeFileId) {
      fileContentsRef.current[activeFileId] = editor.getValue();
    }
    // Dynamically import JSZip
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const f of files) {
      const content = fileContentsRef.current[f.file_id] ?? f.content ?? "";
      zip.file(f.filename, content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${roomName || "project"}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification("Project exported", "join");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (editor && roomCodeId) {
          autoSave(editor.getValue());
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        compileCode("run");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, roomCodeId]);

  // File management
  const handleCreateFile = async (filename: string, fileLang: string) => {
    if (!roomId) return;
    if (files.length >= 10) {
      addNotification("Max 10 files per project", "leave");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/files/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, filename, language: fileLang, content: "" }),
      });
      if (res.ok) {
        const newFile = await res.json();
        fileContentsRef.current[newFile.file_id] = newFile.content || "";
        setFiles((prev) => [...prev, newFile]);
        if (editor && activeFileId) {
          fileContentsRef.current[activeFileId] = editor.getValue();
        }
        setActiveFileId(newFile.file_id);
        if (editor) editor.setValue("");
      }
    } catch (err) {
      console.error("Error creating file:", err);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (files.length <= 1) {
      addNotification("Cannot delete last file", "leave");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setFiles((prev) => {
          const updated = prev.filter((f) => f.file_id !== fileId);
          if (activeFileId === fileId && updated.length > 0) {
            setActiveFileId(updated[0].file_id);
          }
          return updated;
        });
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      const res = await fetch(`${API_URL}/files/${fileId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: newName }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFiles((prev) => prev.map((f) => (f.file_id === fileId ? updated : f)));
      }
    } catch (err) {
      console.error("Error renaming file:", err);
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${joinCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const updateEditorLanguage = async (lang: string) => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const monaco = await loader.init();
        monaco.editor.setModelLanguage(model, lang);
      }
    }
  };

  const termLog = useCallback((line: string) => {
    setTerminalOutput((prev) => [...prev, line]);
    setShowTerminal(true);
  }, []);

  const clearTerminal = useCallback(() => {
    setTerminalOutput([]);
  }, []);

  const compileCode = async (mode: string = "run") => {
    if (!editor) return;
    setIsCompiling(true);
    setShowTerminal(true);
    const code = editor.getValue();
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    termLog(`[${timestamp}] ${mode === "test" ? "Running tests..." : "Running code..."}`);

    let testCode = "";
    if (mode === "test") {
      const testFile = files.find(
        (f) => f.filename.includes("test") || f.filename.includes("Test") || f.filename.startsWith("test_")
      );
      if (testFile) {
        testCode = fileContentsRef.current[testFile.file_id] || testFile.content || "";
      } else {
        termLog("Error: No test file found. Create a file with 'test' in the name.");
        setCompileResult("No test file found.");
        setIsCompiling(false);
        return;
      }
    }

    try {
      // Save current file content before compiling
      if (activeFileId) {
        fileContentsRef.current[activeFileId] = code;
      }
      // Collect all project files for multi-file compilation
      const projectFiles = files.map((f) => ({
        filename: f.filename,
        content: f.file_id === activeFileId ? code : (fileContentsRef.current[f.file_id] ?? f.content ?? ""),
      }));

      const body: any = { code, language, mode, files: projectFiles };
      if (mode === "test") body.test_code = testCode;

      const response = await fetch(`${API_URL}/room_code/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (result.error) {
        const output = `${result.output ? result.output + "\n" : ""}Error: ${result.error}`;
        setCompileResult(output);
        termLog(output);
      } else {
        setCompileResult(result.output);
        termLog(result.output || "(no output)");
      }
    } catch (error: any) {
      const msg = `Error: ${error.message}`;
      setCompileResult(msg);
      termLog(msg);
    } finally {
      setIsCompiling(false);
      termLog("---");
    }
  };

  // Chat
  const sendChatMessage = () => {
    if (!chatInput.trim() || !roomId) return;
    const msg: ChatMessage = {
      room_id: roomId,
      nickname: currentUser,
      content: chatInput.trim(),
      created_at: new Date().toISOString(),
    };

    // Add to local state immediately
    setChatMessages((prev) => [...prev, msg]);

    // Sync via Yjs for other connected clients
    const chatArray = ydoc.getArray<ChatMessage>("chat");
    chatArray.push([msg]);

    // Persist to backend
    fetch(`${API_URL}/chat/send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: roomId, content: msg.content }),
    }).catch(() => {});

    setChatInput("");
  };

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    }
  }, [chatMessages, isChatOpen]);

  useEffect(() => {
    if (showTerminal) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalOutput, showTerminal]);

  useEffect(() => {
    if (!isChatOpen && chatMessages.length > 0) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [chatMessages.length]);

  const handleEditorMount = (editorInstance: any) => {
    setEditor(editorInstance);
    editorRef.current = editorInstance;
  };

  if (showAuthModal) {
    return (
      <div className="auth-modal-overlay">
        <div className="auth-modal">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: '0 0 8px 0' }}>
            Join Project
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 24px 0' }}>
            Sign in for full access or continue as a guest viewer
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" style={{ width: '100%' }}
              onClick={() => navigate(`/login?redirect=/room/${joinCode}`)}>
              Sign in
            </button>
            <button className="btn" style={{ width: '100%' }}
              onClick={() => navigate(`/registration?redirect=/room/${joinCode}`)}>
              Create account
            </button>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={continueAsGuest}>
              Continue as guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-container">
      <header>
        <div className="header-content">
          <span className="header-logo" onClick={() => navigate("/")}>CodeCollab</span>
          <span className="room-lang-badge">{language}</span>
          <h1 className="room-name">{roomName}</h1>
          <span className="room-code-label">{joinCode}</span>

          <div className="participants">
            {participants.map((p) => (
              <div
                key={p.clientId}
                className="participant-avatar"
                style={{ backgroundColor: p.color }}
                title={p.name}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
            ))}
            <span className="participant-count">{participants.length}</span>
          </div>

          <div className="header-controls">
            <span className="save-status">{saveStatus}</span>
            <button className="hdr-btn run" onClick={() => compileCode("run")} disabled={isCompiling}>
              {isCompiling ? "..." : "Run"}
            </button>
            <button className="hdr-btn" onClick={() => compileCode("test")} disabled={isCompiling}>Test</button>
            <button className="hdr-btn" onClick={files.length > 1 ? exportAsZip : downloadCode}>
              {files.length > 1 ? "ZIP" : "Download"}
            </button>
            <button className="hdr-btn" onClick={copyRoomLink}>{copied ? "Copied!" : "Share"}</button>
            <button className="hdr-btn" onClick={() => setIsDarkTheme((p) => !p)}>
              {isDarkTheme ? "Light" : "Dark"}
            </button>
            {isLive && (
              <span className="live-indicator">
                <span className="live-dot" /> LIVE {liveElapsed} ({participants.length})
              </span>
            )}
            {isOwner && !isLive && (
              <button className="hdr-btn live-btn" onClick={startLiveSession}>Go Live</button>
            )}
            {isOwner && isLive && (
              <button className="hdr-btn" onClick={stopLiveSession}>Stop</button>
            )}
            {isOwner && (<>
              <button className="hdr-btn" onClick={() => setShowSettings(!showSettings)}>Settings</button>
              <button className="hdr-btn" onClick={() => setShowSessions(!showSessions)}>Sessions</button>
            </>)}
            <button className="hdr-btn" onClick={() => setShowMembers(!showMembers)}>
              Members
            </button>
            <button className="hdr-btn" onClick={() => setShowInfo(!showInfo)}>?</button>
            <button
              className="hdr-btn chat-toggle"
              onClick={() => { setIsChatOpen(!isChatOpen); setUnreadCount(0); }}
            >
              Chat {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <div className="notifications">
        {notifications.map((n) => (
          <div key={n.id} className={`notification-toast ${n.type}`}>{n.text}</div>
        ))}
      </div>

      <main className="editor-container">
        <FileTree
          files={files}
          activeFileId={activeFileId}
          onSelectFile={switchToFile}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
          maxFiles={10}
          readOnly={userRole === "viewer"}
        />
        <div className="editor-wrapper">
          <Editor
            height="100%"
            width="100%"
            language={language}
            theme={isDarkTheme ? "vs-dark" : "light"}
            options={{
              wordWrap: "off",
              minimap: { enabled: false },
              readOnly: userRole === "viewer",
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
            }}
            onMount={handleEditorMount}
          />
        </div>
        <div className="resize-handle" onMouseDown={handleResizeStart} />
        <div className="side-panel" style={{ width: `${sidePanelWidth}%` }}>
          <div className="panel-tabs">
            <button className={`panel-tab ${!showTerminal ? "active" : ""}`} onClick={() => setShowTerminal(false)}>
              Output
            </button>
            <button className={`panel-tab ${showTerminal ? "active" : ""}`} onClick={() => setShowTerminal(true)}>
              Terminal
            </button>
          </div>

          {!showTerminal && (
            <div className="compilation-panel">
              <div className="result-content">
                {isCompiling ? (
                  <p className="compiling">Running...</p>
                ) : compileResult ? (
                  <pre>{compileResult}</pre>
                ) : (
                  <p className="no-result">No result yet.</p>
                )}
              </div>
            </div>
          )}

          {showTerminal && (
            <div className="terminal-panel">
              <div className="terminal-toolbar">
                <button className="terminal-clear" onClick={clearTerminal}>Clear</button>
              </div>
              <div className="terminal-output">
                {terminalOutput.map((line, i) => (
                  <div key={i} className={`terminal-line ${line.startsWith("Error") ? "error" : ""}`}>{line}</div>
                ))}
                {terminalOutput.length === 0 && (
                  <div className="terminal-line muted">Terminal ready. Click Run or Test to see output.</div>
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}

          {showInfo && <InfoPanel language={language} onClose={() => setShowInfo(false)} />}

          {showSessions && roomId && (
            <SessionPlayback roomId={roomId} onClose={() => setShowSessions(false)} />
          )}

          {showSettings && (
            <div className="settings-panel">
              <div className="chat-header">
                <h3>Project Settings</h3>
                <button className="chat-close" onClick={() => setShowSettings(false)}>x</button>
              </div>
              <div className="settings-body">
                <div className="form-group">
                  <label className="form-label">Project name</label>
                  <input className="settings-input" value={roomName}
                    onChange={(e) => setRoomName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="settings-input" value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    placeholder="Project description..." />
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" checked={roomIsPrivate}
                    onChange={(e) => setRoomIsPrivate(e.target.checked)} />
                  <span>Private (invite only)</span>
                </label>
                <button className="hdr-btn run" onClick={saveRoomSettings} disabled={settingsSaving}
                  style={{ width: '100%', marginTop: 8 }}>
                  {settingsSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}

          {showMembers && (
            <div className="members-panel">
              <div className="chat-header">
                <h3>Members ({roomMembers.length})</h3>
                <button className="chat-close" onClick={() => setShowMembers(false)}>x</button>
              </div>
              <div className="members-list">
                {roomMembers.map((m) => (
                  <div key={m.user_id} className="member-item">
                    <div className="member-avatar" style={{ backgroundColor: stringToColor(m.nickname) }}>
                      {m.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <span className="member-name">{m.nickname}</span>
                      <span className={`member-role role-${m.role}`}>{m.role}</span>
                    </div>
                    {isOwner && m.role !== "owner" && (
                      <div className="member-actions">
                        <select
                          value={m.role}
                          onChange={(e) => changeMemberRole(m.user_id, e.target.value)}
                          className="role-select"
                        >
                          <option value="editor">editor</option>
                          <option value="viewer">viewer</option>
                        </select>
                        <button className="kick-btn" onClick={() => kickMember(m.user_id)} title="Kick">K</button>
                        <button className="kick-btn ban" onClick={() => banMember(m.user_id, m.nickname)} title="Ban">B</button>
                      </div>
                    )}
                  </div>
                ))}
                {/* Online participants not in members (guests) */}
                {participants
                  .filter((p) => !roomMembers.some((m) => m.nickname === p.name) && p.clientId !== ydoc.clientID)
                  .map((p) => {
                    const guestRole = ydoc.getMap<string>("guestRoles").get(p.clientId.toString()) || "viewer";
                    return (
                      <div key={p.clientId} className="member-item">
                        <div className="member-avatar" style={{ backgroundColor: p.color }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{p.name}</span>
                          <span className={`member-role role-${guestRole === "editor" ? "editor" : "guest"}`}>
                            {guestRole === "editor" ? "editor" : "guest"}
                          </span>
                        </div>
                        {isOwner && (
                          <div className="member-actions">
                            <select
                              value={guestRole}
                              onChange={(e) => setGuestRole(p.clientId, e.target.value)}
                              className="role-select"
                            >
                              <option value="viewer">viewer</option>
                              <option value="editor">editor</option>
                            </select>
                            <button className="kick-btn" onClick={() => kickGuest(p.clientId)} title="Kick">K</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {isChatOpen && (
            <div className="chat-panel">
              <div className="chat-header">
                <h3>Chat</h3>
                <button className="chat-close" onClick={() => setIsChatOpen(false)}>x</button>
              </div>
              <div className="chat-messages">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.nickname === currentUser ? "own" : ""}`}>
                    <span className="chat-nickname" style={{ color: stringToColor(msg.nickname) }}>
                      {msg.nickname}
                    </span>
                    <span className="chat-content">{msg.content}</span>
                    <span className="chat-time">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-area">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage(); }}
                  placeholder="Type a message..."
                  className="chat-input"
                />
                <button className="hdr-btn" onClick={sendChatMessage}>Send</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Room;
