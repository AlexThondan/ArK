import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { leaveApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/common/DataTable";
import { formatDate } from "../../utils/format";

const AdminLeavePage = () => {
  const [status, setStatus] = useState("");
  const [state, setState] = useState({ loading: true, error: "", rows: [] });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await leaveApi.admin({
        limit: 100,
        ...(status ? { status } : {})
      });
      setState({ loading: false, error: "", rows: response.data || [] });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, [status]);

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

  if (state.loading) return <LoadingSpinner label="Loading leave requests..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Leave Management</h1>
      </header>

      <div className="card action-row">
        <div>
          <h3>Filter Requests</h3>
          <p className="muted">Approve or reject employee leave requests.</p>
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
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
                <td>{row.status}</td>
                <td className="button-row">
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={row.status !== "pending"}
                    onClick={() => reviewLeave(row._id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    type="button"
                    disabled={row.status !== "pending"}
                    onClick={() => reviewLeave(row._id, "rejected")}
                  >
                    Reject
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
    </section>
  );
};

export default AdminLeavePage;
