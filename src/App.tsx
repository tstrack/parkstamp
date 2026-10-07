import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { VisitsProvider } from "./hooks/useVisits";
import { HomePage } from "./pages/HomePage";
import { StatePage } from "./pages/StatePage";
import { ParkPage } from "./pages/ParkPage";
import { AboutPage } from "./pages/AboutPage";

export default function App() {
  return (
    <VisitsProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/state/:code" element={<StatePage />} />
            <Route path="/state/:code/park/:parkId" element={<ParkPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </VisitsProvider>
  );
}
