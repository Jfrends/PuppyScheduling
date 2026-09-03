import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";

function App() {
  return (
    // Replaced BrowserRouter with HashRouter and removed the basename
    <HashRouter>
      <Navbar />
      <Routes>
        {/* All other routes */}
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </HashRouter>
  );
}

export default App;