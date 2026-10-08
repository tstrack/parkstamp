import { Info, Search, Stamp } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { iconDefaults } from "./icons";

export function BottomNav() {
  const { pathname } = useLocation();
  const onFind =
    pathname === "/find" ||
    pathname === "/states" ||
    pathname.startsWith("/state/");
  const onAbout = pathname === "/about";

  return (
    <nav className="bottom-nav" aria-label="Main">
      <div className="bottom-nav__inner">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`
          }
        >
          <Stamp {...iconDefaults} size={22} />
          Passport
        </NavLink>
        <NavLink
          to="/find"
          className={() =>
            `bottom-nav__item${onFind ? " bottom-nav__item--active" : ""}`
          }
        >
          <Search {...iconDefaults} size={22} />
          Find
        </NavLink>
        <NavLink
          to="/about"
          className={() =>
            `bottom-nav__item${onAbout ? " bottom-nav__item--active" : ""}`
          }
        >
          <Info {...iconDefaults} size={22} />
          About
        </NavLink>
      </div>
    </nav>
  );
}
