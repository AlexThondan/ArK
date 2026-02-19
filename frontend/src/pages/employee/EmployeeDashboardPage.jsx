import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Hourglass, WalletCards } from "lucide-react";
import { dashboardApi } from "../../api/hrmsApi";
import KpiCard from "../../components/common/KpiCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import LineTrendChart from "../../components/charts/LineTrendChart";
import DonutLeaveChart from "../../components/charts/DonutLeaveChart";
import DataTable from "../../components/common/DataTable";
import { formatDate, formatDateTime, formatDuration } from "../../utils/format";

const EmployeeDashboardPage = () => {
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

  const leaveChartData = useMemo(() => {
    const leave = state.data?.leaveBalance;
    if (!leave) return [];
    return [
      { name: "Annual", value: leave.annual || 0 },
      { name: "Sick", value: leave.sick || 0 },
      { name: "Casual", value: leave.casual || 0 }
    ];
  }, [state.data]);

  if (state.loading) return <LoadingSpinner label="Loading employee dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  const attendanceTrend = (state.data?.attendanceHistory || []).map((row) => ({
    date: formatDate(row.date),
    duration: Number((row.workDurationMinutes / 60).toFixed(2))
  }));

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>{state.data?.welcome || "Employee Dashboard"}</h1>
      </header>

      <div className="kpi-grid">
        <KpiCard title="Pending Tasks" value={state.data?.taskSummary?.pending || 0} icon={Hourglass} />
        <KpiCard title="Completed Tasks" value={state.data?.taskSummary?.completed || 0} icon={CheckCircle2} />
        <KpiCard
          title="Attendance Entries"
          value={state.data?.attendanceHistory?.length || 0}
          icon={Clock3}
          subtitle="Last 7 days"
        />
        <KpiCard title="Annual Leave Left" value={state.data?.leaveBalance?.annual || 0} icon={WalletCards} />
      </div>

      <div className="panel-grid two">
        <LineTrendChart
          title="Attendance Summary"
          data={attendanceTrend}
          xKey="date"
          lines={[{ dataKey: "duration", color: "#2563EB" }]}
        />
        <DonutLeaveChart title="Leave Balance" data={leaveChartData} />
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Recent Tasks</h3>
        </div>
        <DataTable
          rows={state.data?.recentTasks || []}
          columns={[
            { key: "title", label: "Task" },
            { key: "status", label: "Status", type: "status" },
            { key: "priority", label: "Priority" },
            { key: "dueDate", label: "Due Date", render: (value) => formatDate(value) },
            { key: "progress", label: "Progress", render: (value) => `${value || 0}%` }
          ]}
        />
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
