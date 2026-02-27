import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UserPlus2, UserCheck2, CalendarClock, Activity, ClipboardCheck } from "lucide-react";
import { attendanceApi, employeeApi, leaveApi, reportApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import LineTrendChart from "../../components/charts/LineTrendChart";
import DonutLeaveChart from "../../components/charts/DonutLeaveChart";
import BarMetricsChart from "../../components/charts/BarMetricsChart";
import { formatDate } from "../../utils/format";

const toIsoDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const monthKey = (year, month) =>
  `${year}-${String(month).padStart(2, "0")}`;

const AdminHrDashboardPage = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: true,
    error: "",
    employees: [],
    leaveAnalytics: null,
    leaveRows: [],
    todayAttendance: [],
    performance: []
  });
  const [reviewingId, setReviewingId] = useState("");

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const today = toIsoDate(new Date());

      const [employeesRes, leaveAnalyticsRes, leaveRowsRes, attendanceRes, performanceRes] = await Promise.all([
        employeeApi.list({ limit: 300 }),
        leaveApi.analytics(),
        leaveApi.admin({ limit: 120 }),
        attendanceApi.admin({ limit: 500, dateFrom: today, dateTo: today }),
        reportApi.performance()
      ]);

      setState({
        loading: false,
        error: "",
        employees: employeesRes.data || [],
        leaveAnalytics: leaveAnalyticsRes.data || { statusSummary: [], typeSummary: [], monthlyTrend: [] },
        leaveRows: leaveRowsRes.data || [],
        todayAttendance: attendanceRes.data || [],
        performance: performanceRes.data || []
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message,
        employees: [],
        leaveAnalytics: null,
        leaveRows: [],
        todayAttendance: [],
        performance: []
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onReviewLeave = async (row, action) => {
    if (!row?._id || !action) return;
    try {
      setReviewingId(row._id);
      await leaveApi.review(row._id, {
        action,
        reviewComment: action === "approved" ? "Approved from HR dashboard" : "Rejected from HR dashboard"
      });
      toast.success(`Leave ${action}`);
      await loadData();
    } catch (error) {
      toast.error(error.message || "Unable to review leave");
    } finally {
      setReviewingId("");
    }
  };

  const pendingLeaves = useMemo(
    () => (state.leaveRows || []).filter((row) => row.status === "pending"),
    [state.leaveRows]
  );

  const approvedThisMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return (state.leaveRows || []).filter((row) => {
      if (row.status !== "approved") return false;
      const date = row.reviewedAt ? new Date(row.reviewedAt) : new Date(row.updatedAt || row.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
  }, [state.leaveRows]);

  const onLeaveToday = useMemo(
    () => (state.todayAttendance || []).filter((row) => row.status === "on-leave").length,
    [state.todayAttendance]
  );

  const avgAttendanceRate = useMemo(() => {
    if (!state.performance.length) return 0;
    const sum = state.performance.reduce((acc, row) => acc + Number(row.attendanceRate || 0), 0);
    return Math.round(sum / state.performance.length);
  }, [state.performance]);

  const departmentHeadcount = useMemo(() => {
    const map = {};
    (state.employees || []).forEach((row) => {
      const key = row.department || "Unassigned";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([department, headcount]) => ({ department, headcount }))
      .sort((a, b) => b.headcount - a.headcount)
      .slice(0, 8);
  }, [state.employees]);

  const leaveTrendData = useMemo(() => {
    const rows = state.leaveAnalytics?.monthlyTrend || [];
    return rows
      .map((row) => ({
        month: monthKey(row._id?.year, row._id?.month),
        requests: Number(row.count || 0),
        days: Number(row.totalDays || 0)
      }))
      .sort((a, b) => String(a.month).localeCompare(String(b.month)));
  }, [state.leaveAnalytics?.monthlyTrend]);

  const leaveTypeData = useMemo(
    () =>
      (state.leaveAnalytics?.typeSummary || []).map((row) => ({
        name: row._id || "unknown",
        value: Number(row.requests || 0)
      })),
    [state.leaveAnalytics?.typeSummary]
  );

  const recentJoinees = useMemo(
    () =>
      (state.employees || [])
        .slice()
        .sort((a, b) => new Date(b.joinDate || 0) - new Date(a.joinDate || 0))
        .slice(0, 8),
    [state.employees]
  );

  const riskRows = useMemo(
    () =>
      (state.performance || [])
        .filter((row) => row.burnoutRisk === "high" || row.burnoutRisk === "medium")
        .sort((a, b) => Number(b.performanceScore || 0) - Number(a.performanceScore || 0))
        .slice(0, 10),
    [state.performance]
  );

  if (state.loading) return <LoadingSpinner label="Loading HR dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid dash-pro">
      <header className="page-head">
        <h1>HR Dashboard</h1>
        <div className="button-row">
          <button type="button" className="btn btn-outline" onClick={() => navigate("/admin/employees")}>
            Manage Employees
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate("/admin/leaves")}>
            Open Leave Desk
          </button>
        </div>
      </header>

      <section className="dash-kpi-row">
        <article className="dash-kpi-card dash-kpi-blue">
          <div className="dash-kpi-icon-wrap blue"><UserPlus2 size={18} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Total Employees</span>
            <h3 className="dash-kpi-value">{state.employees.length}</h3>
          </div>
        </article>
        <article className="dash-kpi-card dash-kpi-green">
          <div className="dash-kpi-icon-wrap green"><UserCheck2 size={18} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Approved This Month</span>
            <h3 className="dash-kpi-value">{approvedThisMonth}</h3>
          </div>
        </article>
        <article className="dash-kpi-card dash-kpi-purple">
          <div className="dash-kpi-icon-wrap purple"><CalendarClock size={18} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Pending Leave Requests</span>
            <h3 className="dash-kpi-value">{pendingLeaves.length}</h3>
          </div>
        </article>
        <article className="dash-kpi-card dash-kpi-orange">
          <div className="dash-kpi-icon-wrap orange"><Activity size={18} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Average Attendance Rate</span>
            <h3 className="dash-kpi-value">{avgAttendanceRate}%</h3>
            <span className="dash-kpi-change">{onLeaveToday} on leave today</span>
          </div>
        </article>
      </section>

      <section className="dash-two-col">
        <LineTrendChart
          title="Leave Requests Trend"
          data={leaveTrendData}
          xKey="month"
          lines={[
            { dataKey: "requests", color: "#0f5a73", name: "Requests", showArea: true },
            { dataKey: "days", color: "#f97316", name: "Days" }
          ]}
        />
        <DonutLeaveChart
          title="Leave Type Mix"
          data={leaveTypeData}
          height={260}
          innerRadius={54}
          outerRadius={92}
          variant="segmented-ring"
        />
      </section>

      <section className="dash-two-col">
        <BarMetricsChart
          title="Department Headcount"
          data={departmentHeadcount}
          xKey="department"
          bars={[{ dataKey: "headcount", color: "#4b84f2", name: "Headcount" }]}
        />

        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Recent Joinees</h3>
          </div>
          <div className="table-wrap">
            <table className="table-unified">
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Employee ID</th>
                  <th scope="col">Department</th>
                  <th scope="col">Designation</th>
                  <th scope="col">Join Date</th>
                </tr>
              </thead>
              <tbody>
                {recentJoinees.length ? (
                  recentJoinees.map((row) => (
                    <tr key={row._id}>
                      <td>{`${row.firstName || ""} ${row.lastName || ""}`.trim() || "-"}</td>
                      <td>{row.employeeId || "-"}</td>
                      <td>{row.department || "-"}</td>
                      <td>{row.designation || "-"}</td>
                      <td>{formatDate(row.joinDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5"><p className="muted">No joins available.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="dash-two-col">
        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Pending Leave Approvals</h3>
            <button type="button" className="btn btn-outline" onClick={() => navigate("/admin/leaves")}>
              Open Full Queue
            </button>
          </div>
          <div className="table-wrap">
            <table className="table-unified">
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Type</th>
                  <th scope="col">Days</th>
                  <th scope="col">From</th>
                  <th scope="col">To</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.length ? (
                  pendingLeaves.slice(0, 10).map((row) => (
                    <tr key={row._id}>
                      <td>{`${row.firstName || ""} ${row.lastName || ""}`.trim() || row.user?.email || "-"}</td>
                      <td>{row.leaveType || "-"}</td>
                      <td>{row.days || 0}</td>
                      <td>{formatDate(row.startDate)}</td>
                      <td>{formatDate(row.endDate)}</td>
                      <td>
                        <div className="button-row">
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => onReviewLeave(row, "approved")}
                            disabled={reviewingId === row._id}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-xs"
                            onClick={() => onReviewLeave(row, "rejected")}
                            disabled={reviewingId === row._id}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6"><p className="muted">No pending requests.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Attention Needed</h3>
            <button type="button" className="btn btn-outline" onClick={() => navigate("/admin/reports")}>
              <ClipboardCheck size={14} />
              Open Reports
            </button>
          </div>
          <div className="table-wrap">
            <table className="table-unified">
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Department</th>
                  <th scope="col">Attendance</th>
                  <th scope="col">Performance</th>
                  <th scope="col">Burnout Risk</th>
                </tr>
              </thead>
              <tbody>
                {riskRows.length ? (
                  riskRows.map((row) => (
                    <tr key={`${row.userId}`}>
                      <td>{row.name || "-"}</td>
                      <td>{row.department || "-"}</td>
                      <td>{row.attendanceRate || 0}%</td>
                      <td>{row.performanceScore || 0}</td>
                      <td>
                        <span className={`status-badge ${row.burnoutRisk === "high" ? "danger" : "warning"}`}>
                          {row.burnoutRisk || "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5"><p className="muted">No risk flags right now.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </section>
  );
};

export default AdminHrDashboardPage;
