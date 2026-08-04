import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function IndicatorChart({ metrics }) {
  const data = metrics
    .filter((metric) => metric.value !== null)
    .map((metric) => ({
      name: metric.name,
      Atual: metric.value,
      Meta: metric.target,
    }));

  return (
    <section className="card chart-card">
      <h2>Comparação entre valor atual e meta</h2>
      <p>Visualização rápida do desempenho da Empresa Júnior.</p>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 35 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-18} textAnchor="end" interval={0} height={70} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Atual" fill="#2563eb" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Meta" fill="#94a3b8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
