import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, CheckCircle2, Clock, DollarSign, TrendingUp, CalendarDays, Target } from "lucide-react";
import { dashboardApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import LineTrendChart from "../../components/charts/LineTrendChart";
import DonutLeaveChart from "../../components/charts/DonutLeaveChart";
import ProgressPie3D from "../../components/charts/ProgressPie3D";
import BarMetricsChart from "../../components/charts/BarMetricsChart";
import FormModal from "../../components/common/FormModal";
import useAuth from "../../hooks/useAuth";
import { formatCurrency, formatDate, formatDateTime, formatDuration, resolveFileUrl } from "../../utils/format";

const EmployeeDashboardPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [infoModal, setInfoModal] = useState({ open: false, title: "", rows: [] });

  const openInfo = (title, rows = []) => {
    setInfoModal({ open: true, title, rows });
  };

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

  const profileCompletionScore = useMemo(() => {
    const keys = [
      profile?.firstName,
      profile?.lastName,
      profile?.phone,
      profile?.department,
      profile?.designation,
      profile?.employeeId,
      profile?.personalEmail,
      profile?.avatarUrl
    ];
    const done = keys.filter(Boolean).length;
    return Math.round((done / keys.length) * 100);
  }, [profile]);

  if (state.loading) return <LoadingSpinner label="Loading employee dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  const leaveSummary = state.data?.leaveSummary || {};
  const payHealth = state.data?.payroll?.monthlyGross
    ? Math.round((Number(state.data?.payroll?.netPay || 0) / Number(state.data?.payroll?.monthlyGross || 1)) * 100)
    : 0;
  const taskRows = state.data?.recentTasks || [];
  const assignedProjects = state.data?.assignedProjects || [];
  const totalLeaveBalance = leaveChartData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const projectProgressData = assignedProjects.slice(0, 6).map((project) => ({
    code: project.code || "-",
    progress: Number(project.progress || 0),
    target: 100
  }));
  const upcomingDeadlines = taskRows
    .slice()
    .filter((task) => task.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6);

  const totalTaskCount = (state.data?.taskSummary?.pending || 0) + (state.data?.taskSummary?.completed || 0);
  const taskCompletionScore = totalTaskCount
    ? Math.round(((state.data?.taskSummary?.completed || 0) / totalTaskCount) * 100)
    : 0;
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
                {(profile?.firstName || "E").slice(0, 1)}
                {(profile?.lastName || "").slice(0, 1)}
              </span>
            )}
          </div>
          <div>
            <h2 className="dash-welcome-title">{greeting}, {profile?.firstName || "Employee"}</h2>
            <p className="dash-welcome-sub">
              {todayLabel}
              {state.data?.employeeId ? ` · ${state.data.employeeId}` : ""}
            </p>
          </div>
        </div>
        <div className="dash-welcome-stats">
          <div className="dash-mini-stat">
            <ListChecks size={15} />
            <span><strong>{state.data?.taskSummary?.pending || 0}</strong> Pending</span>
          </div>
          <div className="dash-mini-stat">
            <CheckCircle2 size={15} />
            <span><strong>{state.data?.taskSummary?.completed || 0}</strong> Done</span>
          </div>
          <div className="dash-mini-stat">
            <CalendarDays size={15} />
            <span><strong>{totalLeaveBalance}</strong> Leave Balance</span>
          </div>
        </div>
      </header>

      <section className="dash-kpi-row">
        <article className="dash-kpi-card dash-kpi-blue" onClick={() => openInfo("Pending Tasks", [`Pending: ${state.data?.taskSummary?.pending || 0}`, `Recent tasks: ${taskRows.length}`])}>
          <div className="dash-kpi-icon-wrap blue"><ListChecks size={20} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Pending Tasks</span>
            <h3 className="dash-kpi-value">{state.data?.taskSummary?.pending || 0}</h3>
            <span className="dash-kpi-change">{upcomingDeadlines.length} due soon</span>
          </div>
        </article>

        <article className="dash-kpi-card dash-kpi-green" onClick={() => openInfo("Completed Tasks", [`Completed: ${state.data?.taskSummary?.completed || 0}`])}>
          <div className="dash-kpi-icon-wrap green"><CheckCircle2 size={20} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Completed Tasks</span>
            <h3 className="dash-kpi-value">{state.data?.taskSummary?.completed || 0}</h3>
            <span className="dash-kpi-change positive"><TrendingUp size={12} /> Great progress</span>
          </div>
        </article>

        <article className="dash-kpi-card dash-kpi-purple" onClick={() => openInfo("Attendance", [`Entries: ${state.data?.attendanceHistory?.length || 0}`])}>
          <div className="dash-kpi-icon-wrap purple"><Clock size={20} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Attendance Days</span>
            <h3 className="dash-kpi-value">{state.data?.attendanceHistory?.length || 0}</h3>
            <span className="dash-kpi-change">This period</span>
          </div>
        </article>

        <article className="dash-kpi-card dash-kpi-orange" onClick={() => openInfo("Net Pay", [`Net: ${formatCurrency(state.data?.payroll?.netPay || 0)}`, `Gross: ${formatCurrency(state.data?.payroll?.monthlyGross || 0)}`])}>
          <div className="dash-kpi-icon-wrap orange"><DollarSign size={20} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Net Pay</span>
            <h3 className="dash-kpi-value">{formatCurrency(state.data?.payroll?.netPay || 0)}</h3>
            <div className="dash-kpi-bar">
              <div className="dash-kpi-bar-fill" style={{ width: `${Math.min(payHealth, 100)}%` }} />
            </div>
          </div>
        </article>
      </section>

      <section className="dash-two-col">
        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Quick Actions</h3>
          </div>
          <div className="button-row" style={{ marginBottom: "14px" }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate("/employee/tasks")}>Tasks</button>
            <button type="button" className="btn btn-outline" onClick={() => navigate("/employee/attendance")}>Attendance</button>
            <button type="button" className="btn btn-outline" onClick={() => navigate("/employee/leave")}>Leave</button>
            <button type="button" className="btn btn-outline" onClick={() => navigate("/employee/profile")}>Profile</button>
          </div>
          <div className="dash-snapshot-grid">
            <div className="dash-snapshot-item blue" onClick={() => openInfo("Task Completion", [`Completed ${state.data?.taskSummary?.completed || 0} of ${totalTaskCount}`])}>
              <ProgressPie3D value={taskCompletionScore} size={58} />
              <span className="dash-snapshot-label">Task Completion</span>
            </div>
            <div className="dash-snapshot-item green" onClick={() => openInfo("Profile Completion", [`Profile details completion: ${profileCompletionScore}%`])}>
              <ProgressPie3D value={profileCompletionScore} size={58} />
              <span className="dash-snapshot-label">Profile Completion</span>
            </div>
          </div>
        </article>

        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Upcoming Deadlines</h3>
            <span className="dash-table-count">{upcomingDeadlines.length} tasks</span>
          </div>
          <div className="table-wrap">
            <table className="table-unified">
              <thead>
                <tr>
                  <th scope="col">Task</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {upcomingDeadlines.length ? (
                  upcomingDeadlines.map((row) => (
                    <tr key={row._id}>
                      <td>{row.title || "-"}</td>
                      <td>
                        <span className={`status-badge ${row.priority === "high" ? "danger" : row.priority === "medium" ? "warning" : "info"}`}>
                          {row.priority || "-"}
                        </span>
                      </td>
                      <td>{formatDate(row.dueDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3"><p className="muted">No upcoming deadlines.</p></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="dash-two-col">
        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Recent Tasks</h3>
            <span className="dash-table-count">{taskRows.length} tasks</span>
          </div>
          <div className="table-wrap">
            <table className="table-unified">
              <thead>
                <tr>
                  <th scope="col">Task</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {taskRows.length ? (
                  taskRows.map((task) => (
                    <tr key={task._id} className="clickable-box" onClick={() => openInfo(task.title || "Task", [`Status: ${task.status || "-"}`, `Priority: ${task.priority || "-"}`, `Progress: ${task.progress || 0}%`, `Due: ${formatDate(task.dueDate)}`])}>
                      <td><strong>{task.title || "-"}</strong></td>
                      <td><span className={`status-badge ${task.priority === "high" ? "danger" : task.priority === "medium" ? "warning" : "info"}`}>{task.priority || "-"}</span></td>
                      <td><span className={`status-badge ${task.status === "done" ? "success" : task.status === "in-progress" ? "info" : "neutral"}`}>{task.status || "-"}</span></td>
                      <td>
                        <div className="dash-progress-cell">
                          <div className="dash-progress-bar">
                            <div className="dash-progress-fill" style={{ width: `${Math.min(task.progress || 0, 100)}%` }} />
                          </div>
                          <span>{task.progress || 0}%</span>
                        </div>
                      </td>
                      <td>{formatDate(task.dueDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5"><p className="muted">No recent tasks</p></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <LineTrendChart
          title="Attendance Graph"
          data={attendanceTrend}
          xKey="date"
          lines={[
            { dataKey: "duration", color: "#0f5a73", name: "Worked Hours", showArea: true },
            { dataKey: "avgDuration", color: "#f97316", name: "Moving Avg" }
          ]}
        />
      </section>

      <section className="dash-two-col">
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

        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Payroll & Leave Snapshot</h3>
          </div>
          <div className="dash-snapshot-grid">
            <div className="dash-snapshot-item blue" onClick={() => openInfo("Monthly Gross", [`Gross: ${formatCurrency(state.data?.payroll?.monthlyGross || 0)}`, `Payout day: ${state.data?.payroll?.payoutDay || 25}`])}>
              <DollarSign size={18} />
              <span className="dash-snapshot-label">Monthly Gross</span>
              <strong>{formatCurrency(state.data?.payroll?.monthlyGross || 0)}</strong>
            </div>
            <div className="dash-snapshot-item purple" onClick={() => openInfo("Deductions", [`Deductions: ${formatCurrency(state.data?.payroll?.deductions || 0)}`, `Net: ${formatCurrency(state.data?.payroll?.netPay || 0)}`])}>
              <Target size={18} />
              <span className="dash-snapshot-label">Deductions</span>
              <strong>{formatCurrency(state.data?.payroll?.deductions || 0)}</strong>
            </div>
            <div className="dash-snapshot-item green" onClick={() => openInfo("Approved Leaves", [`Approved: ${leaveSummary.approved?.count || 0}`, `Days: ${leaveSummary.approved?.days || 0}`])}>
              <CheckCircle2 size={18} />
              <span className="dash-snapshot-label">Approved Leaves</span>
              <strong>{leaveSummary.approved?.count || 0}</strong>
            </div>
            <div className="dash-snapshot-item orange" onClick={() => openInfo("Pending Leaves", [`Pending: ${leaveSummary.pending?.count || 0}`, `Days: ${leaveSummary.pending?.days || 0}`])}>
              <Clock size={18} />
              <span className="dash-snapshot-label">Pending Leaves</span>
              <strong>{leaveSummary.pending?.count || 0}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="dash-two-col">
        {projectProgressData.length ? (
          <BarMetricsChart
            title="Project Progress"
            data={projectProgressData}
            xKey="code"
            bars={[
              { dataKey: "progress", color: "#f97316", name: "Progress %" },
              { dataKey: "target", color: "#0f5a73", name: "Target %" }
            ]}
          />
        ) : (
          <article className="card">
            <div className="card-head"><h3>Project Progress</h3></div>
            <p className="muted">No assigned projects right now.</p>
          </article>
        )}

        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Assigned Projects</h3>
            <span className="dash-table-count">{assignedProjects.length} projects</span>
          </div>
          <div className="table-wrap">
            <table className="table-unified">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Project</th>
                  <th scope="col">Role</th>
                  <th scope="col">Client</th>
                  <th scope="col">Status</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {assignedProjects.length ? (
                  assignedProjects.map((project) => (
                    <tr key={project._id}>
                      <td><strong>{project.code || "-"}</strong></td>
                      <td>{project.name || "-"}</td>
                      <td>{project.assignmentType || "-"}</td>
                      <td>{project.client?.company || project.client?.name || "-"}</td>
                      <td><span className={`status-badge ${project.status === "completed" ? "success" : project.status === "active" ? "info" : "neutral"}`}>{project.status || "-"}</span></td>
                      <td>
                        <div className="dash-progress-cell">
                          <div className="dash-progress-bar">
                            <div className="dash-progress-fill" style={{ width: `${Math.min(project.progress || 0, 100)}%` }} />
                          </div>
                          <span>{project.progress || 0}%</span>
                        </div>
                      </td>
                      <td>{formatDate(project.endDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7"><p className="muted">No assigned projects</p></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="card dash-table-card">
        <div className="card-head">
          <h3>Attendance Timeline</h3>
          <span className="dash-table-count">{(state.data?.attendanceHistory || []).length} records</span>
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
              {(state.data?.attendanceHistory || []).length ? (
                (state.data?.attendanceHistory || []).map((row, idx) => (
                  <tr key={idx}>
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
                <tr>
                  <td colSpan="5"><p className="muted">No attendance records</p></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <FormModal
        title={infoModal.title || "Details"}
        open={infoModal.open}
        onClose={() => setInfoModal({ open: false, title: "", rows: [] })}
        width="520px"
      >
        <div className="insight-list">
          {(infoModal.rows || []).length ? (
            infoModal.rows.map((row, idx) => <p key={`${infoModal.title}-${idx}`}>{row}</p>)
          ) : (
            <p className="muted">No additional data available.</p>
          )}
        </div>
      </FormModal>
    </section>
  );
};

export default EmployeeDashboardPage;
