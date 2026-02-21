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
          Personal Email
          <input
            type="email"
            value={profile.personalEmail || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, personalEmail: event.target.value }))}
          />
        </label>
        <label>
          Alternate Phone
          <input
            value={profile.alternatePhone || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, alternatePhone: event.target.value }))}
          />
        </label>
        <label>
          Date of Birth
          <input
            type="date"
            value={profile.dob ? new Date(profile.dob).toISOString().slice(0, 10) : ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, dob: event.target.value }))}
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
          Marital Status
          <select
            value={profile.maritalStatus || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, maritalStatus: event.target.value }))}
          >
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
          <select
            value={profile.bloodGroup || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, bloodGroup: event.target.value }))}
          >
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
          <input
            value={profile.nationality || ""}
            onChange={(event) => setProfile((prev) => ({ ...prev, nationality: event.target.value }))}
          />
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

        <label>
          Experience (Years)
          <input
            type="number"
            value={profile.experience?.totalYears || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                experience: { ...(prev.experience || {}), totalYears: Number(event.target.value || 0) }
              }))
            }
          />
        </label>
        <label>
          Previous Company
          <input
            value={profile.experience?.previousCompany || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                experience: { ...(prev.experience || {}), previousCompany: event.target.value }
              }))
            }
          />
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
          Address Line 1
          <input
            value={profile.address?.line1 || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                address: { ...(prev.address || {}), line1: event.target.value }
              }))
            }
          />
        </label>
        <label>
          City
          <select
            value={profile.address?.city || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                address: { ...(prev.address || {}), city: event.target.value }
              }))
            }
          >
            <option value="">Select city</option>
            {profileCities.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          State
          <select
            value={profile.address?.state || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                address: { ...(prev.address || {}), state: event.target.value, city: "" }
              }))
            }
          >
            <option value="">Select state</option>
            {profileStates.map((item) => (
              <option key={item.isoCode} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Country
          <select
            value={profile.address?.country || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                address: { ...(prev.address || {}), country: event.target.value, state: "", city: "" }
              }))
            }
          >
            <option value="">Select country</option>
            {countries.map((item) => (
              <option key={item.isoCode} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Postal Code
          <input
            value={profile.address?.postalCode || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                address: { ...(prev.address || {}), postalCode: event.target.value }
              }))
            }
          />
        </label>

        <label>
          PAN
          <input
            value={profile.governmentIds?.pan || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                governmentIds: { ...(prev.governmentIds || {}), pan: event.target.value }
              }))
            }
          />
        </label>
        <label>
          Aadhaar
          <input
            value={profile.governmentIds?.aadhaar || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                governmentIds: { ...(prev.governmentIds || {}), aadhaar: event.target.value }
              }))
            }
          />
        </label>
        <label>
          Bank Name
          <input
            value={profile.bankDetails?.bankName || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                bankDetails: { ...(prev.bankDetails || {}), bankName: event.target.value }
              }))
            }
          />
        </label>
        <label>
          Account Number
          <input
            value={profile.bankDetails?.accountNumber || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                bankDetails: { ...(prev.bankDetails || {}), accountNumber: event.target.value }
              }))
            }
          />
        </label>
        <label>
          IFSC
          <input
            value={profile.bankDetails?.ifsc || ""}
            onChange={(event) =>
              setProfile((prev) => ({
                ...prev,
                bankDetails: { ...(prev.bankDetails || {}), ifsc: event.target.value }
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
