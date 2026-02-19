const KpiCard = ({ title, value, subtitle, icon: Icon }) => (
  <article className="card kpi-card">
    <div className="kpi-head">
      <span>{title}</span>
      {Icon ? <Icon size={18} /> : null}
    </div>
    <h2>{value}</h2>
    {subtitle ? <p>{subtitle}</p> : null}
  </article>
);

export default KpiCard;
