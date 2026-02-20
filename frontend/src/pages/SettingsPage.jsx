import { useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi";
import useTheme from "../hooks/useTheme";

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    try {
      setLoading(true);
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      toast.success("Password updated");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
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
        <h3>Theme</h3>
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
        <label>
          Confirm Password
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
          />
        </label>
        <div className="button-row full-width settings-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default SettingsPage;
