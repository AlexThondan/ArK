import { useCallback, useEffect, useState } from "react";
import { reportApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import BarMetricsChart from "../../components/charts/BarMetricsChart";
import LineTrendChart from "../../components/charts/LineTrendChart";
import DataTable from "../../components/common/DataTable";

const AdminReportsPage = () => {
  const [state, setState] = useState({
    loading: true,
    error: "",
    productivity: [],
    leaveTrends: [],
    performance: []
  });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const [prodRes, leaveRes, perfRes] = await Promise.all([
        reportApi.departmentProductivity(),
        reportApi.leaveTrends(),
        reportApi.performance()
      ]);

      setState({
        loading: false,
        error: "",
        productivity: prodRes.data || [],
        leaveTrends: leaveRes.data || [],
        performance: perfRes.data || []
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message,
        productivity: [],
        leaveTrends: [],
        performance: []
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (state.loading) return <LoadingSpinner label="Generating reports..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  const leaveChartData = state.leaveTrends.map((row) => ({
    period: `${row.year}-${String(row.month).padStart(2, "0")}`,
    count: row.count
  }));

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Reports & Analytics</h1>
      </header>

      <div className="panel-grid two">
        <BarMetricsChart
          title="Department Productivity"
          data={state.productivity}
          xKey="department"
          bars={[
            { dataKey: "completionRate", color: "#2563EB" },
            { dataKey: "inProgressTasks", color: "#10B981" }
          ]}
        />
        <LineTrendChart
          title="Leave Trends"
          data={leaveChartData}
          xKey="period"
          lines={[{ dataKey: "count", color: "#EF4444" }]}
        />
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Employee Performance Metrics</h3>
        </div>
        <DataTable
          rows={state.performance}
          columns={[
            { key: "name", label: "Employee" },
            { key: "department", label: "Department" },
            { key: "taskCompletionRate", label: "Task Completion", render: (value) => `${value}%` },
            { key: "attendanceRate", label: "Attendance", render: (value) => `${value}%` },
            { key: "leaveUtilizationRate", label: "Leave Utilization", render: (value) => `${value}%` },
            { key: "performanceScore", label: "Performance Score" },
            { key: "burnoutRisk", label: "Burnout Risk", type: "status" }
          ]}
        />
      </section>
    </section>
  );
};

export default AdminReportsPage;
