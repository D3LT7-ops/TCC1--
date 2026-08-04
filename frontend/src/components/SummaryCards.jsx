import { CheckCircle2, CircleGauge, ListChecks, TriangleAlert } from 'lucide-react';

const cards = [
  { key: 'total_indicators', label: 'Indicadores', Icon: ListChecks },
  { key: 'achieved', label: 'Metas atingidas', Icon: CheckCircle2 },
  { key: 'pending', label: 'Metas pendentes', Icon: TriangleAlert },
  { key: 'overall_percentage', label: 'Desempenho geral', Icon: CircleGauge, suffix: '%' },
];

export default function SummaryCards({ summary }) {
  return (
    <div className="summary-grid">
      {cards.map(({ key, label, Icon, suffix = '' }) => (
        <article className="summary-card" key={key}>
          <div className="summary-icon"><Icon size={21} /></div>
          <div>
            <span>{label}</span>
            <strong>{summary[key]}{suffix}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}
