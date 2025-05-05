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
import { Link, useNavigate, useLocation } from "react-router-dom";
import { db } from "../../firebase";
import { Search, Plus, ArrowUp, ChevronDown, Trash, Undo2, Menu, X, Home } from "lucide-react";

const NoteList = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("All Notes");
  const [showFolders, setShowFolders] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false); // For mobile sidebar toggle
  const [showNotesList, setShowNotesList] = useState(true); // Always show notes list by default
  const navigate = useNavigate();
  const location = useLocation();

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowSidebar(true);
        setShowNotesList(true);
      } else {
        setShowSidebar(false);
        // Always keep the mobile header with hamburger menu visible
        setShowNotesList(true);
      }
    };

    // Set initial values
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      
      // Navigate immediately without setTimeout to improve responsiveness
      navigate(`/notes/${docRef.id}`);
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

  // Switch to note details view on mobile
  const handleNoteClick = (noteId) => {
    // Navigate to the note but don't change sidebar/header visibility
    navigate(`/notes/${noteId}`);
    // Keep mobile header visible
    setShowNotesList(true);
  };

  // Toggle mobile views
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const toggleNotesList = () => {
    setShowNotesList(!showNotesList);
  };

  const handleFolderClick = (folderName) => {
    setSelectedFolder(folderName);
    if (window.innerWidth < 768) {
      setShowSidebar(false);
      // Keep mobile header with hamburger visible
      setShowNotesList(true);
    }
  };

  // Reset the navigation layout on route change but keep mobile header visible
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.innerWidth < 768) {
        setShowSidebar(false);
        // Ensure mobile header stays visible and notes list is shown appropriately
        if (location.pathname === "/" || !location.pathname.includes("/notes/")) {
          setShowNotesList(true);
        }
      }
    };

    // Call once immediately
    handleRouteChange();
  }, [location.pathname]);

  // Check if the current path is on a specific note page
  const isNoteDetailPage = location.pathname.match(/\/notes\/[^/]+$/);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Unified Navbar - Always visible on all devices */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar} 
            className="p-2 mr-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md md:hidden"
            aria-label="Toggle folders"
          >
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center">
            <Home size={20} className="mr-2 text-purple-500" />
            <span className="font-medium text-gray-800 dark:text-gray-200">Notes App</span>
          </Link>
        </div>
        
        {/* Show folder name in mobile view */}
        <h1 className="text-lg font-medium text-gray-800 dark:text-gray-200 md:hidden">
          {selectedFolder}
        </h1>
        
        <div className="flex items-center">
          {/* New note button for desktop */}
          <button
            onClick={createNewNote}
            className="hidden md:flex items-center px-3 py-1 mr-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm"
          >
            <Plus size={16} className="mr-1" />
            New Note
          </button>
          
          {/* Toggle notes list button for mobile when on detail page */}
          {isNoteDetailPage && (
            <button 
              onClick={toggleNotesList}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md md:hidden"
              aria-label="Toggle notes list"
            >
              {showNotesList ? <X size={20} /> : <Search size={20} />}
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Overlay for clicking outside to close sidebar */}
        {showSidebar && window.innerWidth < 768 && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setShowSidebar(false)}
            aria-hidden="true"
          ></div>
        )}
        
        {/* Sidebar */}
        <div 
          className={`fixed md:static inset-y-0 left-0 w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          } mt-14 md:mt-0 pt-4`}
          style={{ top: '0', height: 'calc(100% - 56px)', marginTop: '56px' }}
        >
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
                  onClick={() => handleFolderClick(folder.name)}
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
        <div className={`${showNotesList ? 'block' : 'hidden'} md:block w-full md:w-72 border-r border-gray-200 dark:border-gray-700 overflow-y-auto z-10 ${isNoteDetailPage ? 'md:block hidden' : ''} relative md:static bg-white dark:bg-gray-800`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-14 md:top-0 bg-white dark:bg-gray-800 z-10">
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
                  <div 
                    onClick={() => handleNoteClick(note.id)} 
                    className="block cursor-pointer"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate">
                          {note.pinned && <ArrowUp size={12} className="inline mr-1 text-purple-500" />}
                          {note.title || "Untitled Note"}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(note.updatedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{note.preview}</p>
                    </div>
                  </div>

                  {selectedFolder === "Recently Deleted" ? (
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(note.id);
                        }} 
                        title="Restore"
                      >
                        <Undo2 size={16} className="text-green-500 hover:text-green-600" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePermanentDelete(note.id);
                        }} 
                        title="Delete Forever"
                      >
                        <Trash size={16} className="text-red-500 hover:text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSoftDelete(note.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
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

        {/* Main Content Area */}
        <div className={`flex-1 bg-white dark:bg-gray-800 p-4 md:p-6 flex flex-col overflow-y-auto ${isNoteDetailPage ? 'block' : 'flex'}`}>
          {!isNoteDetailPage && (
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
          )}
        </div>

        {/* Floating Button for mobile - visible on all pages */}
        <div className="fixed bottom-6 right-6 md:hidden z-40">
          <button
            onClick={createNewNote}
            className="flex items-center justify-center w-14 h-14 bg-purple-500 rounded-full shadow-lg hover:bg-purple-600 active:bg-purple-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
            aria-label="Create new note"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteList;