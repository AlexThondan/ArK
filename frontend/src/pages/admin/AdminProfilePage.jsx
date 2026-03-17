import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, RefreshCcw, ShieldCheck } from "lucide-react";
import { employeeApi } from "../../api/hrmsApi";
import { authApi } from "../../api/authApi";
import useAuth from "../../hooks/useAuth";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import { resolveFileUrl } from "../../utils/format";

const emptyProfileForm = {
  firstName: "",
  lastName: "",
  phone: "",
  personalEmail: "",
  alternatePhone: "",
  department: "",
  designation: "",
  nationality: "",
  workMode: "onsite",
  employmentType: "full-time",
  bio: "",
  emergencyName: "",
  emergencyRelation: "",
  emergencyPhone: ""
};

const AdminProfilePage = () => {
  const { user, profile, refreshMe, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  const [form, setForm] = useState(emptyProfileForm);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await employeeApi.myProfile();
      const row = response.data || {};
      setForm({
        firstName: row.firstName || "",
        lastName: row.lastName || "",
        phone: row.phone || "",
        personalEmail: row.personalEmail || "",
        alternatePhone: row.alternatePhone || "",
        department: row.department || "",
        designation: row.designation || "",
        nationality: row.nationality || "",
        workMode: row.workMode || "onsite",
        employmentType: row.employmentType || "full-time",
        bio: row.bio || "",
        emergencyName: row.emergencyContact?.name || "",
        emergencyRelation: row.emergencyContact?.relation || "",
        emergencyPhone: row.emergencyContact?.phone || ""
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const fullName = useMemo(
    () => `${form.firstName || ""} ${form.lastName || ""}`.trim() || user?.email || "Admin",
    [form.firstName, form.lastName, user?.email]
  );

  const onSaveProfile = async (event) => {
    event.preventDefault();
    try {
      setSavingProfile(true);
      await employeeApi.updateMyProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        personalEmail: form.personalEmail,
        alternatePhone: form.alternatePhone,
        nationality: form.nationality,
        workMode: form.workMode,
        employmentType: form.employmentType,
        bio: form.bio,
        emergencyContact: {
          name: form.emergencyName,
          relation: form.emergencyRelation,
          phone: form.emergencyPhone
        }
      });
      await refreshMe();
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.message || "Unable to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const onAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await employeeApi.updateAvatar(file);
      await refreshMe();
      setAvatarVersion(Date.now());
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err.message || "Unable to upload avatar");
    }
  };

  const onChangePassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      setSavingPassword(true);
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err.message || "Unable to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading admin profile..." />;
  if (error) return <ErrorState message={error} onRetry={loadProfile} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Profile & Session</h1>
        <button type="button" className="btn btn-outline" onClick={async () => refreshMe()}>
          <RefreshCcw size={14} />
          Refresh Session
        </button>
      </header>

      <section className="profile-hero">
        <div className="profile-hero-main">
          <div className="avatar-cell profile-avatar-large">
            {profile?.avatarUrl ? (
              <img className="avatar-img" src={`${resolveFileUrl(profile.avatarUrl)}?v=${avatarVersion}`} alt={fullName} />
            ) : (
              <span className="avatar-fallback">
                {(form.firstName || "A").slice(0, 1)}
                {(form.lastName || "").slice(0, 1)}
              </span>
            )}
          </div>
          <div>
            <h2>{fullName}</h2>
            <p className="profile-hero-subtitle">{form.designation || "Admin"}</p>
            <p className="profile-hero-email muted">{user?.email || "-"}</p>
            <div className="hero-id-row">
              <span className="status-pill success">{user?.isActive ? "Active" : "Inactive"}</span>
              {form.department ? <span className="hero-id">{form.department}</span> : null}
              {profile?.employeeId ? <span className="hero-id">ID: {profile.employeeId}</span> : null}
            </div>
          </div>
          <label className="btn btn-outline">
            Upload Avatar
            <input type="file" accept="image/*" hidden onChange={onAvatarChange} />
          </label>
        </div>
        <div className="hero-stat-grid">
          <div className="hero-stat">
            <p>Work Mode</p>
            <strong>{form.workMode || "-"}</strong>
          </div>
          <div className="hero-stat">
            <p>Employment Type</p>
            <strong>{form.employmentType || "-"}</strong>
          </div>
          <div className="hero-stat">
            <p>Emergency Contact</p>
            <strong>{form.emergencyName || "-"}</strong>
          </div>
          <div className="hero-stat">
            <p>Emergency Phone</p>
            <strong>{form.emergencyPhone || "-"}</strong>
          </div>
        </div>
      </section>

      <form className="card form-grid" onSubmit={onSaveProfile}>
        <h3>Editable Profile Details</h3>
        <label>
          First Name
          <input value={form.firstName} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} required />
        </label>
        <label>
          Last Name
          <input value={form.lastName} onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))} required />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
        </label>
        <label>
          Personal Email
          <input type="email" value={form.personalEmail} onChange={(event) => setForm((prev) => ({ ...prev, personalEmail: event.target.value }))} />
        </label>
        <label>
          Alternate Phone
          <input value={form.alternatePhone} onChange={(event) => setForm((prev) => ({ ...prev, alternatePhone: event.target.value }))} />
        </label>
        <label>
          Nationality
          <input value={form.nationality} onChange={(event) => setForm((prev) => ({ ...prev, nationality: event.target.value }))} />
        </label>
        <label>
          Department
          <input value={form.department} readOnly />
        </label>
        <label>
          Designation
          <input value={form.designation} readOnly />
        </label>
        <label>
          Work Mode
          <select value={form.workMode} onChange={(event) => setForm((prev) => ({ ...prev, workMode: event.target.value }))}>
            <option value="onsite">Onsite</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
        </label>
        <label>
          Employment Type
          <select value={form.employmentType} onChange={(event) => setForm((prev) => ({ ...prev, employmentType: event.target.value }))}>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
        </label>
        <label>
          Emergency Contact Name
          <input value={form.emergencyName} onChange={(event) => setForm((prev) => ({ ...prev, emergencyName: event.target.value }))} />
        </label>
        <label>
          Emergency Contact Relation
          <input value={form.emergencyRelation} onChange={(event) => setForm((prev) => ({ ...prev, emergencyRelation: event.target.value }))} />
        </label>
        <label>
          Emergency Contact Phone
          <input value={form.emergencyPhone} onChange={(event) => setForm((prev) => ({ ...prev, emergencyPhone: event.target.value }))} />
        </label>
        <label className="full-width">
          Professional Bio
          <textarea value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} />
        </label>
        <div className="button-row full-width settings-actions">
          <button type="submit" className="btn btn-primary" disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>

      <section className="panel-grid two">
        <form className="card form-grid" onSubmit={onChangePassword}>
          <h3>
            <KeyRound size={16} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
            Change Password
          </h3>
          <label>
            Current Password
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            />
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            />
          </label>
          <div className="button-row full-width settings-actions">
            <button type="submit" className="btn btn-primary" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>

        <article className="card admin-option-card tone-violet-solid">
          <div className="inline-title">
            <ShieldCheck size={16} />
            <h3>Session Controls</h3>
          </div>
          <p>You can refresh the active profile session or securely log out from here.</p>
          <div className="button-row">
            <button type="button" className="btn btn-outline" onClick={() => refreshMe()}>
              Refresh Session
            </button>
            <button type="button" className="btn btn-danger" onClick={logout}>
              Logout
            </button>
          </div>
        </article>
      </section>
    </section>
  );
};

export default AdminProfilePage;
