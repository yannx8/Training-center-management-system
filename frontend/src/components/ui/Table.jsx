export default function Table({ columns = [], data = [], emptyMsg = 'No data.' }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0
              ? <tr><td colSpan={columns.length} className="text-center text-gray-400 py-10">{emptyMsg}</td></tr>
              : data.map((row, i) => (
                <tr key={row.id || i}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
