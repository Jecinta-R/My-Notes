import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Pencil, MoreHorizontal } from "lucide-react";
import { db } from "../../firebase";
import { doc, deleteDoc } from "firebase/firestore";

const NoteCard = ({ note }) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  
  // Format date in Apple Notes style
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteDoc(doc(db, "notes", note.id));
        // We should ideally update state instead of reloading
        // This would be handled better with a context/state manager
        window.location.reload();
      } catch (error) {
        console.error("Error deleting note:", error);
        alert("Failed to delete note. Please try again.");
      }
    }
    setShowActions(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/notes/edit/${note.id}`);
    setShowActions(false);
  };
  
  const toggleActions = (e) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  // Truncate content intelligently
  const truncateContent = (content) => {
    if (!content) return "";
    if (content.length <= 120) return content;
    
    // Try to end at a period, space or newline
    const breakpoints = ['.', ' ', '\n'];
    let cutoff = 120;
    
    for (let i = 120; i > 80; i--) {
      if (breakpoints.includes(content[i])) {
        cutoff = i;
        break;
      }
    }
    
    return content.substring(0, cutoff) + (content.length > cutoff ? '...' : '');
  };

  // Get first image if available
  const thumbnailImage = note.imageUrl || null;
  
  // Determine date text
  const dateText = formatDate(note.updatedAt || note.createdAt);

  return (
    <div
      className="p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors shadow-sm"
      onClick={() => navigate(`/notes/${note.id}`)}
    >
      {/* Note Content */}
      <div className="flex flex-col h-full">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{note.title}</h3>
        
        <div className="flex items-center text-xs text-gray-500 mt-1 mb-1.5 space-x-2">
          <span>{dateText}</span>
          {note.tags && note.tags.length > 0 && (
            <>
              <span>•</span>
              <span className="truncate">{note.tags.join(', ')}</span>
            </>
          )}
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2">
          {truncateContent(note.content)}
        </p>
        
        {/* Thumbnail if available */}
        {thumbnailImage && (
          <div className="mt-2 overflow-hidden rounded">
            <img 
              src={thumbnailImage} 
              alt=""
              className="w-full h-24 object-cover" 
            />
          </div>
        )}
      </div>
      
      {/* Actions Button */}
      <div className="absolute top-2 right-2">
        <button
          onClick={toggleActions}
          className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          title="More options"
        >
          <MoreHorizontal size={16} />
        </button>
        
        {/* Action Menu (Shown when toggled) */}
        {showActions && (
          <div className="absolute right-0 top-8 w-36 bg-white shadow-lg rounded-md py-1 border border-gray-200 z-10">
            <button
              onClick={handleEdit}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Pencil size={14} className="mr-2" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
            >
              <Trash2 size={14} className="mr-2" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteCard;