import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { adminNav, employeeNav, hrNav, managerNav } from "../../utils/constants";
import arkLogo from "../../assets/ark-logo.svg";

const Sidebar = ({ role, open, collapsed, onToggleCollapse, onClose }) => {
  const navItems =
    role === "admin" ? adminNav :
    role === "hr" ? hrNav :
    role === "manager" ? managerNav :
    employeeNav;

  return (
    <aside className={`sidebar ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}>
      <div className="brand">
        <div className="brand-main">
          <img className="brand-logo" src={arkLogo} alt="ArK" />
          <div className={`brand-text ${collapsed ? "hidden" : ""}`}>
            <h2>ArK</h2>
          </div>
        </div>
        <button
          className="icon-btn sidebar-toggle desktop-only"
          type="button"
          aria-label="Toggle sidebar"
          onClick={onToggleCollapse}
        >
          <Menu size={16} />
        </button>
      </div>

      <nav>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className="nav-item" onClick={onClose} title={item.label}>
              <Icon size={17} />
              <span className={`nav-label ${collapsed ? "hidden" : ""}`}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
