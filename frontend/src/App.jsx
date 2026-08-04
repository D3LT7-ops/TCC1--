import { useEffect, useState } from 'react';
import { BarChart3, Database, FileDown, Trash2 } from 'lucide-react';
import AlertsPanel from './components/AlertsPanel';
import IndicatorChart from './components/IndicatorChart';
import MetricsTable from './components/MetricsTable';
import SummaryCards from './components/SummaryCards';
import UploadCard from './components/UploadCard';
import {
  deleteDataset,
  getCompanies,
  getDashboard,
  getDatasets,
  uploadSpreadsheet,
} from './services/api';

export default function App() {
  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState('');
  const [companies, setCompanies] = useState([]);
  const [company, setCompany] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  async function loadDatasets() {
    try {
      const data = await getDatasets();
      setDatasets(data);
    } catch (error) {
      showMessage('error', error.message);
    }
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 5000);
  }

  async function handleUpload(file) {
    setLoading(true);
    try {
      const result = await uploadSpreadsheet(file);
      await loadDatasets();
      setDatasetId(String(result.dataset_id));
      setCompanies(result.companies);
      setCompany(result.companies[0] || '');
      setDashboard(null);
      showMessage('success', `${result.rows_imported} linha(s) importada(s) com sucesso.`);
      if (result.companies[0]) {
        await loadDashboard(result.dataset_id, result.companies[0]);
      }
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDatasetChange(value) {
    setDatasetId(value);
    setCompany('');
    setDashboard(null);
    if (!value) {
      setCompanies([]);
      return;
    }
    try {
      const data = await getCompanies(value);
      setCompanies(data);
      if (data[0]) {
        setCompany(data[0]);
        await loadDashboard(value, data[0]);
      }
    } catch (error) {
      showMessage('error', error.message);
    }
  }

  async function handleCompanyChange(value) {
    setCompany(value);
    if (value) await loadDashboard(datasetId, value);
  }

  async function loadDashboard(selectedDatasetId, selectedCompany) {
    setLoading(true);
    try {
      const data = await getDashboard(selectedDatasetId, selectedCompany);
      setDashboard(data);
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!datasetId || !window.confirm('Deseja excluir esta importação?')) return;
    try {
      await deleteDataset(datasetId);
      setDatasetId('');
      setCompanies([]);
      setCompany('');
      setDashboard(null);
      await loadDatasets();
      showMessage('success', 'Importação excluída.');
    } catch (error) {
      showMessage('error', error.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <div className="brand">
          <div className="brand-icon"><BarChart3 size={25} /></div>
          <div>
            <h1>EJ Indicadores</h1>
            <span>Análise e acompanhamento de Empresas Juniores</span>
          </div>
        </div>
      </header>

      <main className="page-container">
        {message && <div className={`toast ${message.type}`}>{message.text}</div>}

        <div className="intro no-print">
          <div>
            <span className="eyebrow">PAINEL DE GESTÃO</span>
            <h2>Transforme planilhas em decisões</h2>
            <p>Importe seus dados, escolha uma EJ e acompanhe metas, resultados e pendências.</p>
          </div>
        </div>

        <UploadCard onUpload={handleUpload} loading={loading} />

        <section className="card filters-card no-print">
          <div className="section-title compact">
            <div className="icon-box"><Database size={20} /></div>
            <div>
              <h2>Selecionar dados</h2>
              <p>Escolha uma importação e a Empresa Júnior.</p>
            </div>
          </div>
          <div className="filters-grid">
            <label>
              Importação
              <select value={datasetId} onChange={(event) => handleDatasetChange(event.target.value)}>
                <option value="">Selecione uma planilha</option>
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    #{dataset.id} — {dataset.original_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Empresa Júnior
              <select value={company} onChange={(event) => handleCompanyChange(event.target.value)} disabled={!companies.length}>
                <option value="">Selecione uma EJ</option>
                {companies.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <button className="danger-button" onClick={handleDelete} disabled={!datasetId}>
              <Trash2 size={18} /> Excluir importação
            </button>
          </div>
        </section>

        {loading && <div className="loading">Carregando dados...</div>}

        {dashboard && !loading && (
          <div id="report-area">
            <section className="report-header">
              <div>
                <span>RELATÓRIO DE INDICADORES</span>
                <h2>{dashboard.empresa}</h2>
              </div>
              <button className="secondary-button no-print" onClick={() => window.print()}>
                <FileDown size={18} /> Gerar relatório em PDF
              </button>
            </section>
            <SummaryCards summary={dashboard.summary} />
            <div className="dashboard-grid">
              <IndicatorChart metrics={dashboard.metrics} />
              <AlertsPanel alerts={dashboard.alerts} />
            </div>
            <MetricsTable metrics={dashboard.metrics} />
          </div>
        )}

        {!dashboard && !loading && (
          <section className="empty-state">
            <BarChart3 size={42} />
            <h3>Seu painel aparecerá aqui</h3>
            <p>Importe uma planilha ou selecione uma importação existente.</p>
          </section>
        )}
      </main>
    </div>
  );
}
