import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { PlusCircle, Users2 } from "lucide-react";
import { employeeApi, teamApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/common/DataTable";
import FormModal from "../../components/common/FormModal";
import { resolveFileUrl } from "../../utils/format";

const initialForm = {
  name: "",
  code: "",
  department: "",
  description: "",
  lead: "",
  members: [{ user: "", teamRole: "" }]
};

const AdminTeamsPage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [], employees: [] });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const [teamRes, employeeRes] = await Promise.all([teamApi.list({ limit: 100 }), employeeApi.list({ limit: 300 })]);
      setState({
        loading: false,
        error: "",
        rows: teamRes.data || [],
        employees: employeeRes.data || []
      });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [], employees: [] });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const employeeOptions = useMemo(
    () =>
      state.employees.map((employee) => ({
        value: employee.user?._id,
        label: `${employee.firstName} ${employee.lastName} ${employee.employeeId ? `(${employee.employeeId})` : ""}`
      })),
    [state.employees]
  );

  const submitCreate = async (event) => {
    event.preventDefault();
    try {
      await teamApi.create({
        ...form,
        members: (form.members || []).filter((row) => row.user && row.teamRole)
      });
      toast.success("Team created");
      setShowCreate(false);
      setForm(initialForm);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const submitUpdate = async (event) => {
    event.preventDefault();
    if (!editing) return;
    try {
      await teamApi.update(editing._id, {
        name: editing.name,
        code: editing.code,
        department: editing.department,
        description: editing.description,
        lead: editing.lead?._id || editing.lead || "",
        isActive: editing.isActive,
        members: (editing.members || []).map((row) => ({
          user: row.user?._id || row.user,
          teamRole: row.teamRole
        }))
      });
      toast.success("Team updated");
      setEditing(null);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (state.loading) return <LoadingSpinner label="Loading teams..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Team Management</h1>
        <button className="btn btn-primary" type="button" onClick={() => setShowCreate(true)}>
          <PlusCircle size={14} />
          Create Team
        </button>
      </header>

      <div className="kpi-grid">
        <article className="card kpi-card gradient-card">
          <div className="kpi-head">
            <span>Active Teams</span>
            <Users2 size={18} />
          </div>
          <h2>{state.rows.filter((row) => row.isActive).length}</h2>
        </article>
        <article className="card kpi-card gradient-card">
          <div className="kpi-head">
            <span>Total Members Mapped</span>
            <Users2 size={18} />
          </div>
          <h2>{state.rows.reduce((sum, row) => sum + (row.members?.length || 0), 0)}</h2>
        </article>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Teams Directory</h3>
        </div>
        <DataTable
          rows={state.rows.map((row) => ({ ...row, status: row.isActive ? "active" : "inactive" }))}
          columns={[
            { key: "name", label: "Team" },
            { key: "code", label: "Code" },
            { key: "department", label: "Department" },
            {
              key: "lead",
              label: "Lead",
              render: (value) =>
                value ? (
                  <div className="list-identity">
                    <div className="avatar-cell small">
                      {value.avatarUrl ? (
                        <img className="avatar-img" src={resolveFileUrl(value.avatarUrl)} alt={`${value.firstName || ""} ${value.lastName || ""}`} />
                      ) : (
                        <span className="avatar-fallback">
                          {(value.firstName || "L").slice(0, 1)}
                          {(value.lastName || "").slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <span>{`${value.firstName || ""} ${value.lastName || ""}`.trim() || "-"}</span>
                  </div>
                ) : (
                  "-"
                )
            },
            {
              key: "members",
              label: "Members",
              render: (value) =>
                (value || []).length ? (
                  <div className="member-avatar-row">
                    {(value || []).slice(0, 4).map((member, index) => (
                      <div className="avatar-cell small overlap" key={`${member.user || index}-${member.teamRole || ""}`}>
                        {member.avatarUrl ? (
                          <img className="avatar-img" src={resolveFileUrl(member.avatarUrl)} alt={`${member.firstName || ""} ${member.lastName || ""}`} />
                        ) : (
                          <span className="avatar-fallback">
                            {(member.firstName || "M").slice(0, 1)}
                            {(member.lastName || "").slice(0, 1)}
                          </span>
                        )}
                      </div>
                    ))}
                    {(value || []).length > 4 ? <span className="muted">+{value.length - 4}</span> : null}
                  </div>
                ) : (
                  0
                )
            },
            { key: "status", label: "Status", type: "status" },
            {
              key: "actions",
              label: "Actions",
              render: (_value, row) => (
                <div className="button-row">
                  <button className="btn btn-outline" type="button" onClick={() => setEditing(row)}>
                    Edit
                  </button>
                  <button
                    className={row.isActive ? "btn btn-danger" : "btn btn-primary"}
                    type="button"
                    onClick={async () => {
                      try {
                        await teamApi.update(row._id, { isActive: !row.isActive });
                        toast.success(row.isActive ? "Team deactivated" : "Team activated");
                        loadData();
                      } catch (error) {
                        toast.error(error.message);
                      }
                    }}
                  >
                    {row.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              )
            }
          ]}
        />
      </section>

      <FormModal title="Create Team" open={showCreate} onClose={() => setShowCreate(false)} width="760px">
        <form className="form-grid" onSubmit={submitCreate}>
          <label>
            Team Name
            <input required value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          </label>
          <label>
            Team Code
            <input required value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} />
          </label>
          <label>
            Department
            <input value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} />
          </label>
          <label>
            Team Lead
            <select value={form.lead} onChange={(event) => setForm((prev) => ({ ...prev, lead: event.target.value }))}>
              <option value="">Select lead</option>
              {employeeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="full-width">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>

          <div className="full-width checklist-wrap">
            <div className="card-head">
              <h3>Team Members & Roles</h3>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    members: [...(prev.members || []), { user: "", teamRole: "" }]
                  }))
                }
              >
                Add Member
              </button>
            </div>
            <div className="form-grid">
              {(form.members || []).map((member, index) => (
                <div className="checklist-item" key={`${member.user}-${index}`}>
                  <select
                    value={member.user}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        members: prev.members.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, user: event.target.value } : row
                        )
                      }))
                    }
                  >
                    <option value="">Select employee</option>
                    {employeeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Role in team (Developer / QA / Designer)"
                    value={member.teamRole}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        members: prev.members.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, teamRole: event.target.value } : row
                        )
                      }))
                    }
                  />
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        members: prev.members.filter((_, rowIndex) => rowIndex !== index)
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" type="submit">
            Save Team
          </button>
        </form>
      </FormModal>

      <FormModal title="Edit Team" open={Boolean(editing)} onClose={() => setEditing(null)} width="760px">
        {editing ? (
          <form className="form-grid" onSubmit={submitUpdate}>
            <label>
              Team Name
              <input
                required
                value={editing.name || ""}
                onChange={(event) => setEditing((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>
            <label>
              Team Code
              <input
                required
                value={editing.code || ""}
                onChange={(event) => setEditing((prev) => ({ ...prev, code: event.target.value }))}
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
              Team Lead
              <select
                value={editing.lead?._id || editing.lead || ""}
                onChange={(event) => setEditing((prev) => ({ ...prev, lead: event.target.value }))}
              >
                <option value="">Select lead</option>
                {employeeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-width">
              Description
              <textarea
                value={editing.description || ""}
                onChange={(event) => setEditing((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>
            <label>
              Status
              <select
                value={editing.isActive ? "true" : "false"}
                onChange={(event) => setEditing((prev) => ({ ...prev, isActive: event.target.value === "true" }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>

            <div className="full-width checklist-wrap">
              <div className="card-head">
                <h3>Team Members & Roles</h3>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() =>
                    setEditing((prev) => ({
                      ...prev,
                      members: [...(prev.members || []), { user: "", teamRole: "" }]
                    }))
                  }
                >
                  Add Member
                </button>
              </div>
              <div className="form-grid">
                {(editing.members || []).map((member, index) => (
                  <div className="checklist-item" key={`${member.user?._id || member.user}-${index}`}>
                    <select
                      value={member.user?._id || member.user || ""}
                      onChange={(event) =>
                        setEditing((prev) => ({
                          ...prev,
                          members: prev.members.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, user: event.target.value } : row
                          )
                        }))
                      }
                    >
                      <option value="">Select employee</option>
                      {employeeOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Role in team"
                      value={member.teamRole || ""}
                      onChange={(event) =>
                        setEditing((prev) => ({
                          ...prev,
                          members: prev.members.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, teamRole: event.target.value } : row
                          )
                        }))
                      }
                    />
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() =>
                        setEditing((prev) => ({
                          ...prev,
                          members: prev.members.filter((_, rowIndex) => rowIndex !== index)
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" type="submit">
              Update Team
            </button>
          </form>
        ) : null}
      </FormModal>
    </section>
  );
};

export default AdminTeamsPage;
