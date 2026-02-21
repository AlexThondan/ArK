import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const palette = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"];
const RADIAN = Math.PI / 180;

const renderCalloutLabel = ({ cx, cy, midAngle, outerRadius, fill, value }) => {
  const direction = Math.cos(-midAngle * RADIAN) >= 0 ? 1 : -1;
  const startX = cx + (outerRadius + 2) * Math.cos(-midAngle * RADIAN);
  const startY = cy + (outerRadius + 2) * Math.sin(-midAngle * RADIAN);
  const midX = cx + (outerRadius + 22) * Math.cos(-midAngle * RADIAN);
  const midY = cy + (outerRadius + 22) * Math.sin(-midAngle * RADIAN);
  const endX = midX + direction * 28;
  const endY = midY;
  const boxWidth = 28;
  const boxHeight = 18;
  const boxX = direction > 0 ? endX : endX - boxWidth;
  const boxY = endY - boxHeight / 2;

  return (
    <g>
      <path d={`M${startX},${startY}L${midX},${midY}L${endX},${endY}`} stroke={fill} strokeWidth={2} fill="none" />
      <rect x={boxX} y={boxY} width={boxWidth} height={boxHeight} rx={4} fill={fill} />
      <text
        x={boxX + boxWidth / 2}
        y={boxY + 12}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={11}
        fontWeight={700}
      >
        {value}
      </text>
    </g>
  );
};

const DonutLeaveChart = ({
  data,
  title,
  height = 240,
  innerRadius = 58,
  outerRadius = 90,
  totalLabel = "Total",
  variant = "standard",
  showLegend = true,
  showTotal = true
}) => {
  const chartData = Array.isArray(data) ? data.filter((row) => Number(row.value || 0) > 0) : [];
  const total = chartData.reduce((sum, row) => sum + Number(row.value || 0), 0);
  const focusIndex = chartData.length
    ? chartData.reduce((maxIndex, row, index) => (Number(row.value || 0) > Number(chartData[maxIndex].value || 0) ? index : maxIndex), 0)
    : 0;
  const isCallout = variant === "callout";

  return (
    <section className="card">
      <div className="card-head">
        <h3>{title}</h3>
      </div>
      <div className={`chart-box ${isCallout ? "callout" : ""}`}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart margin={isCallout ? { top: 24, right: 42, left: 42, bottom: 24 } : undefined}>
            {chartData.length ? (
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={innerRadius}
                outerRadius={(entry, index) => (isCallout && index === focusIndex ? outerRadius + 10 : outerRadius)}
                paddingAngle={3}
                label={isCallout ? renderCalloutLabel : undefined}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={palette[index % palette.length]}
                    stroke="#ffffff"
                    strokeWidth={isCallout ? (index === focusIndex ? 5 : 4) : 2}
                  />
                ))}
              </Pie>
            ) : null}
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #dbe7f5",
                boxShadow: "0 12px 28px rgba(15,23,42,0.14)"
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {(showTotal || showLegend) && (
        <div className="donut-foot">
          {showTotal ? (
            <strong>
              {totalLabel}: {total}
            </strong>
          ) : null}
          {showLegend ? (
            <div className="donut-legends">
              {chartData.map((item, index) => (
                <span key={item.name}>
                  <i style={{ backgroundColor: palette[index % palette.length] }} />
                  {item.name}: {item.value}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default DonutLeaveChart;
