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

    if (diffSec < 60) {
      return "Just now";
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
    } else {
      return lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/notes")}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              {isEditMode ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isSaving ? "Saving..." : lastSaved && `Edited ${formatLastSaved()}`}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">New Note</div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isEditMode && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Delete note"
              >
                <Trash2 size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            )}

            <button
              onClick={() => setPinned(!pinned)}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                pinned ? "text-yellow-500" : "text-gray-600 dark:text-gray-300"
              }`}
              title={pinned ? "Unpin note" : "Pin note"}
            >
              <Pin size={20} />
            </button>

            <button
              onClick={exportAsPDF}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Export as PDF"
            >
              <Download size={20} className="text-gray-600 dark:text-gray-300" />
            </button>

            {isEditMode && (
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isPublic ? "text-blue-500" : "text-gray-600 dark:text-gray-300"
                }`}
                title={isPublic ? "Make private" : "Make public"}
              >
                <Share2 size={20} />
              </button>
            )}

            <button
              onClick={handleSave}
              className={`ml-2 px-4 py-1.5 rounded-full text-sm font-medium ${
                loading
                  ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              disabled={loading}
            >
              {loading ? "Saving..." : isEditMode ? "Done" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="p-3 mb-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Tags */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {tags.map((tag, index) => (
            <div
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm flex items-center group"
            >
              <span>{tag}</span>
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}

          {showTagInput ? (
            <div className="relative">
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={handleAddTag}
                placeholder="Add tag..."
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm outline-none border border-gray-300 dark:border-gray-600 focus:border-blue-500"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-sm flex items-center hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Tag size={14} className="mr-1" />
              <span>Add Tag</span>
            </button>
          )}
        </div>

        {/* Title and Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 min-h-[70vh]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full text-xl font-semibold mb-4 outline-none bg-transparent text-gray-900 dark:text-white border-none"
          />

          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Note content..."
            className="w-full h-[60vh] resize-none outline-none bg-transparent text-gray-700 dark:text-gray-300 border-none"
          />
        </div>

        {/* Share Link */}
        {isEditMode && isPublic && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Share link:</span>{" "}
                <span className="font-mono text-xs">
                  {`${window.location.origin}/notes/public/${noteId}`}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyShareLink}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full"
                >
                  Copy
                </button>
                <button
                  onClick={exportAsPDF}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-full"
                >
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
