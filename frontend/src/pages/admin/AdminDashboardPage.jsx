import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Briefcase, ListChecks, AlertTriangle, CalendarDays } from "lucide-react";
import { attendanceApi, dashboardApi, employeeApi, leaveApi, projectApi, taskApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import LineTrendChart from "../../components/charts/LineTrendChart";
import DonutLeaveChart from "../../components/charts/DonutLeaveChart";
import BarMetricsChart from "../../components/charts/BarMetricsChart";
import FormModal from "../../components/common/FormModal";
import useAuth from "../../hooks/useAuth";
import { formatDate, resolveFileUrl } from "../../utils/format";

const toIsoDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const fmtTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null,
    employees: [],
    projects: [],
    tasks: [],
    todayAttendance: [],
    pendingLeaves: [],
    togglingTaskId: ""
  });
  const [infoModal, setInfoModal] = useState({ open: false, title: "", rows: [] });

  const openInfo = (title, rows = []) => setInfoModal({ open: true, title, rows });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const todayIso = toIsoDate(new Date());

      const [dashboardRes, employeeRes, projectRes, taskRes, attendanceRes, pendingLeavesRes] = await Promise.all([
        dashboardApi.admin(),
        employeeApi.list({ limit: 300 }),
        projectApi.list({ limit: 50 }),
        taskApi.admin({ limit: 100 }),
        attendanceApi.admin({ limit: 500, dateFrom: todayIso, dateTo: todayIso }),
        leaveApi.admin({ limit: 30, status: "pending" })
      ]);

      setState({
        loading: false,
        error: "",
        data: dashboardRes.data,
        employees: employeeRes.data || [],
        projects: projectRes.data || [],
        tasks: taskRes.data || [],
        todayAttendance: attendanceRes.data || [],
        pendingLeaves: pendingLeavesRes.data || [],
        togglingTaskId: ""
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message,
        data: null,
        employees: [],
        projects: [],
        tasks: [],
        todayAttendance: [],
        pendingLeaves: [],
        togglingTaskId: ""
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleTaskDone = useCallback(async (task) => {
    if (!task?._id) return;
    try {
      setState((prev) => ({ ...prev, togglingTaskId: task._id }));
      const nextDone = task.status !== "done";
      await taskApi.updateStatus(task._id, {
        status: nextDone ? "done" : "todo",
        progress: nextDone ? 100 : 0
      });
      await loadData();
    } catch (error) {
      setState((prev) => ({ ...prev, togglingTaskId: "" }));
      openInfo("Task Update Failed", [error.message || "Unable to update task"]);
    }
  }, [loadData]);

  const kpis = state.data?.kpis || {};
  const totalEmployees = Number(kpis.totalEmployees || 0);

  const topPerformers = useMemo(() => {
    const employeesByUserId = new Map(
      (state.employees || []).map((row) => [String(row.user?._id || ""), row])
    );
    return (state.data?.performanceInsights || [])
      .map((item) => {
        const employee = employeesByUserId.get(String(item.userId || ""));
        return {
          ...item,
          firstName: employee?.firstName || item.name || "Unknown",
          lastName: employee?.lastName || "",
          department: item.department || employee?.department || "Unknown",
          avatarUrl: employee?.avatarUrl,
          employeeId: employee?.employeeId
        };
      })
      .sort((a, b) => Number(b.completionRate || 0) - Number(a.completionRate || 0))
      .slice(0, 8);
  }, [state.data?.performanceInsights, state.employees]);

  const attendanceSummary = useMemo(() => {
    const base = { present: 0, "half-day": 0, "on-leave": 0 };
    (state.todayAttendance || []).forEach((row) => {
      if (Object.prototype.hasOwnProperty.call(base, row.status)) {
        base[row.status] += 1;
      }
    });

    const tracked = base.present + base["half-day"] + base["on-leave"];
    const absent = Math.max(totalEmployees - tracked, 0);
    return {
      present: base.present,
      halfDay: base["half-day"],
      onLeave: base["on-leave"],
      absent
    };
  }, [state.todayAttendance, totalEmployees]);

  const attendanceDonutData = useMemo(() => {
    const rows = [
      { name: "Present", value: attendanceSummary.present, fill: "#22c55e" },
      { name: "Half Day", value: attendanceSummary.halfDay, fill: "#f4c21a" },
      { name: "On Leave", value: attendanceSummary.onLeave, fill: "#4b84f2" },
      { name: "Absent", value: attendanceSummary.absent, fill: "#ef4444" }
    ];
    return rows.filter((row) => Number(row.value || 0) > 0);
  }, [attendanceSummary.absent, attendanceSummary.halfDay, attendanceSummary.onLeave, attendanceSummary.present]);

  const attendanceTrendData = useMemo(() => {
    const rows = state.data?.attendanceRateChart || [];
    return rows.map((row, idx) => {
      const window = rows.slice(Math.max(0, idx - 2), idx + 1);
      const movingAvg = window.length
        ? Math.round(window.reduce((sum, item) => sum + Number(item.rate || 0), 0) / window.length)
        : Number(row.rate || 0);

      return {
        date: row.date,
        rate: Number(row.rate || 0),
        movingAvg,
        target: 90
      };
    });
  }, [state.data?.attendanceRateChart]);

  const projectRows = useMemo(
    () => (state.projects || []).slice().sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)).slice(0, 8),
    [state.projects]
  );
  const departmentHeadcountData = useMemo(() => {
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

  const taskRows = useMemo(
    () => (state.tasks || []).slice().sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)).slice(0, 10),
    [state.tasks]
  );

  const highRiskCount = (state.data?.overtimeSummary || []).filter((row) => row.burnoutRisk === "high").length;
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" }),
    []
  );

  if (state.loading) return <LoadingSpinner label="Loading admin dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid dash-pro">
      <header className="dash-welcome-card">
        <div className="dash-welcome-left">
          <div className="avatar-cell medium">
            {profile?.avatarUrl ? (
              <img className="avatar-img" src={resolveFileUrl(profile.avatarUrl)} alt="avatar" />
            ) : (
              <span className="avatar-fallback">
                {(profile?.firstName || "A").slice(0, 1)}
                {(profile?.lastName || "").slice(0, 1)}
              </span>
            )}
          </div>
          <div>
            <h2 className="dash-welcome-title">Admin Dashboard</h2>
            <p className="dash-welcome-sub">{todayLabel}</p>
          </div>
        </div>
        <div className="dash-welcome-stats">
          <div className="dash-mini-stat"><Users size={15} /><span><strong>{totalEmployees}</strong> Employees</span></div>
          <div className="dash-mini-stat"><Briefcase size={15} /><span><strong>{kpis.activeProjects || 0}</strong> Projects</span></div>
          <div className="dash-mini-stat"><CalendarDays size={15} /><span><strong>{kpis.pendingLeaves || 0}</strong> Pending Leaves</span></div>
        </div>
      </header>

      <section className="dash-kpi-row">
        <article className="dash-kpi-card dash-kpi-blue" onClick={() => navigate("/admin/employees")}>
          <div className="dash-kpi-icon-wrap blue"><Users size={20} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Employees</span>
            <h3 className="dash-kpi-value">{totalEmployees}</h3>
            <span className="dash-kpi-change">Active workforce</span>
          </div>
        </article>
        <article className="dash-kpi-card dash-kpi-green" onClick={() => navigate("/admin/projects")}>
          <div className="dash-kpi-icon-wrap green"><Briefcase size={20} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Active Projects</span>
            <h3 className="dash-kpi-value">{kpis.activeProjects || 0}</h3>
            <span className="dash-kpi-change">Current pipelines</span>
          </div>
        </article>
        <article className="dash-kpi-card dash-kpi-purple" onClick={() => navigate("/admin/projects")}>
          <div className="dash-kpi-icon-wrap purple"><ListChecks size={20} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Tasks</span>
            <h3 className="dash-kpi-value">{state.tasks.length}</h3>
            <span className="dash-kpi-change">{state.tasks.filter((task) => task.status === "done").length} completed</span>
          </div>
        </article>
        <article className="dash-kpi-card dash-kpi-orange" onClick={() => openInfo("Risk Alerts", [`High burnout risk employees: ${highRiskCount}`])}>
          <div className="dash-kpi-icon-wrap orange"><AlertTriangle size={20} /></div>
          <div className="dash-kpi-info">
            <span className="dash-kpi-label">Risk Alerts</span>
            <h3 className="dash-kpi-value">{highRiskCount}</h3>
            <span className="dash-kpi-change">From attendance analytics</span>
          </div>
        </article>
      </section>

      <section className="dash-two-col">
        <DonutLeaveChart
          title="Today Attendance"
          data={attendanceDonutData}
          height={250}
          innerRadius={52}
          outerRadius={90}
          variant="segmented-ring"
        />
        <LineTrendChart
          title="Attendance Rate"
          data={attendanceTrendData}
          xKey="date"
          lines={[
            { dataKey: "rate", color: "#0f5a73", name: "Rate %" },
            { dataKey: "movingAvg", color: "#f97316", name: "Moving Avg %" },
            { dataKey: "target", color: "#16a34a", name: "Target %" }
          ]}
        />
      </section>

      <section className="dash-two-col">
        <BarMetricsChart
          title="Department Headcount"
          data={departmentHeadcountData}
          xKey="department"
          bars={[{ dataKey: "headcount", color: "#4b84f2", name: "Headcount" }]}
        />

        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Pending Leave Approvals</h3>
            <button type="button" className="zoho-btn-select" onClick={() => navigate("/admin/leaves")}>Leave Desk</button>
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
                </tr>
              </thead>
              <tbody>
                {state.pendingLeaves.length ? (
                  state.pendingLeaves.slice(0, 8).map((row) => (
                    <tr key={row._id}>
                      <td>{`${row.firstName || ""} ${row.lastName || ""}`.trim() || row.user?.email || "-"}</td>
                      <td>{row.leaveType || "-"}</td>
                      <td>{row.days || 0}</td>
                      <td>{formatDate(row.startDate)}</td>
                      <td>{formatDate(row.endDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5"><p className="muted">No pending leave requests.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="dash-two-col">
        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Recent Projects</h3>
            <button type="button" className="zoho-btn-select" onClick={() => navigate("/admin/projects")}>View All</button>
          </div>
          <div className="table-wrap">
            <table className="table-unified">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Project</th>
                  <th scope="col">Client</th>
                  <th scope="col">Status</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {projectRows.length ? (
                  projectRows.map((row) => (
                    <tr key={row._id}>
                      <td><strong>{row.code || "-"}</strong></td>
                      <td>{row.name || "-"}</td>
                      <td>{row.client?.company || row.client?.name || "-"}</td>
                      <td><span className={`status-badge ${row.status === "completed" ? "success" : row.status === "active" ? "info" : "neutral"}`}>{row.status || "-"}</span></td>
                      <td>{Number(row.progress || 0)}%</td>
                      <td>{formatDate(row.endDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6"><p className="muted">No projects yet.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Recent Tasks</h3>
            <button type="button" className="zoho-btn-select" onClick={() => navigate("/admin/projects")}>Manage</button>
          </div>
          <div className="table-wrap">
            <table className="table-unified">
              <thead>
                <tr>
                  <th scope="col">Done</th>
                  <th scope="col">Task</th>
                  <th scope="col">Assignee</th>
                  <th scope="col">Status</th>
                  <th scope="col">Due</th>
                </tr>
              </thead>
              <tbody>
                {taskRows.length ? (
                  taskRows.map((row) => (
                    <tr key={row._id}>
                      <td>
                        <input
                          type="checkbox"
                          className="custom-checkbox"
                          checked={row.status === "done"}
                          onChange={() => toggleTaskDone(row)}
                          disabled={state.togglingTaskId === row._id}
                        />
                      </td>
                      <td>{row.title || "-"}</td>
                      <td>{row.assignedTo?.email || "-"}</td>
                      <td><span className={`status-badge ${row.status === "done" ? "success" : row.status === "in-progress" ? "info" : "neutral"}`}>{row.status || "-"}</span></td>
                      <td>{formatDate(row.dueDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5"><p className="muted">No tasks yet.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="dash-two-col">
        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Top Performers</h3>
            <button type="button" className="zoho-btn-select" onClick={() => navigate("/admin/reports")}>Reports</button>
          </div>
          <div className="table-wrap">
            <table className="table-unified">
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Employee ID</th>
                  <th scope="col">Department</th>
                  <th scope="col">Completed</th>
                  <th scope="col">Total</th>
                  <th scope="col">Rate</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.length ? (
                  topPerformers.map((row, idx) => (
                    <tr key={`${row.userId || idx}`}>
                      <td>{`${row.firstName || ""} ${row.lastName || ""}`.trim() || "-"}</td>
                      <td>{row.employeeId || "-"}</td>
                      <td>{row.department || "-"}</td>
                      <td>{row.completedTasks || 0}</td>
                      <td>{row.totalTasks || 0}</td>
                      <td>{row.completionRate || 0}%</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6"><p className="muted">No performance data yet.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card dash-table-card">
          <div className="card-head">
            <h3>Today Clock Logs</h3>
            <button type="button" className="zoho-btn-select" onClick={() => navigate("/admin/attendance")}>Attendance</button>
          </div>
          <div className="table-wrap">
            <table className="table-unified">
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col">Department</th>
                  <th scope="col">Check In</th>
                  <th scope="col">Check Out</th>
                  <th scope="col">Minutes</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {(state.todayAttendance || []).length ? (
                  state.todayAttendance.slice(0, 10).map((row, idx) => (
                    <tr key={`${row.user?._id || idx}-${row.date}`}>
                      <td>{`${row.firstName || ""} ${row.lastName || ""}`.trim() || row.user?.email || "-"}</td>
                      <td>{row.departmentSnapshot || "-"}</td>
                      <td>{fmtTime(row.checkIn)}</td>
                      <td>{fmtTime(row.checkOut)}</td>
                      <td>{row.workDurationMinutes || 0}</td>
                      <td><span className="status-badge neutral">{row.status || "-"}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6"><p className="muted">No attendance records today.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
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

export default AdminDashboardPage;
