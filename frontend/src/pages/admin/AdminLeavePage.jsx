import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, CircleOff, Edit3, Filter } from "lucide-react";
import { leaveApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/common/DataTable";
import FormModal from "../../components/common/FormModal";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDate } from "../../utils/format";

const AdminLeavePage = () => {
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [state, setState] = useState({ loading: true, error: "", rows: [] });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await leaveApi.admin({
        limit: 100,
        ...(status ? { status } : {}),
        ...(department ? { department } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {})
      });
      setState({ loading: false, error: "", rows: response.data || [] });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, [status, department, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const reviewLeave = async (id, action) => {
    try {
      await leaveApi.review(id, { action });
      toast.success(`Leave ${action}`);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const saveLeaveEdits = async (event) => {
    event.preventDefault();
    if (!selectedLeave) return;
    try {
      await leaveApi.update(selectedLeave._id, {
        leaveType: selectedLeave.leaveType,
        startDate: selectedLeave.startDate,
        endDate: selectedLeave.endDate,
        reason: selectedLeave.reason,
        handoverNotes: selectedLeave.handoverNotes,
        contactDuringLeave: selectedLeave.contactDuringLeave,
        status: selectedLeave.status,
        reviewComment: selectedLeave.reviewComment
      });
      toast.success("Leave request updated");
      setSelectedLeave(null);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (state.loading) return <LoadingSpinner label="Loading leave requests..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Leave Management</h1>
      </header>

      <div className="card action-row">
        <div className="inline-title">
          <Filter size={16} />
          <h3>Filter Requests</h3>
        </div>
        <div className="button-row">
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            placeholder="Department"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          />
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </div>
      </div>

      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Start</th>
              <th>End</th>
              <th>Days</th>
              <th>Department</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.rows.map((row) => (
              <tr key={row._id}>
                <td>{`${row.firstName || ""} ${row.lastName || ""}`}</td>
                <td>{row.leaveType}</td>
                <td>{formatDate(row.startDate)}</td>
                <td>{formatDate(row.endDate)}</td>
                <td>{row.days}</td>
                <td>{row.departmentSnapshot}</td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
                <td>
                  <p className="smart-copy">{row.reason}</p>
                </td>
                <td className="button-row">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => reviewLeave(row._id, "approved")}
                  >
                    <CheckCircle2 size={14} />
                    Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => reviewLeave(row._id, "rejected")}
                  >
                    <CircleOff size={14} />
                    Reject
                  </button>
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() =>
                      setSelectedLeave({
                        ...row,
                        startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 10) : "",
                        endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 10) : ""
                      })
                    }
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Leave Analytics Snapshot</h3>
        </div>
        <DataTable
          rows={state.rows}
          columns={[
            { key: "leaveType", label: "Type" },
            { key: "status", label: "Status", type: "status" },
            { key: "departmentSnapshot", label: "Department" }
          ]}
        />
      </section>

      <FormModal title="Edit Leave Request" open={Boolean(selectedLeave)} onClose={() => setSelectedLeave(null)}>
        {selectedLeave ? (
          <form className="form-grid" onSubmit={saveLeaveEdits}>
            <label>
              Type
              <select
                value={selectedLeave.leaveType}
                onChange={(event) =>
                  setSelectedLeave((prev) => ({ ...prev, leaveType: event.target.value }))
                }
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
                value={selectedLeave.startDate}
                onChange={(event) =>
                  setSelectedLeave((prev) => ({ ...prev, startDate: event.target.value }))
                }
              />
            </label>
            <label>
              End Date
              <input
                type="date"
                value={selectedLeave.endDate}
                onChange={(event) =>
                  setSelectedLeave((prev) => ({ ...prev, endDate: event.target.value }))
                }
              />
            </label>
            <label>
              Status
              <select
                value={selectedLeave.status}
                onChange={(event) => setSelectedLeave((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <label className="full-width">
              Reason
              <textarea
                value={selectedLeave.reason || ""}
                onChange={(event) => setSelectedLeave((prev) => ({ ...prev, reason: event.target.value }))}
              />
            </label>
            <label className="full-width">
              Handover Notes
              <textarea
                value={selectedLeave.handoverNotes || ""}
                onChange={(event) =>
                  setSelectedLeave((prev) => ({ ...prev, handoverNotes: event.target.value }))
                }
              />
            </label>
            <label>
              Contact During Leave
              <input
                value={selectedLeave.contactDuringLeave || ""}
                onChange={(event) =>
                  setSelectedLeave((prev) => ({ ...prev, contactDuringLeave: event.target.value }))
                }
              />
            </label>
            <label className="full-width">
              Review Comment
              <textarea
                value={selectedLeave.reviewComment || ""}
                onChange={(event) =>
                  setSelectedLeave((prev) => ({ ...prev, reviewComment: event.target.value }))
                }
              />
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

export default AdminLeavePage;
