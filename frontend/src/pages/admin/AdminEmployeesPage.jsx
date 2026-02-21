import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Eye, Pencil, Power, PowerOff, UserPlus } from "lucide-react";
import { City, Country, State } from "country-state-city";
import { employeeApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import FormModal from "../../components/common/FormModal";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDate, resolveFileUrl } from "../../utils/format";

const initialForm = {
  employeeId: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  personalEmail: "",
  alternatePhone: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  bloodGroup: "",
  nationality: "",
  department: "",
  designation: "",
  salary: "",
  joinDate: "",
  workMode: "onsite",
  employmentType: "full-time",
  role: "employee",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  emergencyName: "",
  emergencyRelation: "",
  emergencyPhone: "",
  pan: "",
  aadhaar: "",
  passport: "",
  bankAccountHolder: "",
  bankAccountNumber: "",
  bankIfsc: "",
  bankName: "",
  bankBranch: "",
  upiId: "",
  experienceYears: "",
  previousCompany: "",
  skills: ""
};

const mapFormToPayload = (form) => ({
  employeeId: form.employeeId,
  email: form.email,
  password: form.password,
  firstName: form.firstName,
  lastName: form.lastName,
  phone: form.phone,
  personalEmail: form.personalEmail,
  alternatePhone: form.alternatePhone,
  dob: form.dob || undefined,
  gender: form.gender || undefined,
  maritalStatus: form.maritalStatus || undefined,
  bloodGroup: form.bloodGroup || undefined,
  nationality: form.nationality,
  department: form.department,
  designation: form.designation,
  salary: Number(form.salary || 0),
  joinDate: form.joinDate || undefined,
  workMode: form.workMode,
  employmentType: form.employmentType,
  role: form.role,
  address: {
    line1: form.addressLine1,
    line2: form.addressLine2,
    city: form.city,
    state: form.state,
    country: form.country,
    postalCode: form.postalCode
  },
  emergencyContact: {
    name: form.emergencyName,
    relation: form.emergencyRelation,
    phone: form.emergencyPhone
  },
  governmentIds: {
    pan: form.pan,
    aadhaar: form.aadhaar,
    passport: form.passport
  },
  bankDetails: {
    accountHolder: form.bankAccountHolder,
    accountNumber: form.bankAccountNumber,
    ifsc: form.bankIfsc,
    bankName: form.bankName,
    branch: form.bankBranch,
    upiId: form.upiId
  },
  experience: {
    totalYears: Number(form.experienceYears || 0),
    previousCompany: form.previousCompany
  },
  skills: form.skills
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
});

const mapRowToEdit = (row) => ({
  userId: row.user?._id,
  user: row.user,
  employeeId: row.employeeId || "",
  email: row.user?.email || "",
  firstName: row.firstName || "",
  lastName: row.lastName || "",
  phone: row.phone || "",
  personalEmail: row.personalEmail || "",
  alternatePhone: row.alternatePhone || "",
  dob: row.dob ? new Date(row.dob).toISOString().slice(0, 10) : "",
  gender: row.gender || "",
  maritalStatus: row.maritalStatus || "",
  bloodGroup: row.bloodGroup || "",
  nationality: row.nationality || "",
  department: row.department || "",
  designation: row.designation || "",
  salary: row.salary || "",
  joinDate: row.joinDate ? new Date(row.joinDate).toISOString().slice(0, 10) : "",
  workMode: row.workMode || "onsite",
  employmentType: row.employmentType || "full-time",
  role: row.user?.role || "employee",
  isActive: Boolean(row.user?.isActive),
  addressLine1: row.address?.line1 || "",
  addressLine2: row.address?.line2 || "",
  city: row.address?.city || "",
  state: row.address?.state || "",
  country: row.address?.country || "",
  postalCode: row.address?.postalCode || "",
  emergencyName: row.emergencyContact?.name || "",
  emergencyRelation: row.emergencyContact?.relation || "",
  emergencyPhone: row.emergencyContact?.phone || "",
  pan: row.governmentIds?.pan || "",
  aadhaar: row.governmentIds?.aadhaar || "",
  passport: row.governmentIds?.passport || "",
  bankAccountHolder: row.bankDetails?.accountHolder || "",
  bankAccountNumber: row.bankDetails?.accountNumber || "",
  bankIfsc: row.bankDetails?.ifsc || "",
  bankName: row.bankDetails?.bankName || "",
  bankBranch: row.bankDetails?.branch || "",
  upiId: row.bankDetails?.upiId || "",
  experienceYears: row.experience?.totalYears || "",
  previousCompany: row.experience?.previousCompany || "",
  skills: Array.isArray(row.skills) ? row.skills.join(", ") : ""
});

