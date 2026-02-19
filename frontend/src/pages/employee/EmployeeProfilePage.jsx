import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { employeeApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import { resolveFileUrl } from "../../utils/format";

const EmployeeProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await employeeApi.myProfile();
      setProfile(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await employeeApi.updateMyProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        gender: profile.gender,
        skills: profile.skills || [],
        certifications: profile.certifications || []
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const response = await employeeApi.updateAvatar(file);
      setProfile((prev) => ({ ...prev, avatarUrl: response.avatarUrl }));
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <LoadingSpinner label="Loading profile..." />;
  if (error) return <ErrorState message={error} onRetry={loadProfile} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Profile Management</h1>
      </header>

      <div className="card profile-card">
        <div className="profile-avatar">
          {profile.avatarUrl ? <img src={resolveFileUrl(profile.avatarUrl)} alt="Profile avatar" /> : <span>Avatar</span>}
        </div>
        <label className="btn btn-outline">
          Upload Picture
          <input type="file" accept="image/*" hidden onChange={handleAvatar} />
        </label>
      </div>

      <form className="card form-grid" onSubmit={handleSave}>
        <h3>Personal Information</h3>

        <label>
          First Name
          <input
            value={profile.firstName || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, firstName: event.target.value }))}
          />
        </label>
        <label>
          Last Name
          <input
            value={profile.lastName || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, lastName: event.target.value }))}
          />
        </label>
        <label>
          Phone
          <input
            value={profile.phone || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
          />
        </label>
        <label>
          Gender
          <select
            value={profile.gender || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, gender: event.target.value }))}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </label>

        <label className="full-width">
          Skills (comma separated)
          <input
            value={(profile.skills || []).join(", ")}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                skills: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              }))
            }
          />
        </label>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </section>
  );
};

export default EmployeeProfilePage;
