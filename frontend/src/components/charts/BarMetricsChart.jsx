import {
  Bar,
  BarChart,
  Cell,
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
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name || bar.dataKey}
              fill={bar.color}
              radius={[8, 8, 2, 2]}
              maxBarSize={30}
            >
              {bars.length === 1
                ? data.map((_, cellIndex) => (
                    <Cell
                      key={`${bar.dataKey}-${cellIndex}`}
                      fill={["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"][cellIndex % 6]}
                    />
                  ))
                : null}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  </section>
);

export default BarMetricsChart;
