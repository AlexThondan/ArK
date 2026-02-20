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
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={`url(#barGradient-${bar.dataKey}-${index})`}
              radius={[8, 8, 0, 0]}
              maxBarSize={34}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  </section>
);

export default BarMetricsChart;
