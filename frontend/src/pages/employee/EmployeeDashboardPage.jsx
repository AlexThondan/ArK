import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, Hourglass, WalletCards } from "lucide-react";
import { dashboardApi } from "../../api/hrmsApi";
import KpiCard from "../../components/common/KpiCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import LineTrendChart from "../../components/charts/LineTrendChart";
import DonutLeaveChart from "../../components/charts/DonutLeaveChart";
import DataTable from "../../components/common/DataTable";
import { formatCurrency, formatDate, formatDateTime, formatDuration } from "../../utils/format";

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

  const leaveSummary = state.data?.leaveSummary || {};

  return (
    <section className="page-grid">
      <header className="page-head">
        <div>
          <h1>{state.data?.welcome || "Employee Dashboard"}</h1>
          {state.data?.employeeId ? <p className="muted">Employee ID: {state.data.employeeId}</p> : null}
        </div>
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

      <div className="kpi-grid">
        <KpiCard
          title="Approved Leaves"
          value={leaveSummary.approved?.count || 0}
          subtitle={`${leaveSummary.approved?.days || 0} day(s) used`}
          icon={CalendarClock}
        />
        <KpiCard
          title="Pending Leave Requests"
          value={leaveSummary.pending?.count || 0}
          subtitle="Requests awaiting response"
          icon={Hourglass}
        />
        <KpiCard
          title="Monthly Net Pay"
          value={formatCurrency(state.data?.payroll?.netPay || 0)}
          subtitle={`Payout day: ${state.data?.payroll?.payoutDay || 25}`}
          icon={WalletCards}
        />
      </div>

      <div className="panel-grid two">
        <LineTrendChart
          title="Attendance Summary"
          data={attendanceTrend}
          xKey="date"
          lines={[{ dataKey: "duration", color: "#1877F2" }]}
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

      <section className="card gradient-card">
        <div className="card-head">
          <h3>Payroll Snapshot</h3>
        </div>
        <div className="payroll-grid">
          <div>
            <small className="muted">Monthly Gross</small>
            <h2>{formatCurrency(state.data?.payroll?.monthlyGross || 0)}</h2>
          </div>
          <div>
            <small className="muted">Estimated Deductions</small>
            <h2>{formatCurrency(state.data?.payroll?.deductions || 0)}</h2>
          </div>
          <div>
            <small className="muted">Take Home</small>
            <h2>{formatCurrency(state.data?.payroll?.netPay || 0)}</h2>
          </div>
        </div>
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
