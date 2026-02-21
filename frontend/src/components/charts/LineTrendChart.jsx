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
          <CartesianGrid stroke="#e5edf6" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey={xKey}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #dbe7f5",
              boxShadow: "0 12px 28px rgba(15,23,42,0.14)"
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          {lines.map((line, index) => (
            <Fragment key={line.dataKey}>
              {line.showArea ? (
                <Area type="monotone" dataKey={line.dataKey} stroke="none" fill={line.color} fillOpacity={0.12} />
              ) : null}
              <Line
                type="monotone"
                dataKey={line.dataKey}
                name={line.name || line.dataKey}
                stroke={line.color}
                strokeWidth={index === 0 ? 2.8 : 2.2}
                strokeDasharray={line.strokeDasharray}
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
