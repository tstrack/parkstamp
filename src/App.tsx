import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";
import { StampFilters } from "./components/Stamp";
import { ThemeProvider } from "./hooks/useTheme";
import { VisitsProvider } from "./hooks/useVisits";
import { AboutPage } from "./pages/AboutPage";
import { FindPage } from "./pages/FindPage";
import { HomePage } from "./pages/HomePage";
import { ParkPage } from "./pages/ParkPage";
import { StatePage } from "./pages/StatePage";

export default function App() {
  return (
    <ThemeProvider>
      <VisitsProvider>
        <BrowserRouter>
          <StampFilters />
          <div className="app-shell">
            <AppHeader />
            <div className="app-shell__main">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/find" element={<FindPage />} />
                <Route path="/states" element={<Navigate to="/find" replace />} />
                <Route path="/state/:code" element={<StatePage />} />
                <Route path="/state/:code/park/:parkId" element={<ParkPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <BottomNav />
          </div>
        </BrowserRouter>
      </VisitsProvider>
    </ThemeProvider>
  );
}
