import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { employeeApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import useAuth from "../../hooks/useAuth";
import { resolveFileUrl } from "../../utils/format";

const EmployeeProfilePage = () => {
  const { refreshMe } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());

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
        workMode: profile.workMode,
        employmentType: profile.employmentType,
        emergencyContact: profile.emergencyContact,
        bio: profile.bio,
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
      setAvatarVersion(Date.now());
      await refreshMe();
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
        <div>
          <h1>Profile Management</h1>
          {profile?.employeeId ? <p className="muted">Employee ID: {profile.employeeId}</p> : null}
        </div>
      </header>

      <div className="card profile-card">
        <div className="profile-avatar">
          {profile.avatarUrl ? (
            <img src={`${resolveFileUrl(profile.avatarUrl)}?v=${avatarVersion}`} alt="Profile avatar" />
          ) : (
            <span>{`${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}` || "A"}</span>
          )}
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
        <label>
          Work Mode
          <select
            value={profile.workMode || "onsite"}
            onChange={(event) => setProfile((prev) => ({ ...prev, workMode: event.target.value }))}
          >
            <option value="onsite">Onsite</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
        </label>
        <label>
          Employment Type
          <select
            value={profile.employmentType || "full-time"}
            onChange={(event) => setProfile((prev) => ({ ...prev, employmentType: event.target.value }))}
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
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

        <label>
          Emergency Contact Name
          <input
            value={profile.emergencyContact?.name || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                emergencyContact: { ...(prev.emergencyContact || {}), name: event.target.value }
              }))
            }
          />
        </label>
        <label>
          Emergency Contact Relation
          <input
            value={profile.emergencyContact?.relation || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                emergencyContact: { ...(prev.emergencyContact || {}), relation: event.target.value }
              }))
            }
          />
        </label>
        <label>
          Emergency Contact Phone
          <input
            value={profile.emergencyContact?.phone || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                emergencyContact: { ...(prev.emergencyContact || {}), phone: event.target.value }
              }))
            }
          />
        </label>

        <label className="full-width">
          Professional Bio
          <textarea
            value={profile.bio || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
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
