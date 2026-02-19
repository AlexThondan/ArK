import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { leaveApi } from "../../api/hrmsApi";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import { formatDate } from "../../utils/format";

const initialForm = {
  leaveType: "annual",
  startDate: "",
  endDate: "",
  reason: ""
};

const EmployeeLeavePage = () => {
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ loading: true, error: "", rows: [] });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await leaveApi.my({ limit: 30 });
      setState({ loading: false, error: "", rows: response.data || [] });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await leaveApi.apply(form);
      toast.success("Leave request submitted");
      setForm(initialForm);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (state.loading) return <LoadingSpinner label="Loading leaves..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Leave Management</h1>
      </header>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h3>Apply Leave</h3>
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

        <label className="full-width">
          Reason
          <textarea
            value={form.reason}
            onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
            required
          />
        </label>

        <button className="btn btn-primary" type="submit">
          Submit Leave
        </button>
      </form>

      <section className="card">
        <div className="card-head">
          <h3>Leave History</h3>
        </div>
        <DataTable
          rows={state.rows}
          columns={[
            { key: "leaveType", label: "Type" },
            { key: "startDate", label: "Start", render: (value) => formatDate(value) },
            { key: "endDate", label: "End", render: (value) => formatDate(value) },
            { key: "days", label: "Days" },
            { key: "status", label: "Status", type: "status" },
            { key: "reviewComment", label: "Comment" }
          ]}
        />
      </section>
    </section>
  );
};

export default EmployeeLeavePage;
