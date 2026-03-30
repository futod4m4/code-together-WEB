import React from "react";

interface InfoPanelProps {
  language: string;
  onClose: () => void;
}

const shortcuts = [
  { keys: "Ctrl + S", action: "Save" },
  { keys: "Ctrl + Enter", action: "Run code" },
  { keys: "Ctrl + Space", action: "Autocomplete" },
  { keys: "Ctrl + /", action: "Toggle comment" },
  { keys: "Ctrl + D", action: "Select next occurrence" },
  { keys: "Ctrl + Shift + K", action: "Delete line" },
  { keys: "Alt + Up/Down", action: "Move line" },
  { keys: "Ctrl + Shift + F", action: "Format selection" },
  { keys: "Ctrl + G", action: "Go to line" },
  { keys: "Ctrl + F", action: "Find" },
  { keys: "Ctrl + H", action: "Find & replace" },
];

const languageTips: Record<string, { title: string; tips: string[] }> = {
  go: {
    title: "Go",
    tips: [
      'Module name is "project" — import subpackages as "project/pkg"',
      "Example: file sum/sum.go with package sum → import \"project/sum\"",
      "Call exported functions with package qualifier: sum.Sum()",
      "Entry point: main.go with package main + func main()",
      "go.mod is created automatically, no need to add it",
      "Uppercase first letter = exported (public)",
      "Use := for short variable declarations",
    ],
  },
  javascript: {
    title: "JavaScript",
    tips: [
      "Entry point: index.js (or main.js)",
      "Use require() for imports between files: const utils = require('./utils')",
      "module.exports = { fn } to export functions",
      "console.log() for output",
      "Node.js runtime — no browser APIs (no document, window)",
      "ES modules (import/export) not supported — use require/exports",
    ],
  },
  python: {
    title: "Python",
    tips: [
      "Entry point: main.py",
      "Import from other files: from utils import my_function",
      "Use if __name__ == '__main__': for entry guard",
      "print() for output",
      "All .py files in root are importable by name",
      "No pip packages available — only standard library",
    ],
  },
  java: {
    title: "Java",
    tips: [
      "Entry point: Main.java with public class Main + main()",
      "All .java files are compiled together",
      "Class name must match filename (Main.java → class Main)",
      "System.out.println() for output",
      "No external libraries — only JDK standard library",
      "Subfolders = packages (use package declaration)",
    ],
  },
  rust: {
    title: "Rust",
    tips: [
      "Entry point: main.rs with fn main()",
      "println!() macro for output (note the !)",
      "Single-file compilation only (no Cargo project)",
      "Use mod keyword for inline modules",
      "No external crates — only std library",
      "Variables are immutable by default — use mut",
    ],
  },
  php: {
    title: "PHP",
    tips: [
      "Entry point: index.php (or main.php)",
      'Start files with <?php',
      "echo or print for output",
      "require/include for importing other files",
      "Use require_once to avoid double-loading",
      "No Composer packages — only built-in functions",
    ],
  },
};

const multiFileTips = [
  "Create files with paths for folders: src/utils.go",
  "Switch files by clicking in the file tree",
  "All files are sent to the compiler when you Run",
  "Max 10 files per project, 100KB each",
  "Export all files as ZIP with the ZIP button",
];

function InfoPanel({ language, onClose }: InfoPanelProps) {
  const langInfo = languageTips[language] || {
    title: language,
    tips: ["No specific tips for this language yet."],
  };

  return (
    <div className="info-panel">
      <div className="info-header">
        <h3>Help</h3>
        <button className="info-close" onClick={onClose}>x</button>
      </div>
      <div className="info-content">
        <section className="info-section">
          <h4 className="info-section-title">{langInfo.title} Tips</h4>
          <ul className="info-list">
            {langInfo.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </section>

        <section className="info-section">
          <h4 className="info-section-title">Multi-file</h4>
          <ul className="info-list">
            {multiFileTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </section>

        <section className="info-section">
          <h4 className="info-section-title">Shortcuts</h4>
          <div className="info-shortcuts">
            {shortcuts.map((s, i) => (
              <div key={i} className="shortcut-row">
                <kbd className="shortcut-key">{s.keys}</kbd>
                <span className="shortcut-action">{s.action}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default InfoPanel;
