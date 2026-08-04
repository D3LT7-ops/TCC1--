import { CheckCircle2, TriangleAlert } from 'lucide-react';

export default function AlertsPanel({ alerts }) {
  return (
    <section className="card alerts-card">
      <h2>Alertas e situação das metas</h2>
      <div className="alerts-list">
        {alerts.length === 0 && <p>Nenhuma meta foi identificada na planilha.</p>}
        {alerts.map((alert, index) => (
          <div className={`alert ${alert.type}`} key={`${alert.message}-${index}`}>
            {alert.type === 'success' ? <CheckCircle2 size={19} /> : <TriangleAlert size={19} />}
            <span>{alert.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
