import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const palette = ["#2EC5BD", "#16C79A", "#74E3C8", "#43D4C6", "#F59E0B"];

const DonutLeaveChart = ({ data, title }) => {
  const total = data.reduce((sum, row) => sum + Number(row.value || 0), 0);

  return (
    <section className="card">
      <div className="card-head">
        <h3>{title}</h3>
      </div>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>
              {data.map((_, index) => (
                <Cell key={index} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 14,
                border: "1px solid rgba(46,197,189,0.28)",
                boxShadow: "0 14px 30px rgba(15,23,42,0.16)"
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="donut-foot">
        <strong>Total: {total}</strong>
        <div className="donut-legends">
          {data.map((item, index) => (
            <span key={item.name}>
              <i style={{ backgroundColor: palette[index % palette.length] }} />
              {item.name}: {item.value}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DonutLeaveChart;
