"use client";

import { useState, useEffect } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

const categories = ["Olfactory Families", "Layering", "Projection", "Longevity", "Other"];

export default function LearningPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("learning-notes");
      if (saved) {
        setNotes(JSON.parse(saved));
      }
    } catch {
      // corrupted or unavailable storage — start fresh
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when notes change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("learning-notes", JSON.stringify(notes));
    } catch {
      // storage quota exceeded or unavailable — changes not persisted
    }
  }, [notes, isLoaded]);

  const addNote = () => {
    if (!title.trim() || !content.trim()) return;
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      category,
      createdAt: new Date().toISOString(),
    };
    
    setNotes([newNote, ...notes]);
    setTitle("");
    setContent("");
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <main>
      <h1>Learning</h1>
      <p>Notes on olfactory families, layering, projection, longevity, etc.</p>

      <div style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Add New Note</h3>
        
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", marginBottom: 8, border: "1px solid #ddd", borderRadius: 4 }}
          />
        </div>
        
        <div style={{ marginBottom: 12 }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", marginBottom: 8, border: "1px solid #ddd", borderRadius: 4 }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: 12 }}>
          <textarea
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4, resize: "vertical" }}
          />
        </div>
        
        <button
          onClick={addNote}
          style={{ padding: "8px 16px", background: "#222", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          Save Note
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>Your Notes ({notes.length})</h2>
        
        {notes.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No notes yet. Add your first note above!</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {notes.map(note => (
              <div
                key={note.id}
                style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: 12, color: "#666", background: "#f5f5f5", padding: "2px 8px", borderRadius: 4 }}>
                      {note.category}
                    </span>
                    <h3 style={{ margin: "8px 0" }}>{note.title}</h3>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{note.content}</p>
                    <small style={{ color: "#999" }}>
                      {new Date(note.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 18 }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}