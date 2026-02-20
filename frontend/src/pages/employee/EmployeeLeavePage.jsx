import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { leaveApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDate } from "../../utils/format";

const initialForm = {
  leaveType: "annual",
  startDate: "",
  endDate: "",
  reason: "",
  handoverNotes: "",
  contactDuringLeave: ""
};

const EmployeeLeavePage = () => {
  const [form, setForm] = useState(initialForm);
  const [editingLeaveId, setEditingLeaveId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [state, setState] = useState({ loading: true, error: "", rows: [] });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await leaveApi.my({
        limit: 30,
        ...(statusFilter ? { status: statusFilter } : {})
      });
      setState({ loading: false, error: "", rows: response.data || [] });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingLeaveId) {
        await leaveApi.update(editingLeaveId, form);
        toast.success("Leave request updated and resubmitted");
      } else {
        await leaveApi.apply(form);
        toast.success("Leave request submitted");
      }
      setForm(initialForm);
      setEditingLeaveId("");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const startEditing = (row) => {
    setEditingLeaveId(row._id);
    setForm({
      leaveType: row.leaveType,
      startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 10) : "",
      endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 10) : "",
      reason: row.reason || "",
      handoverNotes: row.handoverNotes || "",
      contactDuringLeave: row.contactDuringLeave || ""
    });
  };

  if (state.loading) return <LoadingSpinner label="Loading leaves..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Leave Management</h1>
      </header>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h3>{editingLeaveId ? "Edit Leave Request" : "Apply Leave"}</h3>
        <label>
          Type
          <select
            value={form.leaveType}
            onChange={(event) => setForm((prev) => ({ ...prev, leaveType: event.target.value }))}
          >
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="casual">Casual</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </label>

        <label>
          Start Date
          <input
            type="date"
            value={form.startDate}
            onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            required
          />
        </label>
        <label>
          End Date
          <input
            type="date"
            value={form.endDate}
            onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
            required
          />
        </label>
        <label>
          Contact During Leave
          <input
            value={form.contactDuringLeave}
            onChange={(event) => setForm((prev) => ({ ...prev, contactDuringLeave: event.target.value }))}
            placeholder="+1 555 0123"
          />
        </label>

        <label className="full-width">
          Reason
          <textarea
            value={form.reason}
            onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
            required
          />
        </label>
        <label className="full-width">
          Work Handover Notes
          <textarea
            value={form.handoverNotes}
            onChange={(event) => setForm((prev) => ({ ...prev, handoverNotes: event.target.value }))}
            placeholder="Mention current tasks, point of contact, and handover status."
          />
        </label>

        <div className="button-row">
          <button className="btn btn-primary" type="submit">
            {editingLeaveId ? "Update Leave" : "Submit Leave"}
          </button>
          {editingLeaveId ? (
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                setEditingLeaveId("");
                setForm(initialForm);
              }}
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      <section className="card">
        <div className="card-head">
          <h3>Leave History</h3>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Comment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.length ? (
                state.rows.map((row) => (
                  <tr key={row._id}>
                    <td>{row.leaveType}</td>
                    <td>{formatDate(row.startDate)}</td>
                    <td>{formatDate(row.endDate)}</td>
                    <td>{row.days}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>
                      <p className="smart-copy">{row.reason}</p>
                    </td>
                    <td>{row.reviewComment || "-"}</td>
                    <td>
                      <button className="btn btn-outline" type="button" onClick={() => startEditing(row)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="muted">
                    No leave records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
};

export default EmployeeLeavePage;
