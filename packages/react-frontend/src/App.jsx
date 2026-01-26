import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* All other routes */}
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </Router>
  );
}

export default App;
