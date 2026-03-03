// FILE: /frontend/src/components/Table.jsx
import '../styles/Table.css';

// Generic table — columns = [{ key, label, render? }]
// render(row) allows custom cell rendering (badges, actions, etc.)
export default function Table({ columns, rows, emptyMessage = 'No data found.' }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="table-empty">
        <div className="table-empty-icon">👤</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map(c => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}