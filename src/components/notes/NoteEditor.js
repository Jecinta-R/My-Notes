import React, { useState, useEffect, useCallback, useRef } from "react";
import { db } from "../../firebase";
import {
  addDoc,
  collection,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import debounce from "lodash.debounce";
import { Share2, ArrowLeft, Download, Trash2, Tag, Pin } from "lucide-react";

const NoteEditor = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [pinned, setPinned] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const { noteId } = useParams();
  const navigate = useNavigate();
  const tagInputRef = useRef(null);
  const contentRef = useRef(null);

  const isEditMode = noteId && noteId !== "create";

  useEffect(() => {
    if (!isEditMode && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isEditMode]);

  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [showTagInput]);

  useEffect(() => {
    if (isEditMode) {
      const fetchNote = async () => {
        setLoading(true);
        try {
          const noteRef = doc(db, "notes", noteId);
          const docSnap = await getDoc(noteRef);
          if (docSnap.exists()) {
            const noteData = docSnap.data();
            setTitle(noteData.title || "");
            setContent(noteData.content || "");
            setTags(noteData.tags || []);
            setPinned(noteData.pinned || false);
            setIsPublic(noteData.public || false);
          } else {
            setError("Note not found!");
          }
        } catch (err) {
          setError("Error fetching note data.");
        } finally {
          setLoading(false);
        }
      };
      fetchNote();
    }
  }, [noteId, isEditMode]);

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
    setShowTagInput(false);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Escape") {
      setShowTagInput(false);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const debouncedAutoSave = useCallback(
    debounce(async (data) => {
      if (isEditMode && (title.trim() || content.trim())) {
        setIsSaving(true);
        try {
          const noteRef = doc(db, "notes", noteId);
          await updateDoc(noteRef, {
            ...data,
            updatedAt: serverTimestamp(),
          });
          setLastSaved(new Date());
        } catch (err) {
          console.error("Auto-save failed", err);
        } finally {
          setIsSaving(false);
        }
      }
    }, 1000),
    [noteId, isEditMode]
  );

  useEffect(() => {
    if (isEditMode) {
      debouncedAutoSave({
        title,
        content,
        tags,
        pinned,
        public: isPublic,
      });
    }
  }, [title, content, tags, pinned, isPublic, debouncedAutoSave]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      setError("Please add some content before saving");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const noteData = {
        title: title.trim() || "Untitled Note",
        content: content.trim(),
        tags,
        pinned,
        public: isPublic,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode) {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, noteData);
      } else {
        noteData.createdAt = serverTimestamp();
        const notesCollection = collection(db, "notes");
        const newDoc = await addDoc(notesCollection, noteData);
        navigate(`/notes/${newDoc.id}`);
        return;
      }

      navigate("/notes");
    } catch (err) {
      setError("Error saving note. Please try again.");
      console.error("Error saving note:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await updateDoc(doc(db, "notes", noteId), {
          deleted: true,
          deletedAt: serverTimestamp(),
        });
        navigate("/notes");
      } catch (err) {
        setError("Error deleting note. Please try again.");
      }
    }
  };

  const exportAsPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text(title || "Untitled Note", 20, 20);

    if (tags.length > 0) {
      pdf.setFontSize(10);
      pdf.text(`Tags: ${tags.join(", ")}`, 20, 30);
    }

    pdf.setFontSize(12);
    const contentLines = pdf.splitTextToSize(content, 170);
    pdf.text(contentLines, 20, 40);

    pdf.save(`${title || "Untitled Note"}.pdf`);
  };

  const handleCopyShareLink = () => {
    if (isEditMode && isPublic) {
      const shareLink = `${window.location.origin}/notes/public/${noteId}`;
      navigator.clipboard.writeText(shareLink);
      alert("Share link copied to clipboard!");
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return "";
    const now = new Date();
    const diffMs = now - lastSaved;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
    return lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <button onClick={() => navigate("/notes")} className="text-blue-600 dark:text-blue-400 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleSave} className="btn-primary">Save</button>
            <button onClick={exportAsPDF} className="btn-secondary">Export PDF</button>
            {isEditMode && <button onClick={handleDelete} className="btn-danger">Delete</button>}
            {isEditMode && isPublic && (
              <button onClick={handleCopyShareLink} className="btn-secondary">
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 text-xl font-semibold rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700"
        />

        <textarea
          ref={contentRef}
          placeholder="Write your note here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[200px] px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700"
        />

        <div className="flex flex-wrap gap-2 items-center">
          {tags.map((tag) => (
            <span key={tag} className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 py-1 rounded-full text-sm flex items-center">
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-2 text-xs">×</button>
            </span>
          ))}
          {showTagInput ? (
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={handleAddTag}
              className="px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700"
              placeholder="New tag"
            />
          ) : (
            <button onClick={() => setShowTagInput(true)} className="text-blue-500 dark:text-blue-300 flex items-center text-sm">
              <Tag className="w-4 h-4 mr-1" /> Add Tag
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" checked={pinned} onChange={() => setPinned(!pinned)} />
            <span className="flex items-center"><Pin className="w-4 h-4 mr-1" /> Pinned</span>
          </label>
          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={() => setIsPublic(!isPublic)} />
            <span className="flex items-center"><Share2 className="w-4 h-4 mr-1" /> Public</span>
          </label>
        </div>

        {isSaving && (
          <div className="text-sm text-gray-500 dark:text-gray-400">Saving...</div>
        )}
        {lastSaved && !isSaving && (
          <div className="text-sm text-gray-500 dark:text-gray-400">Last saved: {formatLastSaved()}</div>
        )}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
