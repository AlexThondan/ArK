import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "../../api/client";
import { attendanceApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/common/DataTable";
import { formatDate, formatDateTime, formatDuration } from "../../utils/format";

const AdminAttendancePage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await attendanceApi.admin({ limit: 100 });
      setState({ loading: false, error: "", rows: response.data || [] });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exportCsv = async () => {
    try {
      const response = await client.get("/attendance/admin/export", {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Attendance report exported");
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (state.loading) return <LoadingSpinner label="Loading attendance logs..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Attendance Monitoring</h1>
        <button className="btn btn-primary" type="button" onClick={exportCsv}>
          Export CSV
        </button>
      </header>

      <section className="card">
        <div className="card-head">
          <h3>Attendance Logs</h3>
        </div>
        <DataTable
          rows={state.rows}
          columns={[
            {
              key: "employee",
              label: "Employee",
              render: (_value, row) => `${row.firstName || ""} ${row.lastName || ""}`.trim() || row.user?.email
            },
            { key: "departmentSnapshot", label: "Department" },
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

export default AdminAttendancePage;
