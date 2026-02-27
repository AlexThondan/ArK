import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const fallbackPalette = ["#f97316", "#0f5a73", "#64748b", "#22c55e"];

const toNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const BarMetricsChart = ({ data, xKey, bars, title, height = 260, variant = "pill-dual" }) => {
  const chartBars = Array.isArray(bars) ? bars : [];

  const normalizedData = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length || chartBars.length !== 1 || variant !== "pill-dual") return rows;

    const key = chartBars[0].dataKey;
    return rows.map((row) => {
      const value = Math.max(0, toNumber(row[key]));
      return {
        ...row,
        __mirror: -Math.max(2, Math.round(value * 0.68))
      };
    });
  }, [data, chartBars, variant]);

  const yDomain = useMemo(() => {
    if (chartBars.length !== 1 || variant !== "pill-dual") return ["auto", "auto"];
    const key = chartBars[0].dataKey;
    const maxValue = Math.max(...normalizedData.map((row) => Math.max(0, toNumber(row[key]))), 10);
    return [-(maxValue * 0.8), Math.ceil(maxValue * 1.25)];
  }, [chartBars, normalizedData, variant]);

  return (
    <section className="card dash-chart-card">
      <div className="card-head dash-chart-head">
        <h3>{title}</h3>
      </div>
      <div className="chart-box chart-box-soft">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={normalizedData} margin={{ top: 12, right: 12, left: -18, bottom: 2 }} barCategoryGap={22}>
            <CartesianGrid stroke="#e7ecf2" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey={xKey}
              tickMargin={10}
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              domain={yDomain}
            />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.08)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #dbe3ee",
                boxShadow: "0 10px 24px rgba(15,23,42,0.12)",
                backgroundColor: "#ffffff"
              }}
              itemStyle={{ color: "#0f172a", fontSize: "0.8rem", fontWeight: 600 }}
              labelStyle={{ color: "#64748b", fontSize: "0.72rem", marginBottom: 6 }}
            />
            <Legend
              wrapperStyle={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, paddingTop: 10 }}
              iconType="circle"
              iconSize={8}
            />

            {chartBars.length === 1 && variant === "pill-dual" ? (
              <>
                <Bar dataKey="__mirror" name="Baseline" fill="#d6dbe2" radius={[8, 8, 8, 8]} maxBarSize={24} />
                <Bar
                  dataKey={chartBars[0].dataKey}
                  name={chartBars[0].name || chartBars[0].dataKey}
                  fill={chartBars[0].color || "#f97316"}
                  radius={[8, 8, 8, 8]}
                  maxBarSize={24}
                />
              </>
            ) : (
              chartBars.map((bar, index) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  name={bar.name || bar.dataKey}
                  fill={bar.color || fallbackPalette[index % fallbackPalette.length]}
                  radius={[8, 8, 8, 8]}
                  maxBarSize={20}
                />
              ))
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default BarMetricsChart;
