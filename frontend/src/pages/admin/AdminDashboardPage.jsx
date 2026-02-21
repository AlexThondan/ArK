import { useCallback, useEffect, useMemo, useState } from "react";
import { dashboardApi, employeeApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import LineTrendChart from "../../components/charts/LineTrendChart";
import BarMetricsChart from "../../components/charts/BarMetricsChart";
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

  const totalTasks = useMemo(
    () => (state.data?.performanceInsights || []).reduce((sum, item) => sum + Number(item.totalTasks || 0), 0),
    [state.data?.performanceInsights]
  );

  const completedTasks = useMemo(
    () => (state.data?.performanceInsights || []).reduce((sum, item) => sum + Number(item.completedTasks || 0), 0),
    [state.data?.performanceInsights]
  );

  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (state.loading) return <LoadingSpinner label="Loading admin dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid sequence-dashboard">
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
            <h2>Hey, Manager</h2>
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
        <article className="card sequence-kpi">
          <small>Active Employees</small>
          <h3>{kpis.totalEmployees || 0}</h3>
        </article>
        <article className="card sequence-kpi">
          <small>Number of Projects</small>
          <h3>{kpis.activeProjects || 0}</h3>
        </article>
        <article className="card sequence-kpi">
          <small>Number of Tasks</small>
          <h3>{totalTasks || 0}</h3>
        </article>
        <article className="card sequence-kpi">
          <small>Target Completed</small>
          <h3>{completionRate}%</h3>
        </article>
      </section>

      <section className="sequence-main-grid">
        <article className="card sequence-list-card employee-scroll-panel">
          <div className="card-head">
            <h3>On Going Team Pulse</h3>
          </div>
          <div className="employee-list-down">
            {employeeTrend.length ? (
              employeeTrend.map((employee) => (
                <article className="employee-list-item" key={employee.user?._id || employee._id}>
                  <div className="list-identity">
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
                      <strong>
                        {employee.firstName} {employee.lastName}
                      </strong>
                      <p className="muted">
                        {employee.designation || "-"} | {employee.department || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="muted">
                    <span>{employee.employeeId || "-"}</span>
                    <span>{formatDate(employee.joinDate)}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted">No employees found.</p>
            )}
          </div>
        </article>

        <BarMetricsChart
          title="Graphs and Analysis"
          data={state.data?.performanceInsights || []}
          xKey="name"
          bars={[{ dataKey: "completionRate", color: "#2EC5BD" }]}
        />
      </section>

      <section className="sequence-main-grid">
        <LineTrendChart
          title="Attendance Rate Trend"
          data={state.data?.attendanceRateChart || []}
          xKey="date"
          lines={[{ dataKey: "rate", color: "#16C79A" }]}
        />

        <article className="card sequence-performer-card">
          <div className="card-head">
            <h3>Top Performance</h3>
          </div>
          <div className="sequence-performer-grid">
            {topPerformers.length ? (
              topPerformers.map((item, index) => (
                <article key={`${item.name}-${index}`} className="sequence-performer-item">
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
        <div>
          <small className="muted">Monthly Payroll</small>
          <h3>{formatCurrency(kpis.totalMonthlyPayroll || 0)}</h3>
        </div>
        <div>
          <small className="muted">Pending Leaves</small>
          <h3>{kpis.pendingLeaves || 0}</h3>
        </div>
      </section>
    </section>
  );
};

export default AdminDashboardPage;
