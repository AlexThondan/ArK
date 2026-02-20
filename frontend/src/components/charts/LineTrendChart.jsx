import { Fragment } from "react";
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

const LineTrendChart = ({ data, xKey, lines, title }) => (
  <section className="card">
    <div className="card-head">
      <h3>{title}</h3>
    </div>
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            {lines.map((line, index) => (
              <linearGradient key={line.dataKey} id={`lineGradient-${line.dataKey}-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="2 4" opacity={0.4} />
          <XAxis dataKey={xKey} tickMargin={8} />
          <YAxis />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(24,119,242,0.2)",
              boxShadow: "0 10px 24px rgba(15,23,42,0.12)"
            }}
          />
          <Legend />
          {lines.map((line, index) => (
            <Fragment key={line.dataKey}>
              <Area
                type="monotone"
                dataKey={line.dataKey}
                stroke="none"
                fill={`url(#lineGradient-${line.dataKey}-${index})`}
              />
              <Line
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </Fragment>
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </section>
);

export default LineTrendChart;
