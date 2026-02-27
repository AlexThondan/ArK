import { Outlet } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

const MainLayout = () => {
  const { user, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("ark_sidebar_collapsed") === "true"
  );

  const welcomeName = useMemo(() => {
    if (profile?.firstName) return profile.firstName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  }, [profile?.firstName, user?.email]);

  const welcomeDate = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).formatToParts(new Date());

    const weekday = parts.find((part) => part.type === "weekday")?.value || "";
    const day = parts.find((part) => part.type === "day")?.value || "";
    const month = parts.find((part) => part.type === "month")?.value || "";
    const year = parts.find((part) => part.type === "year")?.value || "";
    return `${weekday}, ${day} ${month}, ${year}`;
  }, []);

  const arkCode = useMemo(() => {
    const code = String(profile?.employeeId || "").trim().toUpperCase();
    if (code) return code;
    return "ARK-000";
  }, [profile?.employeeId]);

  useEffect(() => {
    localStorage.setItem("ark_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className={`app-shell ${sidebarCollapsed ? "collapsed" : ""}`}>
      <Sidebar
        role={user?.role}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="content-area">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
