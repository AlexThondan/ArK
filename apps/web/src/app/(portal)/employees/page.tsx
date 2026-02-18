const columns = ['Employee', 'Department', 'Role', 'Status', 'Manager'];
const rows = [
  ['Alex Morgan', 'Engineering', 'Employee', 'Active', 'Liam Scott'],
  ['Mia Chen', 'Finance', 'HR', 'Active', 'Noah Patel'],
  ['Ethan Reed', 'Engineering', 'Manager', 'Active', 'Olivia James']
];

export default function EmployeesPage() {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-glass backdrop-blur dark:bg-slate-900/60">
      <h2 className="mb-4 text-lg font-semibold">Employee Directory</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} className="border-b border-slate-200 pb-2 dark:border-slate-700">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {row.map((cell, i) => (
                  <td key={i} className="border-b border-slate-100 py-3 dark:border-slate-800">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