const employeeDetailsLabel = (row) => `${row.firstName} ${row.lastName}`.trim();

const AdminEmployeesPage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [], pagination: {} });
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const createCountryCode = useMemo(
    () => countries.find((item) => item.name === form.country)?.isoCode || "",
    [countries, form.country]
  );
  const createStates = useMemo(
    () => (createCountryCode ? State.getStatesOfCountry(createCountryCode) : []),
    [createCountryCode]
  );
  const createStateCode = useMemo(
    () => createStates.find((item) => item.name === form.state)?.isoCode || "",
    [createStates, form.state]
  );
  const createCities = useMemo(
    () => (createCountryCode && createStateCode ? City.getCitiesOfState(createCountryCode, createStateCode) : []),
    [createCountryCode, createStateCode]
  );

  const editCountryCode = useMemo(
    () => countries.find((item) => item.name === (editing?.country || ""))?.isoCode || "",
    [countries, editing?.country]
  );
  const editStates = useMemo(
    () => (editCountryCode ? State.getStatesOfCountry(editCountryCode) : []),
    [editCountryCode]
  );
  const editStateCode = useMemo(
    () => editStates.find((item) => item.name === (editing?.state || ""))?.isoCode || "",
    [editStates, editing?.state]
  );
  const editCities = useMemo(
    () => (editCountryCode && editStateCode ? City.getCitiesOfState(editCountryCode, editStateCode) : []),
    [editCountryCode, editStateCode]
  );

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await employeeApi.list({ page, limit: 15 });
      setState({
        loading: false,
        error: "",
        rows: response.data || [],
        pagination: response.pagination || {}
      });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [], pagination: {} });
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await employeeApi.create(mapFormToPayload(form));
      toast.success("Employee created");
      setShowCreate(false);
      setForm(initialForm);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editing) return;
    try {
      const payload = mapFormToPayload({
        ...editing,
        password: "",
        email: editing.email,
        role: editing.role
      });
      await employeeApi.update(editing.userId, {
        ...payload,
        email: editing.email,
        role: editing.role,
        isActive: editing.isActive
      });
      toast.success("Employee updated");
      setEditing(null);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleActive = async (row) => {
    try {
      await employeeApi.update(row.user?._id, { isActive: !row.user?.isActive });
      toast.success(row.user?.isActive ? "Employee deactivated" : "Employee activated");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (state.loading) return <LoadingSpinner label="Loading employees..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Employee Management</h1>
        <button className="btn btn-primary" type="button" onClick={() => setShowCreate(true)}>
          <UserPlus size={14} />
          Add Employee
        </button>
      </header>

      <section className="card">
        <div className="card-head">
          <h3>Employee Directory (Essential Details)</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Personal Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Salary</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.map((row) => (
                <tr key={row.user?._id || row._id}>
                  <td>
                    <div className="avatar-cell">
                      {row.avatarUrl ? (
                        <img className="avatar-img" src={resolveFileUrl(row.avatarUrl)} alt={employeeDetailsLabel(row)} />
                      ) : (
                        <span className="avatar-fallback">
                          {(row.firstName || "E").slice(0, 1)}
                          {(row.lastName || "").slice(0, 1)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{employeeDetailsLabel(row)}</td>
                  <td>{row.employeeId || "-"}</td>
                  <td>{row.user?.email}</td>
                  <td>{row.phone || "-"}</td>
                  <td>{row.personalEmail || "-"}</td>
                  <td>{row.department}</td>
                  <td>{row.designation}</td>
                  <td>{formatCurrency(row.salary)}</td>
                  <td>{[row.address?.city, row.address?.state, row.address?.country].filter(Boolean).join(", ") || "-"}</td>
                  <td>
                    <StatusBadge status={row.user?.isActive ? "active" : "inactive"} />
                  </td>
                  <td className="button-row">
                    <button className="btn btn-outline" type="button" onClick={() => setShowView(row)}>
                      <Eye size={14} />
                      View
                    </button>
                    <button className="btn btn-outline" type="button" onClick={() => setEditing(mapRowToEdit(row))}>
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      className={row.user?.isActive ? "btn btn-danger" : "btn btn-primary"}
                      type="button"
                      onClick={() => toggleActive(row)}
                    >
                      {row.user?.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                      {row.user?.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="pagination-row">
        <button className="btn btn-outline" type="button" onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
          Previous
        </button>
        <span>
          Page {state.pagination.page || 1} / {state.pagination.totalPages || 1}
        </span>
        <button
          className="btn btn-outline"
          type="button"
          onClick={() =>
            setPage((prev) =>
              Math.min(prev + 1, state.pagination.totalPages || state.pagination.page || prev + 1)
            )
          }
        >
          Next
        </button>
      </div>

      <FormModal title="Add Employee" open={showCreate} onClose={() => setShowCreate(false)} width="860px">
        <form className="form-grid" onSubmit={handleCreate}>
          <h3>Identity & Contact</h3>
          <label>
            Employee ID
            <input
              value={form.employeeId}
              onChange={(event) => setForm((prev) => ({ ...prev, employeeId: event.target.value }))}
              placeholder="ARK-0001"
            />
          </label>
          <label>
            Work Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </label>
          <label>
            First Name
            <input required value={form.firstName} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} />
          </label>
          <label>
            Last Name
            <input required value={form.lastName} onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
          </label>
          <label>
            Personal Email
            <input
              type="email"
              value={form.personalEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, personalEmail: event.target.value }))}
            />
          </label>
          <label>
            Alternate Phone
            <input value={form.alternatePhone} onChange={(event) => setForm((prev) => ({ ...prev, alternatePhone: event.target.value }))} />
          </label>
          <label>
            Date of Birth
            <input type="date" value={form.dob} onChange={(event) => setForm((prev) => ({ ...prev, dob: event.target.value }))} />
          </label>
          <label>
            Gender
            <select value={form.gender} onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </label>
          <label>
            Marital Status
            <select value={form.maritalStatus} onChange={(event) => setForm((prev) => ({ ...prev, maritalStatus: event.target.value }))}>
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
            <select value={form.bloodGroup} onChange={(event) => setForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}>
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
            <input value={form.nationality} onChange={(event) => setForm((prev) => ({ ...prev, nationality: event.target.value }))} />
          </label>

          <h3>Employment</h3>
          <label>
            Department
            <input value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} required />
          </label>
          <label>
            Designation
            <input value={form.designation} onChange={(event) => setForm((prev) => ({ ...prev, designation: event.target.value }))} required />
          </label>
          <label>
            Salary (INR)
            <input type="number" value={form.salary} onChange={(event) => setForm((prev) => ({ ...prev, salary: event.target.value }))} />
          </label>
          <label>
            Join Date
            <input type="date" value={form.joinDate} onChange={(event) => setForm((prev) => ({ ...prev, joinDate: event.target.value }))} />
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
            Experience (Years)
            <input
              type="number"
              value={form.experienceYears}
              onChange={(event) => setForm((prev) => ({ ...prev, experienceYears: event.target.value }))}
            />
          </label>
          <label>
            Previous Company
            <input
              value={form.previousCompany}
              onChange={(event) => setForm((prev) => ({ ...prev, previousCompany: event.target.value }))}
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="full-width">
            Skills (comma separated)
            <input value={form.skills} onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))} />
          </label>

          <h3>Address & Emergency</h3>
          <label>
            Address Line 1
            <input value={form.addressLine1} onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))} />
          </label>
          <label>
            Address Line 2
            <input value={form.addressLine2} onChange={(event) => setForm((prev) => ({ ...prev, addressLine2: event.target.value }))} />
          </label>
          <label>
            City
            <select value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}>
              <option value="">Select city</option>
              {createCities.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            State
            <select
              value={form.state}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  state: event.target.value,
                  city: ""
                }))
              }
            >
              <option value="">Select state</option>
              {createStates.map((item) => (
                <option key={item.isoCode} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Country
            <select
              value={form.country}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  country: event.target.value,
                  state: "",
                  city: ""
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
            <input value={form.postalCode} onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))} />
          </label>
          <label>
            Emergency Contact Name
            <input value={form.emergencyName} onChange={(event) => setForm((prev) => ({ ...prev, emergencyName: event.target.value }))} />
          </label>
          <label>
            Emergency Contact Relation
            <input
              value={form.emergencyRelation}
              onChange={(event) => setForm((prev) => ({ ...prev, emergencyRelation: event.target.value }))}
            />
          </label>
          <label>
            Emergency Contact Phone
            <input
              value={form.emergencyPhone}
              onChange={(event) => setForm((prev) => ({ ...prev, emergencyPhone: event.target.value }))}
            />
          </label>

          <h3>Compliance & Bank</h3>
          <label>
            PAN
            <input value={form.pan} onChange={(event) => setForm((prev) => ({ ...prev, pan: event.target.value }))} />
          </label>
          <label>
            Aadhaar
            <input value={form.aadhaar} onChange={(event) => setForm((prev) => ({ ...prev, aadhaar: event.target.value }))} />
          </label>
          <label>
            Passport
            <input value={form.passport} onChange={(event) => setForm((prev) => ({ ...prev, passport: event.target.value }))} />
          </label>
          <label>
            Account Holder
            <input
              value={form.bankAccountHolder}
              onChange={(event) => setForm((prev) => ({ ...prev, bankAccountHolder: event.target.value }))}
            />
          </label>
          <label>
            Account Number
            <input
              value={form.bankAccountNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, bankAccountNumber: event.target.value }))}
            />
          </label>
          <label>
            IFSC
            <input value={form.bankIfsc} onChange={(event) => setForm((prev) => ({ ...prev, bankIfsc: event.target.value }))} />
          </label>
          <label>
            Bank Name
            <input value={form.bankName} onChange={(event) => setForm((prev) => ({ ...prev, bankName: event.target.value }))} />
          </label>
          <label>
            Branch
            <input value={form.bankBranch} onChange={(event) => setForm((prev) => ({ ...prev, bankBranch: event.target.value }))} />
          </label>
          <label>
            UPI ID
            <input value={form.upiId} onChange={(event) => setForm((prev) => ({ ...prev, upiId: event.target.value }))} />
          </label>

          <button className="btn btn-primary" type="submit">
            Create Employee
          </button>
        </form>
      </FormModal>

      <FormModal title="Edit Employee" open={Boolean(editing)} onClose={() => setEditing(null)} width="860px">
        {editing ? (
          <form className="form-grid" onSubmit={handleUpdate}>
            <label>
              Employee ID
              <input
                value={editing.employeeId}
                onChange={(event) => setEditing((prev) => ({ ...prev, employeeId: event.target.value }))}
              />
            </label>
            <label>
              Work Email
              <input
                type="email"
                value={editing.email}
                onChange={(event) => setEditing((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>
            <label>
              Phone
              <input value={editing.phone} onChange={(event) => setEditing((prev) => ({ ...prev, phone: event.target.value }))} />
            </label>
            <label>
              Personal Email
              <input
                type="email"
                value={editing.personalEmail}
                onChange={(event) => setEditing((prev) => ({ ...prev, personalEmail: event.target.value }))}
              />
            </label>
            <label>
              Alternate Phone
              <input
                value={editing.alternatePhone}
                onChange={(event) => setEditing((prev) => ({ ...prev, alternatePhone: event.target.value }))}
              />
            </label>
            <label>
              Department
              <input
                value={editing.department}
                onChange={(event) => setEditing((prev) => ({ ...prev, department: event.target.value }))}
              />
            </label>
            <label>
              Designation
              <input
                value={editing.designation}
                onChange={(event) => setEditing((prev) => ({ ...prev, designation: event.target.value }))}
              />
            </label>
            <label>
              Salary
              <input
                type="number"
                value={editing.salary}
                onChange={(event) => setEditing((prev) => ({ ...prev, salary: event.target.value }))}
              />
            </label>
            <label>
              City
              <select value={editing.city} onChange={(event) => setEditing((prev) => ({ ...prev, city: event.target.value }))}>
                <option value="">Select city</option>
                {editCities.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              State
              <select
                value={editing.state}
                onChange={(event) =>
                  setEditing((prev) => ({
                    ...prev,
                    state: event.target.value,
                    city: ""
                  }))
                }
              >
                <option value="">Select state</option>
                {editStates.map((item) => (
                  <option key={item.isoCode} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Country
              <select
                value={editing.country}
                onChange={(event) =>
                  setEditing((prev) => ({
                    ...prev,
                    country: event.target.value,
                    state: "",
                    city: ""
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
              PAN
              <input value={editing.pan} onChange={(event) => setEditing((prev) => ({ ...prev, pan: event.target.value }))} />
            </label>
            <label>
              Aadhaar
              <input value={editing.aadhaar} onChange={(event) => setEditing((prev) => ({ ...prev, aadhaar: event.target.value }))} />
            </label>
            <label>
              Account Number
              <input
                value={editing.bankAccountNumber}
                onChange={(event) => setEditing((prev) => ({ ...prev, bankAccountNumber: event.target.value }))}
              />
            </label>
            <label>
              IFSC
              <input value={editing.bankIfsc} onChange={(event) => setEditing((prev) => ({ ...prev, bankIfsc: event.target.value }))} />
            </label>
            <label>
              Role
              <select value={editing.role} onChange={(event) => setEditing((prev) => ({ ...prev, role: event.target.value }))}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Active
              <select
                value={editing.isActive ? "true" : "false"}
                onChange={(event) => setEditing((prev) => ({ ...prev, isActive: event.target.value === "true" }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
            <label className="full-width">
              Skills
              <input value={editing.skills} onChange={(event) => setEditing((prev) => ({ ...prev, skills: event.target.value }))} />
            </label>
            <button className="btn btn-primary" type="submit">
              Save Changes
            </button>
          </form>
        ) : null}
      </FormModal>

      <FormModal title="Employee Details" open={Boolean(showView)} onClose={() => setShowView(null)} width="760px">
        {showView ? (
          <div className="page-grid">
            <div className="detail-grid">
              <article className="card">
                <div className="profile-card">
                  <div className="profile-avatar">
                    {showView.avatarUrl ? (
                      <img src={resolveFileUrl(showView.avatarUrl)} alt={employeeDetailsLabel(showView)} />
                    ) : (
                      <span>{(showView.firstName || "E").slice(0, 1)}</span>
                    )}
                  </div>
                  <div>
                    <h3>{employeeDetailsLabel(showView)}</h3>
                    <p className="muted">{showView.employeeId || "-"}</p>
                  </div>
                </div>
                <p>Work Email: {showView.user?.email || "-"}</p>
                <p>Phone: {showView.phone || "-"}</p>
                <p>Personal Email: {showView.personalEmail || "-"}</p>
                <p>Alternate Phone: {showView.alternatePhone || "-"}</p>
              </article>
              <article className="card">
                <h3>Employment</h3>
                <p>Department: {showView.department || "-"}</p>
                <p>Designation: {showView.designation || "-"}</p>
                <p>Join Date: {formatDate(showView.joinDate)}</p>
                <p>Salary: {formatCurrency(showView.salary)}</p>
                <p>Mode: {showView.workMode || "-"}</p>
              </article>
            </div>
            <article className="card">
              <h3>Address</h3>
              <p>
                {[
                  showView.address?.line1,
                  showView.address?.line2,
                  showView.address?.city,
                  showView.address?.state,
                  showView.address?.country,
                  showView.address?.postalCode
                ]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </p>
            </article>
          </div>
        ) : null}
      </FormModal>
    </section>
  );
};

export default AdminEmployeesPage;
