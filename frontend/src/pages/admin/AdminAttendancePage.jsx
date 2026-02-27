import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "../../api/client";
import { attendanceApi, employeeApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/common/DataTable";
import { formatDate, formatDateTime, formatDuration } from "../../utils/format";

const toIsoDate = (date) => new Date(date).toISOString().slice(0, 10);

const AdminAttendancePage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [], employees: [] });
  const [filters, setFilters] = useState({
    userId: "",
    status: "",
    dateMode: "today",
    dateFrom: "",
    dateTo: ""
  });

  const buildFilterParams = useCallback(() => {
    const params = {
      limit: 200,
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.status ? { status: filters.status } : {})
    };

    if (filters.dateMode === "today") {
      const today = toIsoDate(new Date());
      params.dateFrom = today;
      params.dateTo = today;
    } else if (filters.dateMode === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const value = toIsoDate(yesterday);
      params.dateFrom = value;
      params.dateTo = value;
    } else if (filters.dateMode === "custom") {
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
    }

    return params;
  }, [filters.dateFrom, filters.dateMode, filters.dateTo, filters.status, filters.userId]);

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const [attendanceRes, employeeRes] = await Promise.all([
        attendanceApi.admin(buildFilterParams()),
        employeeApi.list({ limit: 300 })
      ]);
      setState({
        loading: false,
        error: "",
        rows: attendanceRes.data || [],
        employees: employeeRes.data || []
      });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [], employees: [] });
    }
  }, [buildFilterParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exportCsv = async () => {
    try {
      const response = await client.get("/attendance/admin/export", {
        params: buildFilterParams(),
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

  const resetFilters = () => {
    setFilters({
      userId: "",
      status: "",
      dateMode: "today",
      dateFrom: "",
      dateTo: ""
    });
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

      <section className="card action-row">
        <div className="inline-title">
          <h3>Filters</h3>
        </div>
        <div className="button-row">
          <select
            value={filters.userId}
            onChange={(event) => setFilters((prev) => ({ ...prev, userId: event.target.value }))}
          >
            <option value="">All Employees</option>
            {state.employees
              .filter((employee) => employee.user?._id)
              .map((employee) => (
                <option key={employee.user._id} value={employee.user._id}>
                  {`${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.user?.email}{" "}
                  {employee.employeeId ? `(${employee.employeeId})` : ""}
                </option>
              ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="half-day">Half-day</option>
            <option value="absent">Absent</option>
            <option value="on-leave">On Leave</option>
          </select>

          <select
            value={filters.dateMode}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateMode: event.target.value }))}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="custom">From Calendar</option>
            <option value="all">All Dates</option>
          </select>

          {filters.dateMode === "custom" ? (
            <>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
              />
            </>
          ) : null}

          <button className="btn btn-outline" type="button" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </section>

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
