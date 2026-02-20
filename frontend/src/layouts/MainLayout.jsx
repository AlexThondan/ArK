import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

const MainLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("ark_sidebar_collapsed") === "true"
  );

  useEffect(() => {
    localStorage.setItem("ark_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className={`app-shell ${sidebarCollapsed ? "collapsed" : ""}`}>
      <Sidebar
        role={user?.role}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="content-area">
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onToggleSidebarCollapse={() => setSidebarCollapsed((prev) => !prev)}
          isSidebarCollapsed={sidebarCollapsed}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
