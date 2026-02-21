import { useCallback, useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import LineTrendChart from "../../components/charts/LineTrendChart";
import DonutLeaveChart from "../../components/charts/DonutLeaveChart";
import DataTable from "../../components/common/DataTable";
import useAuth from "../../hooks/useAuth";
import { formatCurrency, formatDate, formatDateTime, formatDuration, resolveFileUrl } from "../../utils/format";

const EmployeeDashboardPage = () => {
  const { profile } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [expandedKpis, setExpandedKpis] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});
  const [expandedStats, setExpandedStats] = useState({});

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
    return rows.map((row, index) => {
      const duration = Number(((row.workDurationMinutes || 0) / 60).toFixed(2));
      const windowRows = rows.slice(Math.max(0, index - 2), index + 1);
      const avgDuration = windowRows.length
        ? Number(
            (
              windowRows.reduce((sum, item) => sum + Number(item.workDurationMinutes || 0), 0) /
              (windowRows.length * 60)
            ).toFixed(2)
          )
        : duration;
      return {
        date: formatDate(row.date),
        duration,
        avgDuration
      };
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

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
    []
  );

  if (state.loading) return <LoadingSpinner label="Loading employee dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  const leaveSummary = state.data?.leaveSummary || {};
  const payHealth = state.data?.payroll?.monthlyGross
    ? Math.round((Number(state.data?.payroll?.netPay || 0) / Number(state.data?.payroll?.monthlyGross || 1)) * 100)
    : 0;
  const taskRows = state.data?.recentTasks || [];
  const totalLeaveBalance = leaveChartData.reduce((sum, item) => sum + Number(item.value || 0), 0);

  const toggleMapCard = (setter, key) => {
    setter((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="page-grid sequence-dashboard dashboard-modern">
      <header className="card sequence-header">
        <div className="sequence-user">
          <div className="avatar-cell medium">
            {profile?.avatarUrl ? (
              <img className="avatar-img" src={resolveFileUrl(profile.avatarUrl)} alt="Employee avatar" />
            ) : (
              <span className="avatar-fallback">
                {(profile?.firstName || "E").slice(0, 1)}
                {(profile?.lastName || "").slice(0, 1)}
              </span>
            )}
          </div>
          <div>
            <h2>{state.data?.welcome || "Workspace Overview"}</h2>
            <p className="muted">
              {todayLabel}
              {state.data?.employeeId ? ` | ${state.data.employeeId}` : ""}
            </p>
          </div>
        </div>
      </header>

      <section className="card sequence-alert">
        <div>
          <strong>Your Work Brief</strong>
          <p className="muted">Check tasks, update progress, and keep your attendance timeline consistent.</p>
        </div>
      </section>

      <section className="sequence-kpi-grid">
        <article className="card sequence-kpi modern-kpi-card accent-blue">
          <button className="box-expand-btn" type="button" onClick={() => toggleMapCard(setExpandedKpis, "pending")}>
            {expandedKpis.pending ? "Hide" : "Insights"}
          </button>
          <small>Pending Tasks</small>
          <h3>{state.data?.taskSummary?.pending || 0}</h3>
          <div className="kpi-visual kpi-bars">
            <span style={{ height: "22%" }} />
            <span style={{ height: "38%" }} />
            <span style={{ height: "58%" }} />
            <span style={{ height: "76%" }} />
          </div>
          {expandedKpis.pending ? (
            <div className="box-insights">
              <span>Due soon: {taskRows.filter((task) => new Date(task.dueDate) >= new Date()).length}</span>
              <span>Track each task card below</span>
            </div>
          ) : null}
        </article>
        <article className="card sequence-kpi modern-kpi-card accent-green">
          <button className="box-expand-btn" type="button" onClick={() => toggleMapCard(setExpandedKpis, "completed")}>
            {expandedKpis.completed ? "Hide" : "Insights"}
          </button>
          <small>Completed Tasks</small>
          <h3>{state.data?.taskSummary?.completed || 0}</h3>
          <div className="kpi-visual kpi-bars">
            <span style={{ height: "30%" }} />
            <span style={{ height: "44%" }} />
            <span style={{ height: "70%" }} />
            <span style={{ height: "88%" }} />
          </div>
          {expandedKpis.completed ? (
            <div className="box-insights">
              <span>Total listed tasks: {taskRows.length}</span>
              <span>Completion updates reflected live</span>
            </div>
          ) : null}
        </article>
        <article className="card sequence-kpi modern-kpi-card accent-purple">
          <button
            className="box-expand-btn"
            type="button"
            onClick={() => toggleMapCard(setExpandedKpis, "attendance")}
          >
            {expandedKpis.attendance ? "Hide" : "Insights"}
          </button>
          <small>Attendance Entries</small>
          <h3>{state.data?.attendanceHistory?.length || 0}</h3>
          <div className="kpi-visual">
            <svg className="kpi-mini-line" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
              <polyline points="0,24 14,20 28,22 42,14 56,17 72,11 86,13 100,8" />
              <circle cx="72" cy="11" r="2.2" />
              <circle cx="100" cy="8" r="2.2" />
            </svg>
          </div>
          {expandedKpis.attendance ? (
            <div className="box-insights">
              <span>Last 7 day trend displayed</span>
              <span>Avg hours are auto-calculated</span>
            </div>
          ) : null}
        </article>
        <article className="card sequence-kpi modern-kpi-card accent-orange">
          <button className="box-expand-btn" type="button" onClick={() => toggleMapCard(setExpandedKpis, "pay")}>
            {expandedKpis.pay ? "Hide" : "Insights"}
          </button>
          <small>Net Pay</small>
          <h3>{formatCurrency(state.data?.payroll?.netPay || 0)}</h3>
          <div className="kpi-visual">
            <div className="kpi-donut" style={{ "--value": Math.max(10, Math.min(payHealth, 100)) }}>
              <span className="kpi-donut-value">{payHealth}%</span>
            </div>
          </div>
          {expandedKpis.pay ? (
            <div className="box-insights">
              <span>Gross: {formatCurrency(state.data?.payroll?.monthlyGross || 0)}</span>
              <span>Deductions: {formatCurrency(state.data?.payroll?.deductions || 0)}</span>
            </div>
          ) : null}
        </article>
      </section>

      <section className="sequence-main-grid">
        <article className="card sequence-list-card employee-scroll-panel">
          <div className="card-head">
            <h3>On Going Tasks</h3>
          </div>
          <div className="task-grid">
            {taskRows.length ? (
              taskRows.map((task) => (
                <article className={`task-card ${expandedTasks[task._id || task.title] ? "expanded" : ""}`} key={task._id || task.title}>
                  <button
                    className="box-expand-btn small"
                    type="button"
                    onClick={() => toggleMapCard(setExpandedTasks, task._id || task.title)}
                  >
                    {expandedTasks[task._id || task.title] ? "Less" : "More"}
                  </button>
                  <strong className="pulse-name">{task.title}</strong>
                  <p className="muted">
                    {task.priority} | {task.status}
                  </p>
                  <div className="task-progress-mini">
                    <span>{task.progress || 0}%</span>
                    <div>
                      <i style={{ width: `${Math.max(4, Number(task.progress || 0))}%` }} />
                    </div>
                  </div>
                  {expandedTasks[task._id || task.title] ? (
                    <div className="box-insights compact">
                      <span>Due: {formatDate(task.dueDate)}</span>
                      <span>Priority: {task.priority || "-"}</span>
                      <span>Status: {task.status || "-"}</span>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="muted">No recent tasks.</p>
            )}
          </div>
        </article>

        <LineTrendChart
          title="Attendance Graph"
          data={attendanceTrend}
          xKey="date"
          lines={[
            { dataKey: "duration", color: "#2563EB", name: "Worked Hours", showArea: true },
            { dataKey: "avgDuration", color: "#10B981", name: "Moving Avg" }
          ]}
        />
      </section>

      <section className="sequence-main-grid">
        <DonutLeaveChart title="Leave Balance" data={leaveChartData} />

        <article className="card sequence-performer-card">
          <div className="card-head">
            <h3>Payroll & Leave Snapshot</h3>
          </div>
          <div className="sequence-note-grid">
            <article className="modern-stat-card accent-blue">
              <button className="box-expand-btn" type="button" onClick={() => toggleMapCard(setExpandedStats, "gross")}>
                {expandedStats.gross ? "Hide" : "Insights"}
              </button>
              <small className="muted">Monthly Gross</small>
              <h3>{formatCurrency(state.data?.payroll?.monthlyGross || 0)}</h3>
              {expandedStats.gross ? (
                <div className="box-insights">
                  <span>Payout day: {state.data?.payroll?.payoutDay || 25}</span>
                  <span>Health score: {payHealth}%</span>
                </div>
              ) : null}
            </article>
            <article className="modern-stat-card accent-purple">
              <button
                className="box-expand-btn"
                type="button"
                onClick={() => toggleMapCard(setExpandedStats, "deductions")}
              >
                {expandedStats.deductions ? "Hide" : "Insights"}
              </button>
              <small className="muted">Deductions</small>
              <h3>{formatCurrency(state.data?.payroll?.deductions || 0)}</h3>
              {expandedStats.deductions ? (
                <div className="box-insights">
                  <span>Net pay: {formatCurrency(state.data?.payroll?.netPay || 0)}</span>
                </div>
              ) : null}
            </article>
            <article className="modern-stat-card accent-green">
              <button
                className="box-expand-btn"
                type="button"
                onClick={() => toggleMapCard(setExpandedStats, "approvedLeave")}
              >
                {expandedStats.approvedLeave ? "Hide" : "Insights"}
              </button>
              <small className="muted">Approved Leaves</small>
              <h3>{leaveSummary.approved?.count || 0}</h3>
              {expandedStats.approvedLeave ? (
                <div className="box-insights">
                  <span>Days approved: {leaveSummary.approved?.days || 0}</span>
                </div>
              ) : null}
            </article>
            <article className="modern-stat-card accent-orange">
              <button
                className="box-expand-btn"
                type="button"
                onClick={() => toggleMapCard(setExpandedStats, "pendingLeave")}
              >
                {expandedStats.pendingLeave ? "Hide" : "Insights"}
              </button>
              <small className="muted">Pending Leaves</small>
              <h3>{leaveSummary.pending?.count || 0}</h3>
              {expandedStats.pendingLeave ? (
                <div className="box-insights">
                  <span>Days pending: {leaveSummary.pending?.days || 0}</span>
                  <span>Total balance: {totalLeaveBalance}</span>
                </div>
              ) : null}
            </article>
          </div>
        </article>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Attendance Timeline</h3>
        </div>
        <DataTable
          rows={state.data?.attendanceHistory || []}
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

export default EmployeeDashboardPage;
