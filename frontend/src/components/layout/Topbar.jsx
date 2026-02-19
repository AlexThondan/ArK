import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useTheme from "../../hooks/useTheme";

const Topbar = ({ onOpenSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn mobile-only" onClick={onOpenSidebar} type="button" aria-label="Open menu">
          <Menu size={18} />
        </button>
        <div className="search-box">
          <Search size={16} />
          <input type="search" placeholder="Search employees, tasks, projects..." />
        </div>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" type="button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="icon-btn" type="button" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="profile-chip">
          <div>
            <strong>{user?.email?.split("@")[0]}</strong>
            <p>{user?.role}</p>
          </div>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
