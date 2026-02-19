import { NavLink } from "react-router-dom";
import { adminNav, employeeNav } from "../../utils/constants";
import arkLogo from "../../assets/ark-logo.svg";

const Sidebar = ({ role, open, onClose }) => {
  const navItems = role === "admin" ? adminNav : employeeNav;

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <img className="brand-logo" src={arkLogo} alt="ArK" />
        <div>
          <h2>ArK</h2>
        </div>
      </div>

      <nav>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className="nav-item" onClick={onClose}>
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
