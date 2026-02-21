import { useCallback, useEffect, useState } from "react";
import { Bell, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { notificationApi } from "../../api/hrmsApi";
import { formatDateTime, resolveFileUrl } from "../../utils/format";

const Topbar = ({ onOpenSidebar, onToggleSidebarCollapse, isSidebarCollapsed }) => {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const [panelOpen, setPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    loading: false,
    items: [],
    unreadCount: 0
  });

  const loadNotifications = useCallback(async () => {
    try {
      setNotifications((prev) => ({ ...prev, loading: true }));
      const response = await notificationApi.list({ limit: 8 });
      setNotifications({
        loading: false,
        items: response.data || [],
        unreadCount: response.unreadCount || 0
      });
    } catch {
      setNotifications((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 20000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  const onOpenNotification = async (item) => {
    try {
      if (!item.isRead) {
        await notificationApi.markRead(item._id);
        setNotifications((prev) => ({
          ...prev,
          unreadCount: Math.max((prev.unreadCount || 1) - 1, 0),
          items: prev.items.map((row) => (row._id === item._id ? { ...row, isRead: true } : row))
        }));
      }
    } catch {
      // Non-blocking UI fallback if mark read fails.
    }
    setPanelOpen(false);
    navigate(item.link || "/");
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => ({
        ...prev,
        unreadCount: 0,
        items: prev.items.map((row) => ({ ...row, isRead: true }))
      }));
    } catch {
      // Keep existing panel data on API failure.
    }
  };

  const displayName = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || user?.email || "User";
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn mobile-only" onClick={onOpenSidebar} type="button" aria-label="Open menu">
          <Menu size={18} />
        </button>
        <button
          className="icon-btn desktop-only"
          onClick={onToggleSidebarCollapse}
          type="button"
          aria-label="Toggle sidebar"
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <div className="topbar-greeting">
          <div className="avatar-cell small">
            {profile?.avatarUrl ? (
              <img className="avatar-img" src={resolveFileUrl(profile.avatarUrl)} alt={displayName} />
            ) : (
              <span className="avatar-fallback">{displayName.slice(0, 1)}</span>
            )}
          </div>
          <div>
            <strong>Hey, {displayName.split(" ")[0]}</strong>
            <p className="muted">{todayLabel}</p>
          </div>
        </div>
      </div>

      <div className="topbar-center">
        <div className="search-box">
          <Search size={16} />
          <input type="search" placeholder="Start searching here" />
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="icon-btn notification-btn"
          type="button"
          aria-label="Notifications"
          onClick={() => setPanelOpen((prev) => !prev)}
        >
          <Bell size={18} />
          {notifications.unreadCount > 0 ? <span className="notification-dot">{notifications.unreadCount}</span> : null}
        </button>
        {panelOpen ? (
          <div className="notification-panel">
            <div className="notification-head">
              <strong>Notifications</strong>
              <button className="btn btn-ghost" type="button" onClick={markAllRead}>
                Mark all read
              </button>
            </div>
            <div className="notification-list">
              {notifications.items.length ? (
                notifications.items.map((item) => (
                  <button
                    key={item._id}
                    className={`notification-item ${item.isRead ? "" : "unread"}`}
                    type="button"
                    onClick={() => onOpenNotification(item)}
                  >
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                    </div>
                    <small>{formatDateTime(item.createdAt)}</small>
                  </button>
                ))
              ) : (
                <p className="muted notification-empty">
                  {notifications.loading ? "Loading notifications..." : "No notifications right now."}
                </p>
              )}
            </div>
          </div>
        ) : null}
        <button
          className="btn btn-logout"
          type="button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
