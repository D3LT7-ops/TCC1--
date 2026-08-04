const API_URL = import.meta.env.VITE_API_URL || '';

async function parseResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ocorreu um erro inesperado.');
  }
  return data;
}

export async function uploadSpreadsheet(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  return parseResponse(response);
}

export async function getDatasets() {
  const response = await fetch(`${API_URL}/api/datasets`);
  return parseResponse(response);
}

export async function getCompanies(datasetId) {
  const response = await fetch(`${API_URL}/api/datasets/${datasetId}/empresas`);
  return parseResponse(response);
}

export async function getDashboard(datasetId, company) {
  const params = new URLSearchParams({ empresa: company });
  const response = await fetch(`${API_URL}/api/datasets/${datasetId}/dashboard?${params}`);
  return parseResponse(response);
}

export async function deleteDataset(datasetId) {
  const response = await fetch(`${API_URL}/api/datasets/${datasetId}`, {
    method: 'DELETE',
  });
  return parseResponse(response);
}
