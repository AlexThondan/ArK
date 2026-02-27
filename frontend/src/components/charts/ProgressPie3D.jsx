const clamp = (value) => {
  const parsed = Number(value || 0);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
};

const gradientStops = [
  { value: 0, color: [239, 68, 68] }, // red
  { value: 35, color: [234, 179, 8] }, // yellow
  { value: 65, color: [37, 99, 235] }, // blue
  { value: 100, color: [16, 185, 129] } // green
];

const toRgb = (color) => `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

const interpolateColor = (start, end, ratio) =>
  start.map((channel, index) => Math.round(channel + (end[index] - channel) * ratio));

const resolveProgressColor = (value) => {
  const safeValue = clamp(value);
  for (let index = 0; index < gradientStops.length - 1; index += 1) {
    const start = gradientStops[index];
    const end = gradientStops[index + 1];
    if (safeValue >= start.value && safeValue <= end.value) {
      const range = end.value - start.value || 1;
      const ratio = (safeValue - start.value) / range;
      return toRgb(interpolateColor(start.color, end.color, ratio));
    }
  }
  return toRgb(gradientStops[gradientStops.length - 1].color);
};

const ProgressPie3D = ({ value = 0, size = 44, label = true }) => {
  const safeValue = clamp(value);
  const color = resolveProgressColor(safeValue);

  return (
    <div
      className="progress-pie3d"
      style={{ "--value": safeValue, "--size": `${size}px`, "--progress-color": color }}
      aria-label={`${safeValue}%`}
    >
      {label ? <span>{safeValue}%</span> : null}
    </div>
  );
};

export default ProgressPie3D;
