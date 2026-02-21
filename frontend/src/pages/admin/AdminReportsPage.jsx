import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Download, FileText } from "lucide-react";
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

  const exportCsv = () => {
    const rows = state.performance.map((item) => ({
      name: item.name,
      department: item.department,
      taskCompletionRate: item.taskCompletionRate,
      attendanceRate: item.attendanceRate,
      leaveUtilizationRate: item.leaveUtilizationRate,
      performanceScore: item.performanceScore,
      burnoutRisk: item.burnoutRisk
    }));

    if (!rows.length) {
      toast.error("No report rows to export");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reports-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success("CSV report exported");
  };

  const exportPdf = () => {
    const win = window.open("", "_blank");
    if (!win) return;

    const rows = state.performance
      .map(
        (row) =>
          `<tr>
            <td>${row.name || "-"}</td>
            <td>${row.department || "-"}</td>
            <td>${row.performanceScore || 0}</td>
            <td>${row.burnoutRisk || "-"}</td>
          </tr>`
      )
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>ArK Reports</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { color: #1da59f; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #eefaf8; }
          </style>
        </head>
        <body>
          <h1>ArK - Performance Report</h1>
          <table>
            <thead>
              <tr><th>Name</th><th>Department</th><th>Score</th><th>Risk</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    toast.success("PDF print view opened");
  };

  const leaveChartData = state.leaveTrends.map((row) => ({
    period: `${row.year}-${String(row.month).padStart(2, "0")}`,
    count: row.count
  }));

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Reports & Analytics</h1>
        <div className="button-row">
          <button className="btn btn-outline" type="button" onClick={exportCsv}>
            <Download size={14} />
            Export CSV
          </button>
          <button className="btn btn-primary" type="button" onClick={exportPdf}>
            <FileText size={14} />
            Export PDF
          </button>
        </div>
      </header>

      <div className="panel-grid two">
        <BarMetricsChart
          title="Department Productivity"
          data={state.productivity}
          xKey="department"
          bars={[
            { dataKey: "completionRate", color: "#2EC5BD" },
            { dataKey: "inProgressTasks", color: "#16C79A" }
          ]}
        />
        <LineTrendChart
          title="Leave Trends"
          data={leaveChartData}
          xKey="period"
          lines={[{ dataKey: "count", color: "#16C79A" }]}
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
