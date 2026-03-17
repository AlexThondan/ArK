import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { employeeApi, documentApi, leaveApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import useAuth from "../../hooks/useAuth";
import { formatDate, resolveFileUrl } from "../../utils/format";

const TABS = ["overview", "employment", "documents", "leave", "benefits"];

const formatBytes = (value) => {
  const bytes = Number(value || 0);
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = (bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1);
  return `${size} ${units[index]}`;
};

const buildLocation = (profile) =>
  [profile?.address?.city, profile?.address?.state, profile?.address?.country].filter(Boolean).join(", ");

const EmployeeProfilePage = () => {
  const { refreshMe } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [saving, setSaving] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  const [activeTab, setActiveTab] = useState("overview");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [profileRes, documentRes, leaveRes] = await Promise.all([
        employeeApi.myProfile(),
        documentApi.my({ limit: 6 }),
        leaveApi.my({ limit: 6 })
      ]);
      setProfile(profileRes.data);
      setDocuments(documentRes.data || []);
      setLeaves(leaveRes.data || []);
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

  const displayName = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
  const locationString = buildLocation(profile) || "Location not provided";
  const leaveBalance = profile?.leaveBalance || { annual: 0, sick: 0, casual: 0 };
  const leaveUsed = leaves
    .filter((row) => row.status === "approved")
    .reduce((sum, row) => sum + Number(row.days || 0), 0);

  return (
    <section className="page-grid">
      <header className="page-head">
        <div>
          <h1>Profile Overview</h1>
          {profile?.employeeId ? <p className="muted">Employee ID: {profile.employeeId}</p> : null}
        </div>
        <div className="button-row">
          <button className="btn btn-outline" type="button" onClick={() => setActiveTab("overview")}>
            Overview
          </button>
          <button className="btn btn-primary" type="button" onClick={() => document.getElementById("profile-edit")?.scrollIntoView({ behavior: "smooth" })}>
            Edit Profile
          </button>
        </div>
      </header>

      <section className="profile-hero">
        <div className="profile-hero-main">
          <div className="avatar-cell profile-avatar-large">
            {profile?.avatarUrl ? (
              <img src={`${resolveFileUrl(profile.avatarUrl)}?v=${avatarVersion}`} alt={displayName || "Profile"} />
            ) : (
              <span className="avatar-fallback">{`${profile?.firstName?.[0] || ""}${profile?.lastName?.[0] || ""}` || "A"}</span>
            )}
          </div>
          <div>
            <h2>{displayName || "Employee"}</h2>
            <p className="profile-hero-subtitle">{profile?.designation || "Employee"}</p>
            <p className="profile-hero-email muted">{profile?.user?.email || "-"}</p>
            <div className="hero-id-row">
              <span className="status-pill success">{profile?.user?.isActive ? "Active" : "Inactive"}</span>
              {profile?.department ? <span className="hero-id">{profile.department}</span> : null}
              {profile?.employeeId ? <span className="hero-id">ID: {profile.employeeId}</span> : null}
            </div>
            <div className="hero-contact-row">
              <div>
                <small className="muted">Location</small>
                <strong>{locationString}</strong>
              </div>
              <div>
                <small className="muted">Phone</small>
                <strong>{profile?.phone || "-"}</strong>
              </div>
              <div>
                <small className="muted">Work Mode</small>
                <strong>{profile?.workMode || "-"}</strong>
              </div>
            </div>
          </div>
          <label className="btn btn-outline">
            Upload Picture
            <input type="file" accept="image/*" hidden onChange={handleAvatar} />
          </label>
        </div>

        <div className="hero-stat-grid">
          <div className="hero-stat">
            <p>Employment Type</p>
            <strong>{profile?.employmentType || "-"}</strong>
          </div>
          <div className="hero-stat">
            <p>Join Date</p>
            <strong>{formatDate(profile?.joinDate)}</strong>
          </div>
          <div className="hero-stat">
            <p>Leave Balance</p>
            <strong>{leaveBalance.annual + leaveBalance.sick + leaveBalance.casual} days</strong>
          </div>
          <div className="hero-stat">
            <p>Leave Used</p>
            <strong>{leaveUsed} days</strong>
          </div>
        </div>
      </section>

      <div className="profile-tab-row">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`profile-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <section className="profile-overview-grid">
          <article className="card profile-info-card">
            <div className="profile-section-head">
              <div>
                <h3>Personal Information</h3>
                <p className="section-subtitle">Primary identity and contact channels.</p>
              </div>
            </div>
            <div className="profile-info-grid">
              <div>
                <small className="muted">Full Legal Name</small>
                <strong>{displayName || "-"}</strong>
              </div>
              <div>
                <small className="muted">Email Address</small>
                <strong>{profile?.user?.email || "-"}</strong>
              </div>
              <div>
                <small className="muted">Phone Number</small>
                <strong>{profile?.phone || "-"}</strong>
              </div>
              <div>
                <small className="muted">Date of Birth</small>
                <strong>{formatDate(profile?.dob)}</strong>
              </div>
              <div>
                <small className="muted">Emergency Contact</small>
                <strong>{profile?.emergencyContact?.name || "-"}</strong>
                <span className="muted">{profile?.emergencyContact?.phone || ""}</span>
              </div>
              <div>
                <small className="muted">Address</small>
                <strong>{locationString}</strong>
              </div>
            </div>
          </article>

          <article className="card profile-info-card">
            <div className="profile-section-head">
              <div>
                <h3>Employment</h3>
                <p className="section-subtitle">Role, department, and reporting details.</p>
              </div>
            </div>
            <div className="profile-info-grid">
              <div>
                <small className="muted">Department</small>
                <strong>{profile?.department || "-"}</strong>
              </div>
              <div>
                <small className="muted">Designation</small>
                <strong>{profile?.designation || "-"}</strong>
              </div>
              <div>
                <small className="muted">Employment Type</small>
                <strong>{profile?.employmentType || "-"}</strong>
              </div>
              <div>
                <small className="muted">Work Mode</small>
                <strong>{profile?.workMode || "-"}</strong>
              </div>
              <div>
                <small className="muted">Manager</small>
                <strong>{profile?.manager || "-"}</strong>
              </div>
            </div>
          </article>

          <article className="card profile-info-card">
            <div className="profile-section-head">
              <div>
                <h3>Documents</h3>
                <p className="section-subtitle">Latest uploads and contracts.</p>
              </div>
            </div>
            <div className="profile-doc-list">
              {documents.length ? (
                documents.map((doc) => (
                  <div className="doc-item" key={doc._id}>
                    <div>
                      <strong>{doc.originalName || doc.type || "Document"}</strong>
                      <small className="muted">Added {formatDate(doc.createdAt)}</small>
                    </div>
                    <span className="muted">{formatBytes(doc.size)}</span>
                  </div>
                ))
              ) : (
                <p className="muted">No documents uploaded yet.</p>
              )}
            </div>
          </article>

          <article className="card profile-info-card">
            <div className="profile-section-head">
              <div>
                <h3>Leave History</h3>
                <p className="section-subtitle">Recent leave activity and balances.</p>
              </div>
            </div>
            <div className="leave-summary-grid">
              <div>
                <small className="muted">Available</small>
                <strong>{leaveBalance.annual + leaveBalance.sick + leaveBalance.casual} days</strong>
              </div>
              <div>
                <small className="muted">Used</small>
                <strong>{leaveUsed} days</strong>
              </div>
            </div>
            <div className="leave-list">
              {leaves.length ? (
                leaves.map((leave) => (
                  <div className="leave-item" key={leave._id}>
                    <div>
                      <strong>{leave.leaveType || "Leave"}</strong>
                      <small className="muted">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </small>
                    </div>
                    <span className={`status-pill ${leave.status === "approved" ? "success" : "warning"}`}>
                      {leave.status || "pending"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="muted">No recent leave requests.</p>
              )}
            </div>
          </article>

          <article className="card profile-info-card">
            <div className="profile-section-head">
              <div>
                <h3>Benefits & Coverage</h3>
                <p className="section-subtitle">Current benefit allocations.</p>
              </div>
            </div>
            <div className="benefits-grid">
              <div className="benefit-card">
                <strong>Health Insurance</strong>
                <small className="muted">Premium family plan</small>
              </div>
              <div className="benefit-card">
                <strong>Retirement</strong>
                <small className="muted">6% match, fully vested</small>
              </div>
              <div className="benefit-card">
                <strong>Wellness Credit</strong>
                <small className="muted">$50 / month</small>
              </div>
              <div className="benefit-card">
                <strong>Tech Allowance</strong>
                <small className="muted">$1,200 / year</small>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === "employment" ? (
        <section className="card profile-info-card">
          <h3>Employment Details</h3>
          <div className="profile-info-grid">
            <div>
              <small className="muted">Department</small>
              <strong>{profile?.department || "-"}</strong>
            </div>
            <div>
              <small className="muted">Designation</small>
              <strong>{profile?.designation || "-"}</strong>
            </div>
            <div>
              <small className="muted">Manager</small>
              <strong>{profile?.manager || "-"}</strong>
            </div>
            <div>
              <small className="muted">Employment Type</small>
              <strong>{profile?.employmentType || "-"}</strong>
            </div>
            <div>
              <small className="muted">Work Mode</small>
              <strong>{profile?.workMode || "-"}</strong>
            </div>
            <div>
              <small className="muted">Join Date</small>
              <strong>{formatDate(profile?.joinDate)}</strong>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "documents" ? (
        <section className="card profile-info-card">
          <h3>Documents</h3>
          <div className="profile-doc-list">
            {documents.length ? (
              documents.map((doc) => (
                <div className="doc-item" key={doc._id}>
                  <div>
                    <strong>{doc.originalName || doc.type || "Document"}</strong>
                    <small className="muted">Added {formatDate(doc.createdAt)}</small>
                  </div>
                  <span className="muted">{formatBytes(doc.size)}</span>
                </div>
              ))
            ) : (
              <p className="muted">No documents uploaded yet.</p>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "leave" ? (
        <section className="card profile-info-card">
          <h3>Leave History</h3>
          <div className="leave-summary-grid">
            <div>
              <small className="muted">Available</small>
              <strong>{leaveBalance.annual + leaveBalance.sick + leaveBalance.casual} days</strong>
            </div>
            <div>
              <small className="muted">Used</small>
              <strong>{leaveUsed} days</strong>
            </div>
          </div>
          <div className="leave-list">
            {leaves.length ? (
              leaves.map((leave) => (
                <div className="leave-item" key={leave._id}>
                  <div>
                    <strong>{leave.leaveType || "Leave"}</strong>
                    <small className="muted">
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </small>
                  </div>
                  <span className={`status-pill ${leave.status === "approved" ? "success" : "warning"}`}>
                    {leave.status || "pending"}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">No recent leave requests.</p>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "benefits" ? (
        <section className="card profile-info-card">
          <h3>Benefits & Coverage</h3>
          <div className="benefits-grid">
            <div className="benefit-card">
              <strong>Health Insurance</strong>
              <small className="muted">Premium family plan</small>
            </div>
            <div className="benefit-card">
              <strong>Retirement</strong>
              <small className="muted">6% match, fully vested</small>
            </div>
            <div className="benefit-card">
              <strong>Wellness Credit</strong>
              <small className="muted">$50 / month</small>
            </div>
            <div className="benefit-card">
              <strong>Tech Allowance</strong>
              <small className="muted">$1,200 / year</small>
            </div>
          </div>
        </section>
      ) : null}

      <form id="profile-edit" className="profile-form-layout" onSubmit={handleSave}>
        <div className="profile-form-cards">
          <div className="card profile-form-card">
            <div className="card-head profile-card-head">
              <h3>Personal Information</h3>
            </div>
            <div className="form-grid">
              <label>
                First Name
                <input value={profile.firstName || ""} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} />
              </label>
              <label>
                Last Name
                <input value={profile.lastName || ""} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} />
              </label>
              <label>
                Phone
                <input value={profile.phone || ""} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
              </label>
              <label>
                Personal Email
                <input type="email" value={profile.personalEmail || ""} onChange={(e) => setProfile((p) => ({ ...p, personalEmail: e.target.value }))} />
              </label>
              <label>
                Alternate Phone
                <input value={profile.alternatePhone || ""} onChange={(e) => setProfile((p) => ({ ...p, alternatePhone: e.target.value }))} />
              </label>
              <label>
                Date of Birth
                <input type="date" value={profile.dob ? new Date(profile.dob).toISOString().slice(0, 10) : ""} onChange={(e) => setProfile((p) => ({ ...p, dob: e.target.value }))} />
              </label>
              <label>
                Gender
                <select value={profile.gender || ""} onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </label>
              <label>
                Marital Status
                <select value={profile.maritalStatus || ""} onChange={(e) => setProfile((p) => ({ ...p, maritalStatus: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </label>
              <label>
                Blood Group
                <select value={profile.bloodGroup || ""} onChange={(e) => setProfile((p) => ({ ...p, bloodGroup: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </label>
              <label>
                Nationality
                <input value={profile.nationality || ""} onChange={(e) => setProfile((p) => ({ ...p, nationality: e.target.value }))} />
              </label>
              <label>
                Work Mode
                <select value={profile.workMode || "onsite"} onChange={(e) => setProfile((p) => ({ ...p, workMode: e.target.value }))}>
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                </select>
              </label>
              <label>
                Employment Type
                <select value={profile.employmentType || "full-time"} onChange={(e) => setProfile((p) => ({ ...p, employmentType: e.target.value }))}>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </label>
            </div>
          </div>

          <div className="card profile-form-card">
            <div className="card-head profile-card-head">
              <h3>Emergency Contact & Address</h3>
            </div>
            <div className="form-grid">
              <label>
                Emergency Name
                <input value={profile.emergencyContact?.name || ""} onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: { ...(p.emergencyContact || {}), name: e.target.value } }))} />
              </label>
              <label>
                Relation
                <input value={profile.emergencyContact?.relation || ""} onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: { ...(p.emergencyContact || {}), relation: e.target.value } }))} />
              </label>
              <label>
                Emergency Phone
                <input value={profile.emergencyContact?.phone || ""} onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: { ...(p.emergencyContact || {}), phone: e.target.value } }))} />
              </label>
              <div className="full-width" />
              <label className="full-width">
                Address Line 1
                <input value={profile.address?.line1 || ""} onChange={(e) => setProfile((p) => ({ ...p, address: { ...(p.address || {}), line1: e.target.value } }))} />
              </label>
              <label>
                City
                <input value={profile.address?.city || ""} onChange={(e) => setProfile((p) => ({ ...p, address: { ...(p.address || {}), city: e.target.value } }))} />
              </label>
              <label>
                State
                <input value={profile.address?.state || ""} onChange={(e) => setProfile((p) => ({ ...p, address: { ...(p.address || {}), state: e.target.value } }))} />
              </label>
              <label>
                Country
                <input value={profile.address?.country || ""} onChange={(e) => setProfile((p) => ({ ...p, address: { ...(p.address || {}), country: e.target.value } }))} />
              </label>
              <label>
                Postal Code
                <input value={profile.address?.postalCode || ""} onChange={(e) => setProfile((p) => ({ ...p, address: { ...(p.address || {}), postalCode: e.target.value } }))} />
              </label>
            </div>
          </div>

          <div className="card profile-form-card">
            <div className="card-head profile-card-head">
              <h3>Experience & Skills</h3>
            </div>
            <div className="form-grid">
              <label>
                Experience (Years)
                <input type="number" value={profile.experience?.totalYears || ""} onChange={(e) => setProfile((p) => ({ ...p, experience: { ...(p.experience || {}), totalYears: Number(e.target.value || 0) } }))} />
              </label>
              <label>
                Previous Company
                <input value={profile.experience?.previousCompany || ""} onChange={(e) => setProfile((p) => ({ ...p, experience: { ...(p.experience || {}), previousCompany: e.target.value } }))} />
              </label>
              <label className="full-width">
                Skills (comma separated)
                <input value={(profile.skills || []).join(", ")} onChange={(e) => setProfile((p) => ({ ...p, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} />
              </label>
              <label className="full-width">
                Professional Bio
                <textarea value={profile.bio || ""} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
              </label>
            </div>
          </div>

          <div className="card profile-form-card">
            <div className="card-head profile-card-head">
              <h3>Compliance & Financial</h3>
            </div>
            <div className="form-grid">
              <label>
                PAN
                <input value={profile.governmentIds?.pan || ""} onChange={(e) => setProfile((p) => ({ ...p, governmentIds: { ...(p.governmentIds || {}), pan: e.target.value } }))} />
              </label>
              <label>
                Aadhaar
                <input value={profile.governmentIds?.aadhaar || ""} onChange={(e) => setProfile((p) => ({ ...p, governmentIds: { ...(p.governmentIds || {}), aadhaar: e.target.value } }))} />
              </label>
              <label>
                Bank Name
                <input value={profile.bankDetails?.bankName || ""} onChange={(e) => setProfile((p) => ({ ...p, bankDetails: { ...(p.bankDetails || {}), bankName: e.target.value } }))} />
              </label>
              <label>
                Account Number
                <input value={profile.bankDetails?.accountNumber || ""} onChange={(e) => setProfile((p) => ({ ...p, bankDetails: { ...(p.bankDetails || {}), accountNumber: e.target.value } }))} />
              </label>
              <label>
                IFSC Code
                <input value={profile.bankDetails?.ifsc || ""} onChange={(e) => setProfile((p) => ({ ...p, bankDetails: { ...(p.bankDetails || {}), ifsc: e.target.value } }))} />
              </label>
            </div>
          </div>
        </div>

        <div className="profile-form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving Changes..." : "Save Profile Details"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default EmployeeProfilePage;
