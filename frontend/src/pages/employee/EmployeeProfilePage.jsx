import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { City, Country, State } from "country-state-city";
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

  const countries = useMemo(() => Country.getAllCountries(), []);
  const profileCountryCode = useMemo(
    () => countries.find((item) => item.name === (profile?.address?.country || ""))?.isoCode || "",
    [countries, profile?.address?.country]
  );
  const profileStates = useMemo(
    () => (profileCountryCode ? State.getStatesOfCountry(profileCountryCode) : []),
    [profileCountryCode]
  );
  const profileStateCode = useMemo(
    () => profileStates.find((item) => item.name === (profile?.address?.state || ""))?.isoCode || "",
    [profileStates, profile?.address?.state]
  );
  const profileCities = useMemo(
    () => (profileCountryCode && profileStateCode ? City.getCitiesOfState(profileCountryCode, profileStateCode) : []),
    [profileCountryCode, profileStateCode]
  );

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
        personalEmail: profile.personalEmail,
        alternatePhone: profile.alternatePhone,
        dob: profile.dob,
        gender: profile.gender,
        maritalStatus: profile.maritalStatus,
        bloodGroup: profile.bloodGroup,
        nationality: profile.nationality,
        workMode: profile.workMode,
        employmentType: profile.employmentType,
        emergencyContact: profile.emergencyContact,
        governmentIds: profile.governmentIds,
        bankDetails: profile.bankDetails,
        experience: profile.experience,
        address: profile.address,
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

      <div className="card profile-card" style={{ marginBottom: "20px" }}>
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

      <form className="profile-form-layout" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="card profile-form-card">
          <div className="card-head" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem" }}>Personal Information</h3>
          </div>
          <div className="form-grid">
            <label>First Name<input value={profile.firstName || ""} onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))} /></label>
            <label>Last Name<input value={profile.lastName || ""} onChange={(e) => setProfile(p => ({ ...p, lastName: e.target.value }))} /></label>
            <label>Phone<input value={profile.phone || ""} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} /></label>
            <label>Personal Email<input type="email" value={profile.personalEmail || ""} onChange={(e) => setProfile(p => ({ ...p, personalEmail: e.target.value }))} /></label>
            <label>Alternate Phone<input value={profile.alternatePhone || ""} onChange={(e) => setProfile(p => ({ ...p, alternatePhone: e.target.value }))} /></label>
            <label>Date of Birth<input type="date" value={profile.dob ? new Date(profile.dob).toISOString().slice(0, 10) : ""} onChange={(e) => setProfile(p => ({ ...p, dob: e.target.value }))} /></label>
            <label>Gender<select value={profile.gender || ""} onChange={(e) => setProfile(p => ({ ...p, gender: e.target.value }))}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="non-binary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option></select></label>
            <label>Marital Status<select value={profile.maritalStatus || ""} onChange={(e) => setProfile(p => ({ ...p, maritalStatus: e.target.value }))}><option value="">Select</option><option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option><option value="prefer-not-to-say">Prefer not to say</option></select></label>
            <label>Blood Group<select value={profile.bloodGroup || ""} onChange={(e) => setProfile(p => ({ ...p, bloodGroup: e.target.value }))}><option value="">Select</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option></select></label>
            <label>Nationality<input value={profile.nationality || ""} onChange={(e) => setProfile(p => ({ ...p, nationality: e.target.value }))} /></label>
            <label>Work Mode<select value={profile.workMode || "onsite"} onChange={(e) => setProfile(p => ({ ...p, workMode: e.target.value }))}><option value="onsite">Onsite</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></label>
            <label>Employment Type<select value={profile.employmentType || "full-time"} onChange={(e) => setProfile(p => ({ ...p, employmentType: e.target.value }))}><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="intern">Intern</option></select></label>
          </div>
        </div>

        <div className="card profile-form-card">
          <div className="card-head" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem" }}>Emergency Contact & Address</h3>
          </div>
          <div className="form-grid">
            <label>Emergency Name<input value={profile.emergencyContact?.name || ""} onChange={(e) => setProfile(p => ({ ...p, emergencyContact: { ...(p.emergencyContact || {}), name: e.target.value } }))} /></label>
            <label>Relation<input value={profile.emergencyContact?.relation || ""} onChange={(e) => setProfile(p => ({ ...p, emergencyContact: { ...(p.emergencyContact || {}), relation: e.target.value } }))} /></label>
            <label>Emergency Phone<input value={profile.emergencyContact?.phone || ""} onChange={(e) => setProfile(p => ({ ...p, emergencyContact: { ...(p.emergencyContact || {}), phone: e.target.value } }))} /></label>
            <div className="full-width" />
            <label className="full-width">Address Line 1<input value={profile.address?.line1 || ""} onChange={(e) => setProfile(p => ({ ...p, address: { ...(p.address || {}), line1: e.target.value } }))} /></label>
            <label>Country
              <select value={profile.address?.country || ""} onChange={(e) => setProfile(p => ({ ...p, address: { ...(p.address || {}), country: e.target.value, state: "", city: "" } }))}>
                <option value="">Select country</option>{countries.map((item) => <option key={item.isoCode} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <label>State
              <select value={profile.address?.state || ""} onChange={(e) => setProfile(p => ({ ...p, address: { ...(p.address || {}), state: e.target.value, city: "" } }))}>
                <option value="">Select state</option>{profileStates.map((item) => <option key={item.isoCode} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <label>City
              <select value={profile.address?.city || ""} onChange={(e) => setProfile(p => ({ ...p, address: { ...(p.address || {}), city: e.target.value } }))}>
                <option value="">Select city</option>{profileCities.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <label>Postal Code<input value={profile.address?.postalCode || ""} onChange={(e) => setProfile(p => ({ ...p, address: { ...(p.address || {}), postalCode: e.target.value } }))} /></label>
          </div>
        </div>

        <div className="card profile-form-card">
          <div className="card-head" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem" }}>Experience & Skills</h3>
          </div>
          <div className="form-grid">
            <label>Experience (Years)<input type="number" value={profile.experience?.totalYears || ""} onChange={(e) => setProfile(p => ({ ...p, experience: { ...(p.experience || {}), totalYears: Number(e.target.value || 0) } }))} /></label>
            <label>Previous Company<input value={profile.experience?.previousCompany || ""} onChange={(e) => setProfile(p => ({ ...p, experience: { ...(p.experience || {}), previousCompany: e.target.value } }))} /></label>
            <label className="full-width">Skills (comma separated)<input value={(profile.skills || []).join(", ")} onChange={(e) => setProfile(p => ({ ...p, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} /></label>
            <label className="full-width">Professional Bio<textarea value={profile.bio || ""} onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))} /></label>
          </div>
        </div>

        <div className="card profile-form-card">
          <div className="card-head" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem" }}>Compliance & Financial</h3>
          </div>
          <div className="form-grid">
            <label>PAN<input value={profile.governmentIds?.pan || ""} onChange={(e) => setProfile(p => ({ ...p, governmentIds: { ...(p.governmentIds || {}), pan: e.target.value } }))} /></label>
            <label>Aadhaar<input value={profile.governmentIds?.aadhaar || ""} onChange={(e) => setProfile(p => ({ ...p, governmentIds: { ...(p.governmentIds || {}), aadhaar: e.target.value } }))} /></label>
            <label>Bank Name<input value={profile.bankDetails?.bankName || ""} onChange={(e) => setProfile(p => ({ ...p, bankDetails: { ...(p.bankDetails || {}), bankName: e.target.value } }))} /></label>
            <label>Account Number<input value={profile.bankDetails?.accountNumber || ""} onChange={(e) => setProfile(p => ({ ...p, bankDetails: { ...(p.bankDetails || {}), accountNumber: e.target.value } }))} /></label>
            <label>IFSC Code<input value={profile.bankDetails?.ifsc || ""} onChange={(e) => setProfile(p => ({ ...p, bankDetails: { ...(p.bankDetails || {}), ifsc: e.target.value } }))} /></label>
          </div>
        </div>

        <div className="profile-form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button className="btn btn-primary" type="submit" disabled={saving} style={{ padding: "10px 24px", fontSize: "1rem" }}>
            {saving ? "Saving Changes..." : "Save Profile Details"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default EmployeeProfilePage;
