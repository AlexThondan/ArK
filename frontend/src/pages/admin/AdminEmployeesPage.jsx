import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Power, PowerOff, UserPlus } from "lucide-react";
import { employeeApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import FormModal from "../../components/common/FormModal";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/format";

const initialForm = {
  employeeId: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  department: "",
  designation: "",
  salary: "",
  joinDate: "",
  workMode: "onsite",
  employmentType: "full-time",
  role: "employee"
};

const AdminEmployeesPage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [], pagination: {} });
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);

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
      await employeeApi.create({
        ...form,
        salary: Number(form.salary || 0)
      });
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
      await employeeApi.update(editing.user._id, {
        employeeId: editing.employeeId,
        phone: editing.phone,
        department: editing.department,
        designation: editing.designation,
        salary: Number(editing.salary || 0),
        workMode: editing.workMode,
        employmentType: editing.employmentType,
        role: editing.user.role,
        isActive: editing.user.isActive
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
          <h3>Employee Directory</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Mode</th>
                <th>Salary</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.map((row) => (
                <tr key={row.user?._id || row._id}>
                  <td>{`${row.firstName} ${row.lastName}`}</td>
                  <td>{row.employeeId || "-"}</td>
                  <td>{row.user?.email}</td>
                  <td>{row.user?.role}</td>
                  <td>{row.department}</td>
                  <td>{row.designation}</td>
                  <td>{row.workMode || "-"}</td>
                  <td>{formatCurrency(row.salary)}</td>
                  <td>{formatDate(row.joinDate)}</td>
                  <td>
                    <StatusBadge status={row.user?.isActive ? "active" : "inactive"} />
                  </td>
                  <td className="button-row">
                    <button className="btn btn-outline" type="button" onClick={() => setEditing(row)}>
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

      <FormModal title="Add Employee" open={showCreate} onClose={() => setShowCreate(false)}>
        <form className="form-grid" onSubmit={handleCreate}>
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
            <input
              required
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
            />
          </label>
          <label>
            Last Name
            <input
              required
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
            />
          </label>
          <label>
            Department
            <select
              value={form.department}
              onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
              required
            >
              <option value="">Select department</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Product">Product</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
            </select>
          </label>
          <label>
            Designation
            <input
              required
              value={form.designation}
              onChange={(event) => setForm((prev) => ({ ...prev, designation: event.target.value }))}
            />
          </label>
          <label>
            Salary
            <input
              type="number"
              value={form.salary}
              onChange={(event) => setForm((prev) => ({ ...prev, salary: event.target.value }))}
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </label>
          <label>
            Join Date
            <input
              type="date"
              value={form.joinDate}
              onChange={(event) => setForm((prev) => ({ ...prev, joinDate: event.target.value }))}
            />
          </label>
          <label>
            Work Mode
            <select
              value={form.workMode}
              onChange={(event) => setForm((prev) => ({ ...prev, workMode: event.target.value }))}
            >
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </label>
          <label>
            Employment Type
            <select
              value={form.employmentType}
              onChange={(event) => setForm((prev) => ({ ...prev, employmentType: event.target.value }))}
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </select>
          </label>
          <label>
            Role
            <select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button className="btn btn-primary" type="submit">
            Create Employee
          </button>
        </form>
      </FormModal>

      <FormModal title="Edit Employee" open={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing ? (
          <form className="form-grid" onSubmit={handleUpdate}>
            <label>
              Employee ID
              <input
                value={editing.employeeId || ""}
                onChange={(event) => setEditing((prev) => ({ ...prev, employeeId: event.target.value }))}
              />
            </label>
            <label>
              Phone
              <input
                value={editing.phone || ""}
                onChange={(event) => setEditing((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </label>
            <label>
              Department
              <input
                value={editing.department || ""}
                onChange={(event) => setEditing((prev) => ({ ...prev, department: event.target.value }))}
              />
            </label>
            <label>
              Designation
              <input
                value={editing.designation || ""}
                onChange={(event) => setEditing((prev) => ({ ...prev, designation: event.target.value }))}
              />
            </label>
            <label>
              Salary
              <input
                type="number"
                value={editing.salary || ""}
                onChange={(event) => setEditing((prev) => ({ ...prev, salary: event.target.value }))}
              />
            </label>
            <label>
              Work Mode
              <select
                value={editing.workMode || "onsite"}
                onChange={(event) => setEditing((prev) => ({ ...prev, workMode: event.target.value }))}
              >
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </label>
            <label>
              Employment Type
              <select
                value={editing.employmentType || "full-time"}
                onChange={(event) => setEditing((prev) => ({ ...prev, employmentType: event.target.value }))}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </label>
            <label>
              Role
              <select
                value={editing.user?.role || "employee"}
                onChange={(event) =>
                  setEditing((prev) => ({ ...prev, user: { ...prev.user, role: event.target.value } }))
                }
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Active
              <select
                value={editing.user?.isActive ? "true" : "false"}
                onChange={(event) =>
                  setEditing((prev) => ({
                    ...prev,
                    user: { ...prev.user, isActive: event.target.value === "true" }
                  }))
                }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
            <button className="btn btn-primary" type="submit">
              Save Changes
            </button>
          </form>
        ) : null}
      </FormModal>
    </section>
  );
};

export default AdminEmployeesPage;
