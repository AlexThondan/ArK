import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { employeeApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import FormModal from "../../components/common/FormModal";
import { formatCurrency, formatDate } from "../../utils/format";

const initialForm = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  department: "",
  designation: "",
  salary: "",
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
        department: editing.department,
        designation: editing.designation,
        salary: Number(editing.salary || 0),
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

  const deactivate = async (userId) => {
    try {
      await employeeApi.remove(userId);
      toast.success("Employee deactivated");
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
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
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
                  <td>{row.user?.email}</td>
                  <td>{row.user?.role}</td>
                  <td>{row.department}</td>
                  <td>{row.designation}</td>
                  <td>{formatCurrency(row.salary)}</td>
                  <td>{formatDate(row.joinDate)}</td>
                  <td>{row.user?.isActive ? "Active" : "Inactive"}</td>
                  <td className="button-row">
                    <button className="btn btn-outline" type="button" onClick={() => setEditing(row)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" type="button" onClick={() => deactivate(row.user?._id)}>
                      Deactivate
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
            <input
              required
              value={form.department}
              onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
            />
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
