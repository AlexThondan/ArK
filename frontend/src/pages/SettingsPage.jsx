import { useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi";
import useTheme from "../hooks/useTheme";

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      await authApi.changePassword(form);
      toast.success("Password updated");
      setForm({ currentPassword: "", newPassword: "" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Settings</h1>
      </header>

      <article className="card action-row">
        <div>
          <h3>Appearance</h3>
          <p className="muted">Toggle dark mode for better visual comfort.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={toggleTheme}>
          Switch to {theme === "dark" ? "Light" : "Dark"} Mode
        </button>
      </article>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h3>Change Password</h3>
        <label>
          Current Password
          <input
            type="password"
            required
            value={form.currentPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
          />
        </label>
        <label>
          New Password
          <input
            type="password"
            required
            value={form.newPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </section>
  );
};

export default SettingsPage;
