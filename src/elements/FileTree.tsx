import React, { useState, useMemo } from "react";
import "../styles/filetree.css";

interface FileItem {
  file_id: string;
  filename: string;
  language: string;
  is_entry_point: boolean;
}

interface FileTreeProps {
  files: FileItem[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (filename: string, language: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  maxFiles: number;
  readOnly?: boolean;
}

const extensionToLanguage: Record<string, string> = {
  ".js": "javascript", ".ts": "typescript", ".py": "python",
  ".java": "java", ".go": "go", ".rs": "rust",
  ".php": "php", ".txt": "plaintext", ".json": "json",
  ".md": "markdown", ".html": "html", ".css": "css",
};

function getLanguageFromFilename(filename: string): string {
  const ext = "." + filename.split(".").pop();
  return extensionToLanguage[ext] || "plaintext";
}

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const icons: Record<string, string> = {
    js: "JS", ts: "TS", py: "PY", java: "JV", go: "GO",
    rs: "RS", php: "PH", json: "{}", md: "MD", html: "<>", css: "#",
  };
  return icons[ext] || "F";
}

interface TreeNode {
  name: string;
  path: string;
  file?: FileItem;
  children: Map<string, TreeNode>;
}

function buildTree(files: FileItem[]): TreeNode {
  const root: TreeNode = { name: "", path: "", children: new Map() };
  for (const file of files) {
    const parts = file.filename.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          children: new Map(),
        });
      }
      const node = current.children.get(part)!;
      if (isFile) {
        node.file = file;
      }
      current = node;
    }
  }
  return root;
}

function FolderNode({
  node, depth, activeFileId, onSelectFile, onDeleteFile, onRenameFile, readOnly,
  renamingId, setRenamingId, renameValue, setRenameValue, handleRename,
}: {
  node: TreeNode; depth: number; activeFileId: string | null;
  onSelectFile: (id: string) => void; onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, name: string) => void; readOnly: boolean;
  renamingId: string | null; setRenamingId: (id: string | null) => void;
  renameValue: string; setRenameValue: (v: string) => void;
  handleRename: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const isFolder = !node.file && node.children.size > 0;
  const children = Array.from(node.children.values()).sort((a, b) => {
    const aIsFolder = !a.file && a.children.size > 0;
    const bIsFolder = !b.file && b.children.size > 0;
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  if (isFolder) {
    return (
      <>
        <div
          className="file-tree-item folder"
          style={{ paddingLeft: 12 + depth * 14 }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="folder-arrow">{collapsed ? ">" : "v"}</span>
          <span className="folder-icon">D</span>
          <span className="file-name">{node.name}</span>
        </div>
        {!collapsed && children.map((child) => (
          <FolderNode key={child.path} node={child} depth={depth + 1}
            activeFileId={activeFileId} onSelectFile={onSelectFile}
            onDeleteFile={onDeleteFile} onRenameFile={onRenameFile}
            readOnly={readOnly} renamingId={renamingId}
            setRenamingId={setRenamingId} renameValue={renameValue}
            setRenameValue={setRenameValue} handleRename={handleRename} />
        ))}
      </>
    );
  }

  if (node.file) {
    const file = node.file;
    return (
      <div
        className={`file-tree-item ${activeFileId === file.file_id ? "active" : ""}`}
        style={{ paddingLeft: 12 + depth * 14 }}
        onClick={() => onSelectFile(file.file_id)}
      >
        {renamingId === file.file_id ? (
          <input type="text" value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename(file.file_id);
              if (e.key === "Escape") setRenamingId(null);
            }}
            onBlur={() => setRenamingId(null)}
            className="file-tree-input" autoFocus
            onClick={(e) => e.stopPropagation()} />
        ) : (
          <>
            <span className="file-icon">{getFileIcon(file.filename)}</span>
            <span className="file-name">{node.name}</span>
            {file.is_entry_point && <span className="entry-badge">entry</span>}
            {!readOnly && (
              <div className="file-actions">
                <button className="file-action-btn" onClick={(e) => {
                  e.stopPropagation();
                  setRenamingId(file.file_id);
                  setRenameValue(file.filename);
                }} title="Rename">R</button>
                <button className="file-action-btn delete" onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete ${file.filename}?`)) onDeleteFile(file.file_id);
                }} title="Delete">x</button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Folder with no children yet — render children if any
  return (
    <>
      {children.map((child) => (
        <FolderNode key={child.path} node={child} depth={depth}
          activeFileId={activeFileId} onSelectFile={onSelectFile}
          onDeleteFile={onDeleteFile} onRenameFile={onRenameFile}
          readOnly={readOnly} renamingId={renamingId}
          setRenamingId={setRenamingId} renameValue={renameValue}
          setRenameValue={setRenameValue} handleRename={handleRename} />
      ))}
    </>
  );
}

function FileTree({
  files, activeFileId, onSelectFile, onCreateFile,
  onDeleteFile, onRenameFile, maxFiles, readOnly = false,
}: FileTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const tree = useMemo(() => buildTree(files), [files]);

  const handleCreate = () => {
    if (!newFileName.trim()) return;
    const lang = getLanguageFromFilename(newFileName);
    onCreateFile(newFileName.trim(), lang);
    setNewFileName("");
    setIsCreating(false);
  };

  const handleRename = (fileId: string) => {
    if (!renameValue.trim()) return;
    onRenameFile(fileId, renameValue.trim());
    setRenamingId(null);
    setRenameValue("");
  };

  const rootChildren = Array.from(tree.children.values()).sort((a, b) => {
    const aIsFolder = !a.file && a.children.size > 0;
    const bIsFolder = !b.file && b.children.size > 0;
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <span className="file-tree-title">Files</span>
        {!readOnly && files.length < maxFiles && (
          <button className="file-tree-add" onClick={() => setIsCreating(!isCreating)} title="New file">+</button>
        )}
      </div>

      {isCreating && (
        <div className="file-tree-new">
          <input type="text" value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setIsCreating(false);
            }}
            placeholder="path/filename.js"
            className="file-tree-input" autoFocus />
        </div>
      )}

      <div className="file-tree-list">
        {rootChildren.map((node) => (
          <FolderNode key={node.path} node={node} depth={0}
            activeFileId={activeFileId} onSelectFile={onSelectFile}
            onDeleteFile={onDeleteFile} onRenameFile={onRenameFile}
            readOnly={readOnly} renamingId={renamingId}
            setRenamingId={setRenamingId} renameValue={renameValue}
            setRenameValue={setRenameValue} handleRename={handleRename} />
        ))}
      </div>

      <div className="file-tree-count">{files.length}/{maxFiles} files</div>
    </div>
  );
}

export default FileTree;
