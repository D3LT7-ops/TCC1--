import { useRef, useState } from 'react';
import { FileSpreadsheet, Upload } from 'lucide-react';

export default function UploadCard({ onUpload, loading }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);

  function submit(event) {
    event.preventDefault();
    if (file) onUpload(file);
  }

  return (
    <section className="card upload-card">
      <div className="section-title">
        <div className="icon-box"><FileSpreadsheet size={22} /></div>
        <div>
          <h2>Importar planilha</h2>
          <p>Envie um arquivo Excel ou CSV com os indicadores das EJs.</p>
        </div>
      </div>

      <form onSubmit={submit}>
        <button
          type="button"
          className="dropzone"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={30} />
          <strong>{file ? file.name : 'Clique para selecionar o arquivo'}</strong>
          <span>XLSX, XLS ou CSV — máximo de 12 MB</span>
        </button>
        <input
          ref={inputRef}
          className="hidden-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        <button className="primary-button" type="submit" disabled={!file || loading}>
          {loading ? 'Importando...' : 'Importar e analisar'}
        </button>
      </form>
    </section>
  );
}
