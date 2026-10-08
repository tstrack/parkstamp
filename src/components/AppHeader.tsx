import { useState } from "react";
import { Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { iconDefaults } from "./icons";
import { SettingsSheet } from "./SettingsSheet";

export function AppHeader() {
  const { resolved } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const logoSrc =
    resolved === "dark" ? "/logo-reversed.svg" : "/logo-color.svg";

  return (
    <>
      <header className="app-header">
        <div className="app-header__bar">
          <Link to="/" className="app-header__logo" aria-label="ParkStamp home">
            <img
              src={logoSrc}
              alt="ParkStamp — Your Park Passport"
              width={459}
              height={97}
              decoding="async"
            />
          </Link>
          <div className="app-header__actions">
            <button
              type="button"
              className="app-header__action"
              aria-label="Account (coming soon)"
              disabled
              title="Account — coming soon"
            >
              <User {...iconDefaults} size={22} />
            </button>
            <button
              type="button"
              className="app-header__action app-header__action--active"
              aria-label="Settings"
              aria-haspopup="dialog"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen(true)}
            >
              <Settings {...iconDefaults} size={22} />
            </button>
          </div>
        </div>
      </header>
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
