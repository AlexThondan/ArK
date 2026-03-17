import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, LogOut, Menu, Search, SendHorizontal, Settings, UserRound, Users, MessagesSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import { chatApi, notificationApi } from "../../api/hrmsApi";
import { formatDateTime, resolveFileUrl } from "../../utils/format";

const Topbar = ({ onOpenSidebar }) => {
  const navigate = useNavigate();
  const { logout, user, profile } = useAuth();
  const topbarRef = useRef(null);
  const profileMenuRef = useRef(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [notifications, setNotifications] = useState({
    loading: false,
    items: [],
    unreadCount: 0
  });
  const [chatState, setChatState] = useState({
    loading: false,
    contacts: [],
    inbox: [],
    unreadCount: 0,
    selectedUserId: "",
    messages: [],
    loadingMessages: false,
    draft: ""
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

  const loadChatInbox = useCallback(async () => {
    try {
      const response = await chatApi.inbox({ limit: 30 });
      setChatState((prev) => ({
        ...prev,
        inbox: response.data || [],
        unreadCount: response.unreadCount || 0
      }));
    } catch {
      // Keep current state on polling error.
    }
  }, []);

  const loadContacts = useCallback(async (searchText = "") => {
    try {
      const response = await chatApi.contacts({
        limit: 300,
        search: String(searchText || "").trim() || undefined
      });
      setChatState((prev) => ({
        ...prev,
        contacts: response.data || []
      }));
    } catch {
      toast.error("Unable to load chat contacts");
    }
  }, []);

  const loadMessages = useCallback(async (withUserId, markRead = false) => {
    if (!withUserId) return;
    try {
      setChatState((prev) => ({ ...prev, loadingMessages: true }));
      const response = await chatApi.messages({ with: withUserId, limit: 120 });
      if (markRead) {
        await chatApi.markRead(withUserId);
      }
      setChatState((prev) => ({
        ...prev,
        selectedUserId: withUserId,
        messages: response.data || [],
        loadingMessages: false
      }));
      if (markRead) {
        loadChatInbox();
      }
    } catch {
      setChatState((prev) => ({ ...prev, loadingMessages: false }));
      toast.error("Unable to load conversation");
    }
  }, [loadChatInbox]);

  const openChat = useCallback(async () => {
    setChatOpen(true);
    setPanelOpen(false);
    setProfileOpen(false);
    setChatState((prev) => ({ ...prev, loading: true }));
    await Promise.all([loadContacts(chatSearch), loadChatInbox()]);
    setChatState((prev) => ({ ...prev, loading: false }));
  }, [loadContacts, loadChatInbox, chatSearch]);

  useEffect(() => {
    loadNotifications();
    loadChatInbox();
    const timer = setInterval(() => {
      loadNotifications();
      loadChatInbox();
    }, 15000);
    return () => clearInterval(timer);
  }, [loadNotifications, loadChatInbox]);

  useEffect(() => {
    if (!chatOpen || !chatState.selectedUserId) return undefined;
    const timer = setInterval(() => {
      loadMessages(chatState.selectedUserId, false);
      loadChatInbox();
    }, 8000);
    return () => clearInterval(timer);
  }, [chatOpen, chatState.selectedUserId, loadMessages, loadChatInbox]);

  useEffect(() => {
    if (!chatOpen) return undefined;
    const timer = setTimeout(() => {
      loadContacts(chatSearch);
    }, 260);
    return () => clearTimeout(timer);
  }, [chatOpen, chatSearch, loadContacts]);

  useEffect(() => {
    if (!chatOpen) return undefined;
    const timer = setInterval(() => {
      loadContacts(chatSearch);
    }, 15000);
    return () => clearInterval(timer);
  }, [chatOpen, chatSearch, loadContacts]);

  useEffect(() => {
    const onOutsideClick = (event) => {
      if (!topbarRef.current?.contains(event.target)) {
        setProfileOpen(false);
        setPanelOpen(false);
        setChatOpen(false);
      } else if (!profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const profileActions = useMemo(() => {
    if (user?.role === "admin") {
      return [
        { label: "Admin Profile", icon: UserRound, to: "/admin/profile" },
        { label: "HR Dashboard", icon: Users, to: "/admin/hr-dashboard" },
        { label: "Employee Directory", icon: Users, to: "/admin/employees" },
        { label: "Settings", icon: Settings, to: "/settings" }
      ];
    }

    if (user?.role === "hr") {
      return [
        { label: "HR Dashboard", icon: Users, to: "/admin/hr-dashboard" },
        { label: "Employee Directory", icon: Users, to: "/admin/employees" },
        { label: "My Profile", icon: UserRound, to: "/admin/profile" },
        { label: "Settings", icon: Settings, to: "/settings" }
      ];
    }

    if (user?.role === "manager") {
      return [
        { label: "Manager Dashboard", icon: Users, to: "/manager/dashboard" },
        { label: "My Profile", icon: UserRound, to: "/employee/profile" },
        { label: "Settings", icon: Settings, to: "/settings" }
      ];
    }

    return [
      { label: "My Profile", icon: UserRound, to: "/employee/profile" },
      { label: "Settings", icon: Settings, to: "/settings" }
    ];
  }, [user?.role]);

  const profileName =
    `${profile?.firstName || user?.name || ""} ${profile?.lastName || ""}`.trim() || user?.email || "Account";

  const contactMap = useMemo(
    () =>
      (chatState.contacts || []).reduce((acc, contact) => {
        acc[contact._id] = contact;
        return acc;
      }, {}),
    [chatState.contacts]
  );

  const selectedChatUser = chatState.selectedUserId ? contactMap[chatState.selectedUserId] : null;

  const chatEntries = useMemo(() => {
    const inboxIds = (chatState.inbox || []).map((entry) => entry.user?._id).filter(Boolean);
    const contactIds = (chatState.contacts || []).map((entry) => entry._id).filter(Boolean);
    const orderedIds = [...new Set([...inboxIds, ...contactIds])];
    return orderedIds
      .map((id) => {
        const contact = contactMap[id];
        const inbox = (chatState.inbox || []).find((row) => row.user?._id === id);
        if (!contact) return null;
        return {
          ...contact,
          lastMessage: inbox?.lastMessage || "",
          lastMessageAt: inbox?.lastMessageAt,
          unreadCount: inbox?.unreadCount || 0
        };
      })
      .filter(Boolean);
  }, [chatState.inbox, chatState.contacts, contactMap]);

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
    setChatOpen(false);
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

  const openConversation = async (userId) => {
    await loadMessages(userId, true);
  };

  const sendChatMessage = async () => {
    const text = String(chatState.draft || "").trim();
    if (!chatState.selectedUserId || !text) return;

    try {
      await chatApi.send({ to: chatState.selectedUserId, text });
      setChatState((prev) => ({ ...prev, draft: "" }));
      await loadMessages(chatState.selectedUserId, false);
      await loadChatInbox();
    } catch (error) {
      toast.error(error.message || "Unable to send message");
    }
  };

  const formatChatName = (person) => {
    const name = `${person?.firstName || ""} ${person?.lastName || ""}`.trim();
    return name || person?.email || "User";
  };

  const formatChatHint = (person) => {
    const context = [person?.projects?.[0], person?.teams?.[0]].filter(Boolean).join(" | ");
    return person?.lastMessage || context || person?.email || "";
  };

  return (
    <header className="topbar" ref={topbarRef}>
      <div className="topbar-left">
        <button className="icon-btn mobile-only" onClick={onOpenSidebar} type="button" aria-label="Open menu">
          <Menu size={18} />
        </button>
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
          onClick={() => {
            setPanelOpen((prev) => !prev);
            setProfileOpen(false);
            setChatOpen(false);
          }}
        >
          <Bell size={18} />
          {notifications.unreadCount > 0 ? <span className="notification-dot">{notifications.unreadCount}</span> : null}
        </button>
        <button
          className="icon-btn chat-btn"
          type="button"
          aria-label="Chatbox"
          onClick={() => {
            setPanelOpen(false);
            setProfileOpen(false);
            navigate("/chat");
          }}
        >
          <MessagesSquare size={18} />
          {chatState.unreadCount > 0 ? <span className="notification-dot">{chatState.unreadCount}</span> : null}
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

        <div className="profile-menu-wrap" ref={profileMenuRef}>
          <button
            className="profile-menu-trigger"
            type="button"
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setPanelOpen(false);
              setChatOpen(false);
            }}
          >
            <span className="avatar-cell small">
              {profile?.avatarUrl ? (
                <img className="avatar-img" src={resolveFileUrl(profile.avatarUrl)} alt={profileName} />
              ) : (
                <span className="avatar-fallback">
                  {(profile?.firstName || "A").slice(0, 1)}
                  {(profile?.lastName || "").slice(0, 1)}
                </span>
              )}
            </span>
            <span className="profile-menu-copy">
              <strong>{profileName}</strong>
              <small>{user?.role === "admin" ? "Admin" : user?.role === "hr" ? "HR" : user?.role === "manager" ? "Manager" : "Employee"}</small>
            </span>
          </button>

          {profileOpen ? (
            <div className="profile-menu-panel">
              {profileActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.to}
                    className="profile-menu-item"
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate(action.to);
                    }}
                  >
                    <Icon size={15} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

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
