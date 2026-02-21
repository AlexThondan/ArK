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
          <CartesianGrid stroke="#cde8e4" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey={xKey}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 14,
              border: "1px solid rgba(46,197,189,0.28)",
              boxShadow: "0 14px 30px rgba(15,23,42,0.16)"
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
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
