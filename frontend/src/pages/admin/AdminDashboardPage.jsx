import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, CalendarCheck2, Landmark, Siren, Users, Workflow } from "lucide-react";
import { dashboardApi } from "../../api/hrmsApi";
import KpiCard from "../../components/common/KpiCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import LineTrendChart from "../../components/charts/LineTrendChart";
import BarMetricsChart from "../../components/charts/BarMetricsChart";
import DataTable from "../../components/common/DataTable";
import { formatCurrency } from "../../utils/format";

const AdminDashboardPage = () => {
  const [state, setState] = useState({ loading: true, error: "", data: null });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await dashboardApi.admin();
      setState({ loading: false, error: "", data: response.data });
    } catch (error) {
      setState({ loading: false, error: error.message, data: null });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (state.loading) return <LoadingSpinner label="Loading admin dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  const kpis = state.data?.kpis || {};

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>HR / Admin Dashboard</h1>
      </header>

      <div className="kpi-grid">
        <KpiCard title="Total Employees" value={kpis.totalEmployees || 0} icon={Users} />
        <KpiCard title="Active Projects" value={kpis.activeProjects || 0} icon={BriefcaseBusiness} />
        <KpiCard title="Pending Leaves" value={kpis.pendingLeaves || 0} icon={CalendarCheck2} />
        <KpiCard
          title="Performance Rows"
          value={state.data?.performanceInsights?.length || 0}
          icon={Workflow}
        />
        <KpiCard title="Monthly Payroll" value={formatCurrency(kpis.totalMonthlyPayroll || 0)} icon={Landmark} />
      </div>
      <div className="kpi-grid">
        <KpiCard
          title="Burnout High Risk"
          value={(state.data?.overtimeSummary || []).filter((item) => item.burnoutRisk === "high").length}
          subtitle="Based on attendance variance"
          icon={Siren}
        />
      </div>

      <div className="panel-grid two">
        <LineTrendChart
          title="Attendance Rate"
          data={state.data?.attendanceRateChart || []}
          xKey="date"
          lines={[{ dataKey: "rate", color: "#1877F2" }]}
        />
        <BarMetricsChart
          title="Performance Completion"
          data={state.data?.performanceInsights || []}
          xKey="name"
          bars={[{ dataKey: "completionRate", color: "#2D88FF" }]}
        />
      </div>

      <div className="panel-grid two">
        <BarMetricsChart
          title="Payroll by Department"
          data={state.data?.payrollByDepartment || []}
          xKey="department"
          bars={[
            { dataKey: "totalSalary", color: "#1877F2" },
            { dataKey: "avgSalary", color: "#10B981" }
          ]}
        />
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Top Performer Insights</h3>
        </div>
        <DataTable
          rows={state.data?.performanceInsights || []}
          columns={[
            { key: "name", label: "Employee" },
            { key: "department", label: "Department" },
            { key: "totalTasks", label: "Total Tasks" },
            { key: "completedTasks", label: "Completed" },
            { key: "completionRate", label: "Completion", render: (value) => `${value}%` }
          ]}
        />
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

      <section className="card">
        <div className="card-head">
          <h3>Payroll Sheet</h3>
        </div>
        <DataTable
          rows={state.data?.payrollByDepartment || []}
          columns={[
            { key: "department", label: "Department" },
            { key: "headcount", label: "Employees" },
            { key: "avgSalary", label: "Avg Salary", render: (value) => formatCurrency(value) },
            { key: "totalSalary", label: "Total Payroll", render: (value) => formatCurrency(value) }
          ]}
        />
      </section>
    </section>
  );
};

export default AdminDashboardPage;
