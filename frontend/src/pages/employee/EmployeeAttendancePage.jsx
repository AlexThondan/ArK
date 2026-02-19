import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { attendanceApi } from "../../api/hrmsApi";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import { formatDate, formatDateTime, formatDuration } from "../../utils/format";

const EmployeeAttendancePage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await attendanceApi.my({ limit: 30 });
      setState({ loading: false, error: "", rows: response.data || [] });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckIn = async () => {
    try {
      await attendanceApi.checkIn();
      toast.success("Checked in");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceApi.checkOut();
      toast.success("Checked out");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (state.loading) return <LoadingSpinner label="Loading attendance..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  const today = state.rows.find(
    (row) => new Date(row.date).toDateString() === new Date().toDateString()
  );

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Attendance</h1>
      </header>

      <div className="card action-row">
        <div>
          <h3>Daily Attendance</h3>
          <p className="muted">Track check-in/check-out and work duration.</p>
        </div>
        <div className="button-row">
          <button className="btn btn-primary" onClick={handleCheckIn} type="button">
            Check In
          </button>
          <button className="btn btn-outline" onClick={handleCheckOut} type="button">
            Check Out
          </button>
        </div>
      </div>

      {today ? (
        <div className="kpi-grid">
          <article className="card">
            <h3>Today Check In</h3>
            <p>{formatDateTime(today.checkIn)}</p>
          </article>
          <article className="card">
            <h3>Today Check Out</h3>
            <p>{formatDateTime(today.checkOut)}</p>
          </article>
          <article className="card">
            <h3>Work Duration</h3>
            <p>{formatDuration(today.workDurationMinutes)}</p>
          </article>
        </div>
      ) : null}

      <section className="card">
        <div className="card-head">
          <h3>Attendance History</h3>
        </div>
        <DataTable
          rows={state.rows}
          columns={[
            { key: "date", label: "Date", render: (value) => formatDate(value) },
            { key: "checkIn", label: "Check In", render: (value) => formatDateTime(value) },
            { key: "checkOut", label: "Check Out", render: (value) => formatDateTime(value) },
            { key: "workDurationMinutes", label: "Duration", render: (value) => formatDuration(value) },
            { key: "status", label: "Status", type: "status" }
          ]}
        />
      </section>
    </section>
  );
};

export default EmployeeAttendancePage;
