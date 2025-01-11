import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import "../../styles/Rooms/room.css";
import React, { useEffect, useMemo, useState, useRef } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { useNavigate, useParams } from "react-router-dom";
import SelectBox from "../../elements/SelectBox";
import titleImage from "../../assets/title.png";

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
  const editorRef = useRef<any>(null);

  const defaultTexts = useMemo(
    () => ({
      javascript: `// Type your JavaScript code here
console.log("Hello, world! Frontender");`,
      python: `# Type your Python code here
print("Hello, world! Puthon")`,
      java: `// Type your Java code here
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world! Java");
    }
}`,
      go: `// Type your Go code here
package main

import "fmt"

func main() {
    fmt.Println("Hello, world! Golang")
}`,
      rust: `// Type your Rust code here
fn main() {
    println!("Hello, world! Rust");
}`,
      php: `<?php
// Type your php code here
echo "Hello, world! PHP"; ?>`,
    }),
    []
  );

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/room/code/${joinCode}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch room data. Status: ${response.status}`);
        }
        const data = await response.json();
        setRoomId(data.room_id);
        setLanguage(data.language);
        setRoomName(data.room_name); // Добавляем установку room_name
      } catch (error) {
        console.error("Error fetching room data:", error);
        alert(`Error fetching room data: ${error.message}`);
      }
    };
    fetchRoomData();
  }, [joinCode]);

  useEffect(() => {
    if (!roomId) {
      console.warn("Room ID is not yet initialized. Skipping fetch.");
      return;
    }

    fetch(`http://localhost:8080/room_code/code/${roomId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch room code ID. Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setRoomCodeId(data);
      })
      .catch((error) => {
        console.error("Error fetching room code ID:", error);
        alert(error.message);
      });
  }, [roomId]);

  useEffect(() => {
    const provider = new WebsocketProvider(
      `ws://localhost:8080/room/join/${joinCode}`,
      "monaco-react-2",
      ydoc
    );
    setProvider(provider);

    const langMap = ydoc.getMap("language");
    if (!langMap.get("current")) {
      langMap.set("current", language);
    } else {
      const currentLang = langMap.get("current");
      if (typeof currentLang === "string") {
        setLanguage(currentLang);
      }
    }

    langMap.observe((event) => {
      const newLang = langMap.get("current");
      if (typeof newLang === "string") {
        setLanguage(newLang);
        if (editorRef.current) {
          updateEditorLanguage(newLang);
        }
      }
    });

    return () => {
      provider?.destroy();
      ydoc.destroy();
    };
  }, [ydoc, joinCode]);

  useEffect(() => {
    if (provider == null || editor == null) {
      return;
    }
    const binding = new MonacoBinding(
      ydoc.getText(),
      editor.getModel()!,
      new Set([editor]),
      provider?.awareness
    );
    setBinding(binding);
    return () => {
      binding.destroy();
    };
  }, [ydoc, provider, editor]);

  const updateEditorLanguage = async (lang: string) => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const monaco = await loader.init();
        monaco.editor.setModelLanguage(model, lang);
      }
    }
  };

  const changeLang = async (lang: string, updateYjs = true) => {
    if (editor) {
      const model = editor.getModel();
      const currentText = model?.getValue().trim();

      if (currentText && currentText !== defaultTexts[language]) {
        const confirmation = window.confirm(
          "The current code will be lost. Do you want to continue?"
        );
        if (!confirmation) return;
      }

      await updateEditorLanguage(lang);
      
      if (model) {
        const newText = defaultTexts[lang] || "// Start coding!";
        model.setValue(newText);
      }
    }

    setLanguage(lang);
    if (updateYjs) {
      ydoc.getMap("language").set("current", lang);
    }
  };

  const compileCode = async () => {
    if (!editor) {
      alert("Editor is not initialized.");
      return;
    }

    const code = editor.getValue();

    try {
      const response = await fetch("http://localhost:8080/room_code/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, language }),
      });

      const result = await response.json();
      if (result.error) {
        setCompileResult(`Error: ${result.error}`);
      } else {
        setCompileResult(result.output);
      }
    } catch (error) {
      console.error("Error during compilation:", error);
      setCompileResult(`Error: ${error.message}`);
    }
  };

  const handleEditorMount = (editorInstance: any) => {
    setEditor(editorInstance);
    editorRef.current = editorInstance;
  };

  return (
    <div className="room-container">
      <header>
        <div className="header-content">
          <img
            className="titleimage"
            src={titleImage}
            alt="Title"
            onClick={() => navigate("/")}
          />
          <SelectBox
              onSelect={(selectedValue) => changeLang(selectedValue)}
              initialValue={language}
              value={language}
            />
          <h1 className="room-name">{roomName}</h1>
          <h1 className="room-name">CODE: {joinCode}</h1>
          <div className="header-controls">
            <button onClick={compileCode}>Compile</button>
          </div>
        </div>
      </header>
      <main className="editor-container">
        <Editor
          height="calc(100vh - 60px)"
          width="100%"
          defaultValue={defaultTexts[language]}
          language={language}
          theme="vs-dark"
          options={{
            stickyTabStops: true,
            wordWrap: "off",
          }}
          onMount={handleEditorMount}
        />
        <div className="compilation-panel">
          <h3>Compilation Result</h3>
          <div className="result-content">
            {compileResult ? (
              <pre>{compileResult}</pre>
            ) : (
              <p className="no-result">No result yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Room;