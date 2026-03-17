import { Fragment, useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const LineTrendChart = ({ data, xKey, lines, title, height = 260, variant = "default", showLegend = true }) => {
  const chartId = useId().replace(/:/g, "");
  const isWave = variant === "wave";

  return (
    <section className="card dash-chart-card">
      <div className="card-head dash-chart-head">
        <h3>{title}</h3>
      </div>
      <div className={`chart-box chart-box-soft ${isWave ? "chart-box-wave" : ""}`}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={isWave ? { top: 8, right: 2, left: 2, bottom: 6 } : { top: 12, right: 12, left: -14, bottom: 2 }}>
            <defs>
              {lines.map((line, index) => (
                <linearGradient
                  key={`grad-${line.dataKey}`}
                  id={`${chartId}-line-grad-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={line.color} stopOpacity={isWave ? 0.16 : 0.22} />
                  <stop offset="100%" stopColor={line.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            {!isWave ? <CartesianGrid stroke="#e7ecf2" strokeDasharray="2 4" vertical={false} /> : null}
            <XAxis
              dataKey={xKey}
              tickMargin={10}
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              hide={isWave}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              hide={isWave}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #dbe3ee",
                boxShadow: "0 10px 24px rgba(15,23,42,0.12)",
                backgroundColor: "#ffffff"
              }}
              itemStyle={{ color: "#0f172a", fontSize: "0.8rem", fontWeight: 600 }}
              labelStyle={{ color: "#64748b", fontSize: "0.72rem", marginBottom: 6 }}
              cursor={isWave ? false : { stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            {showLegend && !isWave ? (
              <Legend
                wrapperStyle={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, paddingTop: 10 }}
                iconType="circle"
                iconSize={8}
              />
            ) : null}

            {lines.map((line, index) => (
              <Fragment key={line.dataKey}>
                {line.showArea || isWave ? (
                  <Area
                    type="monotone"
                    dataKey={line.dataKey}
                    stroke="none"
                    fill={`url(#${chartId}-line-grad-${index})`}
                  />
                ) : null}
                <Line
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name || line.dataKey}
                  stroke={line.color}
                  strokeWidth={index === 0 ? 2.4 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={line.strokeDasharray}
                  dot={isWave ? false : { r: 3.8, fill: line.color, stroke: "#ffffff", strokeWidth: 1.6 }}
                  activeDot={
                    isWave ? false : { r: 5, fill: line.color, stroke: "#ffffff", strokeWidth: 2.2 }
                  }
                />
              </Fragment>
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default LineTrendChart;
