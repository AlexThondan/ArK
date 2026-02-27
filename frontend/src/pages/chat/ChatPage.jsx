import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreHorizontal,
  MessageSquare
} from "lucide-react";
import { chatApi } from "../../api/hrmsApi";
import useAuth from "../../hooks/useAuth";
import { resolveFileUrl } from "../../utils/format";

const AVATAR_COLORS = [
  "#1E40AF", "#0369A1", "#0F766E", "#6D28D9", "#BE185D",
  "#B45309", "#4338CA", "#A21CAF", "#047857", "#C2410C"
];

const getColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];
const getInitials = (first, last) =>
  `${(first || "").charAt(0)}${(last || "").charAt(0)}`.toUpperCase() || "?";

const ChatPage = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContactId, setActiveContactId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch permitted contacts from chat API
  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await chatApi.contacts({ limit: 200 });
      const list = (res.data || []).map((emp, idx) => ({
        _id: emp._id,
        name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
        firstName: emp.firstName || "",
        lastName: emp.lastName || "",
        initials: getInitials(emp.firstName, emp.lastName),
        email: emp.email || "-",
        role: emp.role || "Employee",
        avatarUrl: emp.avatarUrl,
        projects: emp.projects || [],
        teams: emp.teams || [],
        color: getColor(idx)
      }));
      setContacts(list);
      if (list.length > 0 && !activeContactId) {
        setActiveContactId(list[0]._id);
      }
    } catch (err) {
      console.error(err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [activeContactId]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Load messages for the active contact
  const loadMessages = useCallback(async () => {
    if (!activeContactId) return;
    try {
      const res = await chatApi.messages({ with: activeContactId, limit: 100 });
      const ordered = res.data || [];
      // Data from API is usually sorted inside the controller. 
      // The backend returns it sorted by time appropriately.
      setMessages(ordered.map((msg) => ({
        id: msg._id,
        from: msg.from === activeContactId ? "them" : "me",
        text: msg.text,
        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      })));
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  }, [activeContactId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Get filtered contacts
  const filteredContacts = useMemo(
    () =>
      contacts.filter((emp) =>
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase())
      ),
    [contacts, search]
  );

  const activeContact = contacts.find((e) => e._id === activeContactId);

  const sendMessage = async () => {
    if (!messageText.trim() || !activeContactId) return;
    const textToSend = messageText;
    setMessageText("");

    // Optistic update
    const tempId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        from: "me",
        text: textToSend,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);

    try {
      await chatApi.send({ to: activeContactId, text: textToSend });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short"
  });

  return (
    <div className="chat-layout">
      {/* ── LEFT PANEL: Contact List ── */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Messages</h2>
          <span className="dash-table-count">{contacts.length}</span>
        </div>

        <div className="chat-search-wrap">
          <Search size={14} className="chat-search-icon" />
          <input
            type="text"
            placeholder="Search connections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="chat-contact-list">
          {loading ? (
            <p className="muted" style={{ padding: "16px", textAlign: "center" }}>
              Loading...
            </p>
          ) : filteredContacts.length ? (
            filteredContacts.map((emp) => (
              <button
                key={emp._id}
                type="button"
                className={`chat-contact-item ${activeContactId === emp._id ? "active" : ""}`}
                onClick={() => setActiveContactId(emp._id)}
              >
                <div className="chat-contact-avatar" style={{ "--av-color": emp.color }}>
                  {emp.avatarUrl ? (
                    <img
                      src={resolveFileUrl(emp.avatarUrl)}
                      alt={emp.name}
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <span>{emp.initials}</span>
                  )}
                </div>
                <div className="chat-contact-info">
                  <div className="chat-contact-top">
                    <strong className="chat-contact-name">{emp.name}</strong>
                  </div>
                  <div className="chat-contact-bottom">
                    <p className="chat-contact-preview">
                      {emp.teams.length ? emp.teams[0] : emp.role}
                    </p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="muted" style={{ padding: "16px", textAlign: "center" }}>
              No connections found
            </p>
          )}
        </div>
      </aside>

      {/* ── CENTER PANEL: Chat Area ── */}
      <main className="chat-main">
        {activeContact ? (
          <>
            {/* Header */}
            <div className="chat-main-header">
              <div className="chat-main-user">
                <div className="chat-contact-avatar medium" style={{ "--av-color": activeContact.color }}>
                  {activeContact.avatarUrl ? (
                    <img
                      src={resolveFileUrl(activeContact.avatarUrl)}
                      alt={activeContact.name}
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <span>{activeContact.initials}</span>
                  )}
                </div>
                <div>
                  <strong>{activeContact.name}</strong>
                  <p className="chat-status-text">
                    {activeContact.teams.length ? activeContact.teams.join(", ") : activeContact.role}
                  </p>
                </div>
              </div>
              <div className="chat-main-actions">
                <button className="icon-btn" type="button" aria-label="More"><MoreHorizontal size={16} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              <div className="chat-date-divider">
                <span>{todayLabel}</span>
              </div>
              {messages.length ? (
                messages.map((msg, idx) => (
                  <div key={msg.id || idx} className={`chat-bubble-wrap ${msg.from === "me" ? "me" : "them"}`}>
                    {msg.from === "them" && (
                      <div className="chat-contact-avatar small" style={{ "--av-color": activeContact.color }}>
                        <span>{activeContact.initials}</span>
                      </div>
                    )}
                    <div className="chat-bubble-block">
                      <div className={`chat-bubble ${msg.from === "me" ? "bubble-me" : "bubble-them"}`}>
                        {msg.text}
                      </div>
                      <span className="chat-bubble-time">{msg.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="chat-empty-state">
                  <MessageSquare size={36} />
                  <h4>Start a conversation</h4>
                  <p className="muted">Send a message to {activeContact.firstName || activeContact.name}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area">
              <button className="icon-btn" type="button" aria-label="Attach"><Paperclip size={16} /></button>
              <input
                type="text"
                className="chat-input"
                placeholder={`Message ${activeContact.firstName || activeContact.name}...`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button className="icon-btn" type="button" aria-label="Emoji"><Smile size={16} /></button>
              <button className="chat-send-btn" type="button" onClick={sendMessage} aria-label="Send">
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="chat-empty-state" style={{ flex: 1 }}>
            <MessageSquare size={44} />
            <h4>Select a conversation</h4>
            <p className="muted">Choose someone from the list to start chatting</p>
          </div>
        )}
      </main>

      {/* ── RIGHT PANEL: Profile Info ── */}
      {activeContact ? (
        <aside className="chat-profile-panel">
          <div className="chat-profile-hero">
            <div className="chat-profile-avatar-lg" style={{ "--av-color": activeContact.color }}>
              {activeContact.avatarUrl ? (
                <img
                  src={resolveFileUrl(activeContact.avatarUrl)}
                  alt={activeContact.name}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <span>{activeContact.initials}</span>
              )}
            </div>
            <h3>{activeContact.name}</h3>
            <p className="muted">{activeContact.email}</p>
          </div>
          <div className="chat-profile-details">
            <div className="chat-detail-row">
              <span className="label">Department</span>
              <span className="value">{activeContact.role}</span>
            </div>
            {activeContact.teams?.length > 0 && (
              <div className="chat-detail-row">
                <span className="label">Teams</span>
                <span className="value">{activeContact.teams.join(", ")}</span>
              </div>
            )}
            {activeContact.projects?.length > 0 && (
              <div className="chat-detail-row">
                <span className="label">Projects</span>
                <span className="value">{activeContact.projects.join(", ")}</span>
              </div>
            )}
          </div>
        </aside>
      ) : (
        <aside className="chat-profile-panel" style={{ alignItems: "center", justifyContent: "center" }}>
          <p className="muted">No profile selected</p>
        </aside>
      )}
    </div>
  );
};

export default ChatPage;
