# EJ Indicadores

Sistema web para importar planilhas de Empresas Juniores, selecionar uma EJ e acompanhar indicadores, metas e pendências em um painel visual.

## Funcionalidades

- Importação de arquivos `.xlsx`, `.xls` e `.csv`
- Identificação automática de colunas mais comuns
- Seleção da Empresa Júnior
- Painel com valores, percentuais e status
- Alertas de metas atingidas e pendentes
- Gráficos por indicador
- Geração de relatório em PDF pelo navegador
- Modelo de planilha para testes

## Tecnologias

- Frontend: React + Vite + Recharts
- Backend: Python + Flask
- Leitura de dados: Pandas + OpenPyXL
- Banco local: SQLite

## Estrutura

```text
ej-indicadores/
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── parser.py
│   ├── requirements.txt
│   └── schema.sql
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── exemplos/
│   └── indicadores_exemplo.csv
├── .gitignore
└── README.md
```

## Formato recomendado da planilha

A primeira linha deve conter os nomes das colunas. O sistema reconhece variações de nomes, mas este formato é recomendado:

| Empresa Júnior | Faturamento | Meta Faturamento | CSAT | Meta CSAT | ECM | Meta ECM | Eventos | Meta Eventos |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| SIFSoft Júnior | 12000 | 15000 | 92 | 90 | 8 | 10 | 3 | 4 |

Também são aceitos indicadores extras. Quando a coluna de meta tiver o padrão `Meta Nome do Indicador`, ela será vinculada automaticamente ao indicador correspondente.

## Como executar

### 1. Backend

```bash
cd backend
python -m venv .venv
```

No Windows:

```bash
.venv\Scripts\activate
```

No Linux/macOS:

```bash
source .venv/bin/activate
```

Instale as dependências e execute:

```bash
pip install -r requirements.txt
python app.py
```

O backend será iniciado em `http://localhost:5000`.

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Endpoints principais

- `GET /api/health` — verifica o funcionamento da API
- `POST /api/upload` — importa uma planilha
- `GET /api/datasets` — lista importações salvas
- `GET /api/datasets/<id>/empresas` — lista as EJs de uma importação
- `GET /api/datasets/<id>/dashboard?empresa=Nome` — retorna o painel da EJ
- `DELETE /api/datasets/<id>` — exclui uma importação

## Ideias para evolução no TCC

- Login por EJ e por Núcleo
- Histórico mensal dos indicadores
- Comparação entre EJs
- Metas configuráveis pelo administrador
- Integração com Google Planilhas
- Exportação de relatório diretamente pelo backend
- Previsão de atingimento de metas
- Registro de avaliações dos usuários do Núcleo Norte

## Publicação no GitHub

```bash
git init
git add .
git commit -m "MVP do sistema de indicadores de Empresas Juniores"
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```
