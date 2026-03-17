import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ClipboardList, Clock, TrendingUp } from "lucide-react";
import { dashboardApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import LineTrendChart from "../../components/charts/LineTrendChart";
import DonutLeaveChart from "../../components/charts/DonutLeaveChart";
import useAuth from "../../hooks/useAuth";
import { formatDate, formatDateTime, formatDuration, resolveFileUrl } from "../../utils/format";

const ManagerDashboardPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", data: null });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await dashboardApi.employee();
      setState({ loading: false, error: "", data: response.data });
    } catch (error) {
      setState({ loading: false, error: error.message, data: null });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const attendanceTrend = useMemo(() => {
    const rows = state.data?.attendanceHistory || [];
    return rows.map((row, idx) => {
      const duration = Number(((row.workDurationMinutes || 0) / 60).toFixed(2));
      const window = rows.slice(Math.max(0, idx - 2), idx + 1);
      const avgDuration = window.length
        ? Number((window.reduce((sum, item) => sum + Number(item.workDurationMinutes || 0), 0) / (window.length * 60)).toFixed(2))
        : duration;
      return { date: formatDate(row.date), duration, avgDuration };
    });
  }, [state.data?.attendanceHistory]);

  const leaveChartData = useMemo(() => {
    const leave = state.data?.leaveBalance;
    if (!leave) return [];
    return [
      { name: "Annual", value: leave.annual || 0 },
      { name: "Sick", value: leave.sick || 0 },
      { name: "Casual", value: leave.casual || 0 }
    ];
  }, [state.data]);

  if (state.loading) return <LoadingSpinner label="Loading manager dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  const taskSummary = state.data?.taskSummary || {};
  const recentTasks = state.data?.recentTasks || [];
  const attendanceHistory = state.data?.attendanceHistory || [];
  const greeting =
    new Date().getHours() < 12
      ? "Good Morning"
      : new Date().getHours() < 17
        ? "Good Afternoon"
        : "Good Evening";

  return (
    <section className="page-grid dash-pro">
      <header className="dash-welcome-card">
        <div className="dash-welcome-left">
          <div className="avatar-cell medium">
            {profile?.avatarUrl ? (
              <img className="avatar-img" src={resolveFileUrl(profile.avatarUrl)} alt="avatar" />
            ) : (
              <span className="avatar-fallback">
                {(profile?.firstName || "M").slice(0, 1)}
                {(profile?.lastName || "").slice(0, 1)}
              </span>
            )}
          </div>
          <div>
            <h2 className="dash-welcome-title">{greeting}, {profile?.firstName || "Manager"}</h2>
            <p className="dash-welcome-sub">Manager Dashboard</p>
          </div>
        </div>
        <div className="dash-welcome-stats">
          <div className="dash-mini-stat">
            <ClipboardList size={15} />
            <span><strong>{taskSummary.pending || 0}</strong> Pending Tasks</span>
          </div>
          <div className="dash-mini-stat">
            <CheckCircle2 size={15} />
            <span><strong>{taskSummary.completed || 0}</strong> Completed</span>
          </div>
          <div className="dash-mini-stat">
            <Clock size={15} />
            <span><strong>{attendanceHistory.length}</strong> Attendance Logs</span>
          </div>
        </div>
      </header>

      <section className="dash-kpi-row">
        <article className="dash-kpi-card dash-kpi-blue" onClick={() => navigate("/employee/tasks")}>
          <div className="dash-kpi-icon-wrap blue"><ClipboardList size={20} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Pending Tasks</span>
            <h3 className="dash-kpi-value">{taskSummary.pending || 0}</h3>
            <span className="dash-kpi-change">Focus queue</span>
          </div>
        </article>
        <article className="dash-kpi-card dash-kpi-green" onClick={() => navigate("/employee/tasks")}>
          <div className="dash-kpi-icon-wrap green"><CheckCircle2 size={20} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Completed Tasks</span>
            <h3 className="dash-kpi-value">{taskSummary.completed || 0}</h3>
            <span className="dash-kpi-change positive"><TrendingUp size={12} /> On track</span>
          </div>
        </article>
      </section>

      <section className="dash-two-col">
        <LineTrendChart
          title="Attendance Trend"
          data={attendanceTrend}
          xKey="date"
          lines={[
            { dataKey: "duration", color: "#0f5a73", name: "Worked Hours", showArea: true },
            { dataKey: "avgDuration", color: "#f97316", name: "Moving Avg" }
          ]}
        />
        <DonutLeaveChart
          title="Leave Balance"
          data={[
            { name: "Annual", value: leaveChartData?.[0]?.value || 0, fill: "#0f5a73" },
            { name: "Sick", value: leaveChartData?.[1]?.value || 0, fill: "#4b84f2" },
            { name: "Casual", value: leaveChartData?.[2]?.value || 0, fill: "#f4c21a" }
          ]}
          height={240}
          innerRadius={50}
          outerRadius={88}
          variant="segmented-ring"
        />
      </section>

      <section className="card dash-table-card">
        <div className="card-head">
          <h3>Recent Tasks</h3>
          <button type="button" className="zoho-btn-select" onClick={() => navigate("/employee/tasks")}>Open Tasks</button>
        </div>
        <div className="table-wrap">
          <table className="table-unified">
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col">Priority</th>
                <th scope="col">Status</th>
                <th scope="col">Due</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.length ? (
                recentTasks.map((task) => (
                  <tr key={task._id}>
                    <td>{task.title || "-"}</td>
                    <td>
                      <span className={`status-badge ${task.priority === "high" ? "danger" : task.priority === "medium" ? "warning" : "info"}`}>
                        {task.priority || "-"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${task.status === "done" ? "success" : task.status === "in-progress" ? "info" : "neutral"}`}>
                        {task.status || "-"}
                      </span>
                    </td>
                    <td>{formatDate(task.dueDate)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4"><p className="muted">No recent tasks.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card dash-table-card">
        <div className="card-head">
          <h3>Attendance Timeline</h3>
          <button type="button" className="zoho-btn-select" onClick={() => navigate("/employee/attendance")}>Attendance</button>
        </div>
        <div className="table-wrap">
          <table className="table-unified">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Check In</th>
                <th scope="col">Check Out</th>
                <th scope="col">Duration</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.length ? (
                attendanceHistory.map((row, idx) => (
                  <tr key={`${row.date}-${idx}`}>
                    <td>{formatDate(row.date)}</td>
                    <td>{formatDateTime(row.checkIn)}</td>
                    <td>{formatDateTime(row.checkOut)}</td>
                    <td>{formatDuration(row.workDurationMinutes)}</td>
                    <td>
                      <span className={`status-badge ${row.status === "present" ? "success" : row.status === "half-day" ? "warning" : "neutral"}`}>
                        {row.status || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5"><p className="muted">No attendance records.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
};

export default ManagerDashboardPage;
