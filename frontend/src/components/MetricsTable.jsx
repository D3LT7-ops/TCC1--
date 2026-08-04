function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
}

export default function MetricsTable({ metrics }) {
  return (
    <section className="card table-card">
      <div className="section-heading-row">
        <div>
          <h2>Detalhamento dos indicadores</h2>
          <p>Valores atuais, metas e percentual alcançado.</p>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Atual</th>
              <th>Meta</th>
              <th>Progresso</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric.name}>
                <td><strong>{metric.name}</strong></td>
                <td>{formatNumber(metric.value)}</td>
                <td>{formatNumber(metric.target)}</td>
                <td>
                  {metric.percentage === null ? 'Sem meta' : (
                    <div className="progress-cell">
                      <div className="progress-track">
                        <div
                          className={`progress-fill ${metric.status}`}
                          style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                        />
                      </div>
                      <span>{metric.percentage}%</span>
                    </div>
                  )}
                </td>
                <td><span className={`status-badge ${metric.status}`}>{metric.status.replace('_', ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
