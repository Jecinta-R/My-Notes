import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import NoteList from "./components/notes/NoteList";
import NoteEditor from "./components/notes/NoteEditor";
import NoteViewer from "./components/notes/NoteViewer";
import PublicNoteViewer from "./components/notes/PublicNoteViewer";
import TrashBin from "./components/utils/TrashBin"; // ✅ NEW import
import { ThemeProvider } from "./components/utils/ThemeContext";
import Navbar from "./components/layout/Navbar";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Navbar />
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
          <Routes>
            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Notes Routes */}
            <Route path="/notes" element={<NoteList />} />
            <Route path="/notes/create" element={<NoteEditor />} />
            <Route path="/notes/:noteId" element={<NoteViewer />} />
            <Route path="/notes/edit/:noteId" element={<NoteEditor />} />
            <Route path="/notes/public/:noteId" element={<PublicNoteViewer />} />

            {/* Trash Bin Route */}
            <Route path="/trash" element={<TrashBin />} /> {/* ✅ New TrashBin route */}

            {/* Default Route */}
            <Route path="*" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
