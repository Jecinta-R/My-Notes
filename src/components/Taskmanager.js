import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/signin");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tasks"), (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (taskText) {
      await addDoc(collection(db, "tasks"), { text: taskText, completed: false });
      setTaskText("");
    }
  };

  const handleToggle = async (task) => {
    await updateDoc(doc(db, "tasks", task.id), { completed: !task.completed });
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  const handleLogout = () => {
    signOut(auth);
    navigate("/signin");
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-blue-50 p-6 flex justify-center items-center">
      <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Task Manager</h2>
          <button
            onClick={handleLogout}
            className="text-red-500 font-semibold hover:underline"
          >
            Logout
          </button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-4 mb-6">
          <input
            className="flex-grow p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="New task"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Add Task
          </button>
        </form>

        <ul className="space-y-4">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex justify-between items-center p-4 border border-gray-300 rounded-lg hover:shadow-lg transition duration-200"
            >
              <span
                className={`text-lg ${task.completed ? "line-through text-gray-400" : ""}`}
                onClick={() => handleToggle(task)}
              >
                {task.text}
              </span>
              <button
                onClick={() => handleDelete(task.id)}
                className="text-red-400 hover:text-red-600 transition duration-200"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
