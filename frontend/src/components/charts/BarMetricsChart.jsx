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

const BarMetricsChart = ({ data, xKey, bars, title }) => (
  <section className="card">
    <div className="card-head">
      <h3>{title}</h3>
    </div>
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <defs>
            {bars.map((bar, index) => (
              <linearGradient key={bar.dataKey} id={`barGradient-${bar.dataKey}-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={bar.color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={bar.color} stopOpacity={0.45} />
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
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={`url(#barGradient-${bar.dataKey}-${index})`}
              radius={[10, 10, 4, 4]}
              maxBarSize={30}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  </section>
);

export default BarMetricsChart;
