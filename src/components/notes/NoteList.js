import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { Search, Plus, AArrowDown, ChevronDown, Trash, Undo2 } from "lucide-react";

const NoteList = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("All Notes");
  const [showFolders, setShowFolders] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const notesCollection = collection(db, "notes");
        const notesQuery = query(notesCollection, orderBy(sortBy, "desc"));
        const querySnapshot = await getDocs(notesQuery);

        const notesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          updatedAt: doc.data().updatedAt || doc.data().createdAt,
          preview: doc.data().content?.substring(0, 100) || "",
          folder: doc.data().folder || "All Notes",
        }));

        const sortedNotes = [
          ...notesList.filter((note) => note.pinned && !note.deleted),
          ...notesList.filter((note) => !note.pinned && !note.deleted),
          ...notesList.filter((note) => note.deleted), // Put deleted notes at the bottom
        ];

        setNotes(sortedNotes);
      } catch (error) {
        console.error("Error fetching notes: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [sortBy]);

  const createNewNote = async () => {
    try {
      setLoading(true);
      const newNote = {
        title: "Untitled Note",
        content: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        pinned: false,
        deleted: false,
        folder: "All Notes",
      };

      const docRef = await addDoc(collection(db, "notes"), newNote);
      setTimeout(() => {
        navigate(`/notes/${docRef.id}`);
      }, 300);
    } catch (error) {
      console.error("Error creating new note: ", error);
      setLoading(false);
      alert("Failed to create new note. Please try again.");
    }
  };

  const handleSoftDelete = async (noteId) => {
    await updateDoc(doc(db, "notes", noteId), {
      deleted: true,
      updatedAt: serverTimestamp(),
    });
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, deleted: true } : note
      )
    );
  };

  const handleRestore = async (noteId) => {
    await updateDoc(doc(db, "notes", noteId), {
      deleted: false,
      updatedAt: serverTimestamp(),
    });
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, deleted: false } : note
      )
    );
  };

  const handlePermanentDelete = async (noteId) => {
    await deleteDoc(doc(db, "notes", noteId));
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const folders = [
    { id: "all", name: "All Notes", count: notes.filter(n => !n.deleted).length },
    { id: "pinned", name: "Pinned", count: notes.filter(n => n.pinned && !n.deleted).length },
    { id: "recent", name: "Recently Deleted", count: notes.filter(n => n.deleted).length },
  ];

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFolder =
      selectedFolder === "All Notes" ? !note.deleted :
      selectedFolder === "Pinned" ? note.pinned && !note.deleted :
      selectedFolder === "Recently Deleted" ? note.deleted :
      note.folder === selectedFolder && !note.deleted;

    return matchesSearch && matchesFolder;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">Your Notes</h2>
          <button
            onClick={() => setShowFolders(!showFolders)}
            className="text-sm text-purple-500 hover:text-purple-600 dark:text-purple-400"
          >
            <ChevronDown size={16} className={`${showFolders ? "" : "transform rotate-180"}`} />
          </button>
        </div>

        {showFolders && (
          <div className="space-y-1">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setSelectedFolder(folder.name)}
                className={`flex justify-between items-center p-2 rounded-lg cursor-pointer ${
                  selectedFolder === folder.name
                    ? "bg-purple-200 dark:bg-purple-700"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <span className="text-gray-700 dark:text-gray-300">{folder.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{folder.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">{filteredNotes.length} Notes</span>
            <div className="relative">
              <button
                onClick={() => setShowSortOptions(!showSortOptions)}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              >
                Sort
              </button>
              {showSortOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-20 border border-gray-200 dark:border-gray-700">
                  {["updatedAt", "createdAt", "title"].map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setShowSortOptions(false);
                      }}
                      className={`p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        sortBy === option ? "text-purple-500" : ""
                      }`}
                    >
                      {option === "updatedAt"
                        ? "Date Edited"
                        : option === "createdAt"
                        ? "Date Created"
                        : "Title"}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">No notes match your search.</div>
        ) : (
          <div>
            {filteredNotes.map((note) => (
              <div key={note.id} className="relative group">
                <Link to={`/notes/${note.id}`} className="block">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate">
                        {note.pinned && <AArrowDown size={12} className="inline mr-1 text-purple-500" />}
                        {note.title || "Untitled Note"}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(note.updatedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{note.preview}</p>
                  </div>
                </Link>

                {selectedFolder === "Recently Deleted" ? (
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button onClick={() => handleRestore(note.id)} title="Restore">
                      <Undo2 size={16} className="text-green-500 hover:text-green-600" />
                    </button>
                    <button onClick={() => handlePermanentDelete(note.id)} title="Delete Forever">
                      <Trash size={16} className="text-red-500 hover:text-red-600" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSoftDelete(note.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    title="Move to Recently Deleted"
                  >
                    <Trash size={16} className="text-gray-400 hover:text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Placeholder */}
      <div className="flex-1 bg-white dark:bg-gray-800 p-6 flex flex-col">
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-center">
          <div>
            <p>Select a note or create a new one</p>
            <button
              onClick={createNewNote}
              className="mt-4 hidden md:inline-flex items-center px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              <Plus size={20} className="mr-1" />
              New Note
            </button>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button
          onClick={createNewNote}
          className="flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full shadow-lg hover:bg-purple-600 text-white transition-colors"
          aria-label="Create new note"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default NoteList;
