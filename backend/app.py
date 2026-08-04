from __future__ import annotations

import json
import uuid
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

from database import get_connection, init_database
from parser import build_dashboard, dataframe_to_records, read_file

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024
app.config["UPLOAD_FOLDER"] = str(UPLOAD_FOLDER)
CORS(app)

UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
init_database()


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify({"error": "O arquivo excede o limite de 12 MB."}), 413


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "message": "API funcionando"})


@app.post("/api/upload")
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "Nenhum arquivo foi enviado."}), 400

    uploaded_file = request.files["file"]
    if not uploaded_file.filename:
        return jsonify({"error": "Selecione um arquivo."}), 400
    if not allowed_file(uploaded_file.filename):
        return jsonify({"error": "Formato inválido. Use XLSX, XLS ou CSV."}), 400

    original_name = secure_filename(uploaded_file.filename)
    extension = original_name.rsplit(".", 1)[1].lower()
    stored_name = f"{uuid.uuid4().hex}.{extension}"
    stored_path = UPLOAD_FOLDER / stored_name
    uploaded_file.save(stored_path)

    try:
        dataframe = read_file(stored_path)
        company_column, records = dataframe_to_records(dataframe)

        with get_connection() as connection:
            cursor = connection.execute(
                "INSERT INTO datasets (original_name, stored_name) VALUES (?, ?)",
                (original_name, stored_name),
            )
            dataset_id = cursor.lastrowid
            connection.executemany(
                "INSERT INTO rows_data (dataset_id, empresa, payload) VALUES (?, ?, ?)",
                [
                    (dataset_id, record["empresa"], json.dumps(record["payload"], ensure_ascii=False))
                    for record in records
                ],
            )

        companies = sorted({record["empresa"] for record in records}, key=str.lower)
        return jsonify(
            {
                "message": "Planilha importada com sucesso.",
                "dataset_id": dataset_id,
                "company_column": company_column,
                "companies": companies,
                "rows_imported": len(records),
            }
        ), 201
    except ValueError as error:
        stored_path.unlink(missing_ok=True)
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        stored_path.unlink(missing_ok=True)
        return jsonify({"error": f"Não foi possível processar o arquivo: {error}"}), 500


@app.get("/api/datasets")
def list_datasets():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT d.id, d.original_name, d.created_at, COUNT(r.id) AS rows_count
            FROM datasets d
            LEFT JOIN rows_data r ON r.dataset_id = d.id
            GROUP BY d.id
            ORDER BY d.id DESC
            """
        ).fetchall()
    return jsonify([dict(row) for row in rows])


@app.get("/api/datasets/<int:dataset_id>/empresas")
def list_companies(dataset_id: int):
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT DISTINCT empresa FROM rows_data WHERE dataset_id = ? ORDER BY empresa",
            (dataset_id,),
        ).fetchall()
    return jsonify([row["empresa"] for row in rows])


@app.get("/api/datasets/<int:dataset_id>/dashboard")
def dashboard(dataset_id: int):
    company = request.args.get("empresa", "").strip()
    if not company:
        return jsonify({"error": "Informe a Empresa Júnior."}), 400

    with get_connection() as connection:
        rows = connection.execute(
            "SELECT payload FROM rows_data WHERE dataset_id = ? AND empresa = ?",
            (dataset_id, company),
        ).fetchall()

    if not rows:
        return jsonify({"error": "Empresa Júnior não encontrada nesta importação."}), 404

    merged_payload = {}
    for row in rows:
        current = json.loads(row["payload"])
        for key, value in current.items():
            if value not in (None, ""):
                merged_payload[key] = value

    return jsonify(build_dashboard(company, merged_payload))


@app.delete("/api/datasets/<int:dataset_id>")
def delete_dataset(dataset_id: int):
    with get_connection() as connection:
        dataset = connection.execute(
            "SELECT stored_name FROM datasets WHERE id = ?", (dataset_id,)
        ).fetchone()
        if not dataset:
            return jsonify({"error": "Importação não encontrada."}), 404
        connection.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))

    (UPLOAD_FOLDER / dataset["stored_name"]).unlink(missing_ok=True)
    return jsonify({"message": "Importação excluída."})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
