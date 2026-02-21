import { useCallback, useEffect, useMemo, useState } from "react";
import { dashboardApi, employeeApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import LineTrendChart from "../../components/charts/LineTrendChart";
import DonutLeaveChart from "../../components/charts/DonutLeaveChart";
import DataTable from "../../components/common/DataTable";
import useAuth from "../../hooks/useAuth";
import { formatCurrency, formatDate, resolveFileUrl } from "../../utils/format";

const AdminDashboardPage = () => {
  const { profile } = useAuth();
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null,
    employees: []
  });
  const [expandedKpis, setExpandedKpis] = useState({});
  const [expandedPulseCards, setExpandedPulseCards] = useState({});
  const [expandedStats, setExpandedStats] = useState({});

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const [dashboardRes, employeeRes] = await Promise.all([
        dashboardApi.admin(),
        employeeApi.list({ limit: 200 })
      ]);
      setState({
        loading: false,
        error: "",
        data: dashboardRes.data,
        employees: employeeRes.data || []
      });
    } catch (error) {
      setState({ loading: false, error: error.message, data: null, employees: [] });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const employeeTrend = useMemo(
    () =>
      (state.employees || [])
        .slice()
        .sort((a, b) => new Date(b.joinDate || 0).getTime() - new Date(a.joinDate || 0).getTime())
        .slice(0, 8),
    [state.employees]
  );

  const topPerformers = useMemo(() => {
    const people = state.employees || [];
    return (state.data?.performanceInsights || [])
      .map((item) => {
        const match = people.find((employee) => {
          const name = `${employee.firstName || ""} ${employee.lastName || ""}`.trim().toLowerCase();
          return name && name === String(item.name || "").trim().toLowerCase();
        });
        return {
          ...item,
          employeeId: match?.employeeId,
          avatarUrl: match?.avatarUrl
        };
      })
      .sort((a, b) => Number(b.completionRate || 0) - Number(a.completionRate || 0))
      .slice(0, 4);
  }, [state.data?.performanceInsights, state.employees]);

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

  const kpis = state.data?.kpis || {};
  const departmentCount = useMemo(
    () => new Set((state.employees || []).map((employee) => employee.department).filter(Boolean)).size,
    [state.employees]
  );

  const totalTasks = useMemo(
    () => (state.data?.performanceInsights || []).reduce((sum, item) => sum + Number(item.totalTasks || 0), 0),
    [state.data?.performanceInsights]
  );

  const completedTasks = useMemo(
    () => (state.data?.performanceInsights || []).reduce((sum, item) => sum + Number(item.completedTasks || 0), 0),
    [state.data?.performanceInsights]
  );

  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingTasks = Math.max(totalTasks - completedTasks, 0);
  const avgTaskLoad = kpis.totalEmployees ? (totalTasks / kpis.totalEmployees).toFixed(1) : "0.0";
  const highRiskCount = (state.data?.overtimeSummary || []).filter((row) => row.burnoutRisk === "high").length;

  const graphsAnalysisData = useMemo(() => {
    const departmentMix = (state.data?.payrollByDepartment || [])
      .filter((row) => Number(row.headcount || 0) > 0)
      .slice(0, 6)
      .map((row) => ({ name: row.department || "Unassigned", value: Number(row.headcount || 0) }));

    if (departmentMix.length) return departmentMix;

    return [
      { name: "Employees", value: Number(kpis.totalEmployees || 0) },
      { name: "Projects", value: Number(kpis.activeProjects || 0) },
      { name: "Pending Leaves", value: Number(kpis.pendingLeaves || 0) },
      { name: "Tasks", value: Number(totalTasks || 0) }
    ].filter((item) => item.value > 0);
  }, [state.data?.payrollByDepartment, kpis.activeProjects, kpis.pendingLeaves, kpis.totalEmployees, totalTasks]);

  const attendanceTrendData = useMemo(() => {
    const rows = state.data?.attendanceRateChart || [];
    return rows.map((row, index) => {
      const windowRows = rows.slice(Math.max(0, index - 2), index + 1);
      const movingAvg = windowRows.length
        ? Math.round(windowRows.reduce((sum, item) => sum + Number(item.rate || 0), 0) / windowRows.length)
        : Number(row.rate || 0);
      return {
        ...row,
        rate: Number(row.rate || 0),
        movingAvg,
        target: 90
      };
    });
  }, [state.data?.attendanceRateChart]);

  const toggleMapCard = (setter, key) => {
    setter((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (state.loading) return <LoadingSpinner label="Loading admin dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid sequence-dashboard dashboard-modern">
      <header className="card sequence-header">
        <div className="sequence-user">
          <div className="avatar-cell medium">
            {profile?.avatarUrl ? (
              <img className="avatar-img" src={resolveFileUrl(profile.avatarUrl)} alt="Manager avatar" />
            ) : (
              <span className="avatar-fallback">
                {(profile?.firstName || "M").slice(0, 1)}
                {(profile?.lastName || "").slice(0, 1)}
              </span>
            )}
          </div>
          <div>
            <h2>Manager Workspace</h2>
            <p className="muted">{todayLabel}</p>
          </div>
        </div>
        <button className="btn btn-primary" type="button">
          View Detail
        </button>
      </header>

      <section className="card sequence-alert">
        <div>
          <strong>Dear Manager</strong>
          <p className="muted">Attendance, project delivery, and leave insights are synced in real-time.</p>
        </div>
      </section>

      <section className="sequence-kpi-grid">
        <article className="card sequence-kpi modern-kpi-card accent-blue">
          <button className="box-expand-btn" type="button" onClick={() => toggleMapCard(setExpandedKpis, "employees")}>
            {expandedKpis.employees ? "Hide" : "Insights"}
          </button>
          <small>Active Employees</small>
          <h3>{kpis.totalEmployees || 0}</h3>
          <div className="kpi-visual kpi-bars">
            <span style={{ height: "34%" }} />
            <span style={{ height: "48%" }} />
            <span style={{ height: "68%" }} />
            <span style={{ height: "84%" }} />
          </div>
          {expandedKpis.employees ? (
            <div className="box-insights">
              <span>Departments: {departmentCount}</span>
              <span>Top 8 shown in Team Pulse</span>
              <span>High burnout risk: {highRiskCount}</span>
            </div>
          ) : null}
        </article>
        <article className="card sequence-kpi modern-kpi-card accent-green">
          <button className="box-expand-btn" type="button" onClick={() => toggleMapCard(setExpandedKpis, "projects")}>
            {expandedKpis.projects ? "Hide" : "Insights"}
          </button>
          <small>Number of Projects</small>
          <h3>{kpis.activeProjects || 0}</h3>
          <div className="kpi-visual kpi-bars">
            <span style={{ height: "24%" }} />
            <span style={{ height: "42%" }} />
            <span style={{ height: "62%" }} />
            <span style={{ height: "78%" }} />
          </div>
          {expandedKpis.projects ? (
            <div className="box-insights">
              <span>Avg task load: {avgTaskLoad} / employee</span>
              <span>Pending leaves: {kpis.pendingLeaves || 0}</span>
              <span>Utilization is actively tracked</span>
            </div>
          ) : null}
        </article>
        <article className="card sequence-kpi modern-kpi-card accent-purple">
          <button className="box-expand-btn" type="button" onClick={() => toggleMapCard(setExpandedKpis, "tasks")}>
            {expandedKpis.tasks ? "Hide" : "Insights"}
          </button>
          <small>Number of Tasks</small>
          <h3>{totalTasks || 0}</h3>
          <div className="kpi-visual">
            <svg className="kpi-mini-line" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
              <polyline points="0,26 16,24 32,18 48,20 64,12 80,14 100,8" />
              <circle cx="80" cy="14" r="2.2" />
              <circle cx="100" cy="8" r="2.2" />
            </svg>
          </div>
          {expandedKpis.tasks ? (
            <div className="box-insights">
              <span>Completed: {completedTasks}</span>
              <span>Pending: {pendingTasks}</span>
              <span>Avg completion: {completionRate}%</span>
            </div>
          ) : null}
        </article>
        <article className="card sequence-kpi modern-kpi-card accent-orange">
          <button className="box-expand-btn" type="button" onClick={() => toggleMapCard(setExpandedKpis, "target")}>
            {expandedKpis.target ? "Hide" : "Insights"}
          </button>
          <small>Target Completed</small>
          <h3>{completionRate}%</h3>
          <div className="kpi-visual">
            <div className="kpi-donut" style={{ "--value": Math.max(8, Math.min(completionRate, 100)) }}>
              <span className="kpi-donut-value">{completionRate}%</span>
            </div>
          </div>
          {expandedKpis.target ? (
            <div className="box-insights">
              <span>Target baseline: 90%</span>
              <span>Gap: {Math.max(0, 90 - completionRate)}%</span>
              <span>Current health: {completionRate >= 90 ? "On Track" : "Needs Push"}</span>
            </div>
          ) : null}
        </article>
      </section>

      <section className="sequence-main-grid">
        <article className="card sequence-list-card employee-scroll-panel">
          <div className="card-head">
            <h3>On Going Team Pulse</h3>
          </div>
          <div className="pulse-grid">
            {employeeTrend.length ? (
              employeeTrend.map((employee) => (
                <article
                  className={`pulse-card ${expandedPulseCards[employee.user?._id || employee._id] ? "expanded" : ""}`}
                  key={employee.user?._id || employee._id}
                >
                  <button
                    className="box-expand-btn small"
                    type="button"
                    onClick={() => toggleMapCard(setExpandedPulseCards, employee.user?._id || employee._id)}
                  >
                    {expandedPulseCards[employee.user?._id || employee._id] ? "Less" : "More"}
                  </button>
                  <div className="pulse-head">
                    <div className="avatar-cell small">
                      {employee.avatarUrl ? (
                        <img
                          className="avatar-img"
                          src={resolveFileUrl(employee.avatarUrl)}
                          alt={`${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "Employee"}
                        />
                      ) : (
                        <span className="avatar-fallback">
                          {(employee.firstName || "E").slice(0, 1)}
                          {(employee.lastName || "").slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div>
                      <strong className="pulse-name">
                        {employee.firstName} {employee.lastName}
                      </strong>
                      <p className="muted">{employee.designation || "-"}</p>
                    </div>
                  </div>
                  <div className="pulse-meta">
                    <span>ID: {employee.employeeId || "-"}</span>
                    <span>Dept: {employee.department || "-"}</span>
                    <span>Joined: {formatDate(employee.joinDate)}</span>
                  </div>
                  {expandedPulseCards[employee.user?._id || employee._id] ? (
                    <div className="box-insights compact">
                      <span>Email: {employee.user?.email || employee.personalEmail || "-"}</span>
                      <span>Phone: {employee.phone || "-"}</span>
                      <span>Work mode: {employee.workMode || "-"}</span>
                      <span>Type: {employee.employmentType || "-"}</span>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="muted">No employees found.</p>
            )}
          </div>
        </article>

        <DonutLeaveChart
          title="Graphs and Analysis"
          data={graphsAnalysisData}
          height={340}
          innerRadius={60}
          outerRadius={112}
          variant="callout"
          showLegend={false}
          showTotal={false}
        />
      </section>

      <section className="sequence-main-grid">
        <LineTrendChart
          title="Attendance Rate Trend"
          data={attendanceTrendData}
          xKey="date"
          lines={[
            { dataKey: "rate", color: "#2563EB", name: "Actual Rate", showArea: true },
            { dataKey: "movingAvg", color: "#10B981", name: "Moving Avg" },
            { dataKey: "target", color: "#EF4444", name: "Target", strokeDasharray: "5 5" }
          ]}
        />

        <article className="card sequence-performer-card">
          <div className="card-head">
            <h3>Top Performance</h3>
          </div>
          <div className="sequence-performer-grid">
            {topPerformers.length ? (
              topPerformers.map((item, index) => (
                <article key={`${item.name}-${index}`} className="sequence-performer-item modern-performer">
                  <div className="avatar-cell medium">
                    {item.avatarUrl ? (
                      <img className="avatar-img" src={resolveFileUrl(item.avatarUrl)} alt={item.name} />
                    ) : (
                      <span className="avatar-fallback">{String(item.name || "E").slice(0, 1)}</span>
                    )}
                  </div>
                  <strong>{item.name || "-"}</strong>
                  <small className="muted">{item.department || "-"}</small>
                  <span className="sequence-rank">{index + 1}</span>
                </article>
              ))
            ) : (
              <p className="muted">No performance insights yet.</p>
            )}
          </div>
        </article>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Workload Risk Monitor</h3>
        </div>
        <DataTable
          rows={state.data?.overtimeSummary || []}
          columns={[
            { key: "userId", label: "User ID" },
            { key: "burnoutRisk", label: "Burnout Risk", type: "status" }
          ]}
        />
      </section>

      <section className="card sequence-payroll-note">
        <article className="modern-stat-card accent-blue">
          <button className="box-expand-btn" type="button" onClick={() => toggleMapCard(setExpandedStats, "payroll")}>
            {expandedStats.payroll ? "Hide" : "Insights"}
          </button>
          <small className="muted">Monthly Payroll</small>
          <h3>{formatCurrency(kpis.totalMonthlyPayroll || 0)}</h3>
          {expandedStats.payroll ? (
            <div className="box-insights">
              <span>Departments funded: {state.data?.payrollByDepartment?.length || 0}</span>
              <span>Avg task load: {avgTaskLoad}</span>
            </div>
          ) : null}
        </article>
        <article className="modern-stat-card accent-orange">
          <button className="box-expand-btn" type="button" onClick={() => toggleMapCard(setExpandedStats, "leave")}>
            {expandedStats.leave ? "Hide" : "Insights"}
          </button>
          <small className="muted">Pending Leaves</small>
          <h3>{kpis.pendingLeaves || 0}</h3>
          {expandedStats.leave ? (
            <div className="box-insights">
              <span>High risk members: {highRiskCount}</span>
              <span>Follow-up required for approvals</span>
            </div>
          ) : null}
        </article>
      </section>
    </section>
  );
};

export default AdminDashboardPage;
