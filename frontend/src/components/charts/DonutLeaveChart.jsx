const paletteDefault = [
  "#0f5a73",
  "#22c55e",
  "#f4c21a",
  "#ef4444",
  "#4b84f2",
  "#f28a47",
  "#6f96a6",
  "#99b7c3"
];

const toNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toPoint = (cx, cy, r, deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
};

const arcPath = (cx, cy, r, startDeg, endDeg) => {
  const start = toPoint(cx, cy, r, startDeg);
  const end = toPoint(cx, cy, r, endDeg);
  const largeArcFlag = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweepFlag = endDeg > startDeg ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
};

const buildSegments = (rows, isGauge) => {
  const data = Array.isArray(rows)
    ? rows
        .map((item) => ({ ...item, value: Math.max(0, toNumber(item.value)) }))
        .filter((item) => item.value > 0)
    : [];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!data.length || !total) return { data, total, segments: [] };

  const startBase = isGauge ? -180 : -90;
  const endBase = isGauge ? 0 : 270;
  const sweep = endBase - startBase;
  const gap = isGauge ? 5.8 : 4;
  const totalGap = gap * Math.max(0, data.length - 1);
  const activeSweep = Math.max(8, sweep - totalGap);

  let cursor = startBase;
  const segments = data.map((item) => {
    const ratio = item.value / total;
    const segSweep = Math.max(6, ratio * activeSweep);
    const start = cursor;
    const end = Math.min(endBase, start + segSweep);
    cursor = end + gap;
    return { ...item, start, end };
  });

  return { data, total, segments };
};

const formatPercent = (value, total) => {
  if (!total) return "0%";
  return `${Math.round((toNumber(value) / total) * 100)}%`;
};

const DonutLeaveChart = ({
  data,
  title,
  height = 280,
  innerRadius = 60,
  outerRadius = 92,
  totalLabel = "Total",
  variant = "ring", // ring | gauge | segmented-gauge | segmented-ring
  showLegend = true,
  showTotal = true,
  customLabel,
  customTotal,
  embedded = false,
  colors = paletteDefault
}) => {
  const isGauge = variant === "gauge" || variant === "segmented-gauge" || variant === "callout";
  const { data: safeData, total, segments } = buildSegments(data, isGauge);
  const centerValue = typeof customTotal !== "undefined" ? customTotal : total;
  const centerLabel = customLabel || totalLabel;
  const stroke = Math.max(6, outerRadius - innerRadius);

  const svgWidth = 260;
  const svgHeight = isGauge ? 170 : 260;
  const cx = 130;
  const cy = isGauge ? 138 : 130;
  const radius = isGauge ? 94 : 96;

  return (
    <section className={`${embedded ? "dash-segmented-chart embedded" : "card dash-chart-card dash-segmented-chart"}`}>
      {title ? (
        <div className="card-head dash-chart-head">
          <h3>{title}</h3>
        </div>
      ) : null}

      <div className={`dash-segmented-stage ${isGauge ? "gauge" : "ring"}`} style={{ minHeight: height }}>
        <svg
          className="dash-segmented-svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label={title || centerLabel}
        >
          {isGauge ? (
            <path
              d={arcPath(cx, cy, radius, -180, 0)}
              stroke="#e6ebf1"
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e6ebf1" strokeWidth={stroke} />
          )}

          {segments.map((segment, index) => (
            <path
              key={`${segment.name}-${index}`}
              d={arcPath(cx, cy, radius, segment.start, segment.end)}
              stroke={segment.fill || colors[index % colors.length]}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </svg>

        <div className={`dash-segmented-center ${isGauge ? "gauge" : "ring"}`}>
          <small>{centerLabel}</small>
          <strong>{centerValue}</strong>
        </div>
      </div>

      {(showLegend || showTotal) && safeData.length ? (
        <div className="dash-segmented-meta">
          {showTotal ? <h4>{totalLabel}</h4> : null}
          {showLegend ? (
            <div className="dash-segmented-legend">
              {safeData.map((item, index) => (
                <div className="dash-segmented-legend-row" key={`${item.name}-${index}`}>
                  <span className="left">
                    <i style={{ backgroundColor: item.fill || colors[index % colors.length] }} />
                    {item.name}
                  </span>
                  <strong>{formatPercent(item.value, total)}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default DonutLeaveChart;
