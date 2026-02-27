import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { attendanceApi } from "../../api/hrmsApi";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import { formatDate, formatDateTime, formatDuration } from "../../utils/format";

const EmployeeAttendancePage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });
  const [manualForm, setManualForm] = useState({
    date: "",
    checkOutTime: "18:00",
    notes: ""
  });

  const toInputDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

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

  useEffect(() => {
    const pendingCheckout = (state.rows || []).find((row) => row.checkIn && !row.checkOut);
    if (pendingCheckout) {
      setManualForm((prev) => ({
        ...prev,
        date: prev.date || toInputDate(pendingCheckout.date)
      }));
      return;
    }

    setManualForm((prev) => ({
      ...prev,
      date: prev.date || toInputDate(new Date())
    }));
  }, [state.rows]);

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

  const handleManualCheckOut = async () => {
    if (!manualForm.date || !manualForm.checkOutTime) {
      toast.error("Date and check-out time are required");
      return;
    }

    try {
      await attendanceApi.checkOut({
        date: manualForm.date,
        checkOutTime: manualForm.checkOutTime,
        notes: manualForm.notes
      });
      toast.success("Manual check-out saved");
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
  const pendingCheckoutRows = (state.rows || []).filter((row) => row.checkIn && !row.checkOut);

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

      <section className="card">
        <div className="card-head">
          <h3>Missed Check-Out</h3>
        </div>
        <div className="form-grid">
          <label>
            Attendance Date
            <input
              type="date"
              value={manualForm.date}
              onChange={(event) => setManualForm((prev) => ({ ...prev, date: event.target.value }))}
            />
          </label>
          <label>
            Check-Out Time
            <input
              type="time"
              value={manualForm.checkOutTime}
              onChange={(event) => setManualForm((prev) => ({ ...prev, checkOutTime: event.target.value }))}
            />
          </label>
          <label className="full-width">
            Notes (Optional)
            <textarea
              value={manualForm.notes}
              onChange={(event) => setManualForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Reason for delayed checkout update"
            />
          </label>
          <div className="full-width button-row">
            <button className="btn btn-primary" type="button" onClick={handleManualCheckOut}>
              Submit Manual Check-Out
            </button>
          </div>
        </div>
        {pendingCheckoutRows.length ? (
          <p className="muted">
            Pending days without check-out:{" "}
            {pendingCheckoutRows.map((row) => formatDate(row.date)).join(", ")}
          </p>
        ) : (
          <p className="muted">No pending check-out days found.</p>
        )}
      </section>

      {today ? (
        <div className="attendance-stats-stack">
          <article className="card attendance-stat-card">
            <h3>Today Check In</h3>
            <p className="attendance-stat-value">{formatDateTime(today.checkIn)}</p>
          </article>
          <article className="card attendance-stat-card">
            <h3>Today Check Out</h3>
            <p className="attendance-stat-value">{formatDateTime(today.checkOut)}</p>
          </article>
          <article className="card attendance-stat-card">
            <h3>Work Duration</h3>
            <p className="attendance-stat-value">{formatDuration(today.workDurationMinutes)}</p>
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
