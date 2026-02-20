import StatusBadge from "./StatusBadge";

const DataTable = ({ columns, rows, emptyText = "No records found" }) => {
  if (!rows?.length) {
    return (
      <div className="card">
        <p className="muted">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="table-wrap card">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row._id || row.id || index}>
              {columns.map((column) => {
                const value = row[column.key];
                if (column.type === "status") {
                  return (
                    <td key={column.key}>
                      <StatusBadge status={value} />
                    </td>
                  );
                }
                return <td key={column.key}>{column.render ? column.render(value, row) : value ?? "-"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
