import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

const PublicNoteViewer = () => {
  const { noteId } = useParams();
  const [note, setNote] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicNote = async () => {
      try {
        const noteRef = doc(db, "notes", noteId);
        const noteSnap = await getDoc(noteRef);

        if (noteSnap.exists()) {
          const data = noteSnap.data();
          if (data.public) {
            setNote(data);
          } else {
            setError("This note is private or unavailable.");
          }
        } else {
          setError("Note not found.");
        }
      } catch (err) {
        console.error("Error fetching public note:", err);
        setError("An error occurred while loading the note.");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicNote();
  }, [noteId]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (error)
    return (
      <div className="p-6 bg-red-100 text-red-700 text-center rounded">
        {error}
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow mt-6">
      <h1 className="text-2xl font-bold mb-2">{note.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        {note.updatedAt?.toDate().toLocaleString()}
      </p>
      <div className="prose dark:prose-invert max-w-none">
        {note.content.split("\n").map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>

      {note.tags && note.tags.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold">Tags:</h4>
          <div className="flex flex-wrap gap-2 mt-1">
            {note.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicNoteViewer;
