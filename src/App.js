import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import TaskManager from "./components/TaskManager";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/tasks" element={<TaskManager />} />
        <Route path="*" element={<SignIn />} />
      </Routes>
    </Router>
  );
}

export default App;
