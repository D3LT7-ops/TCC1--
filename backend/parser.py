from __future__ import annotations

import math
import re
import unicodedata
from pathlib import Path
from typing import Any

import pandas as pd

EMPRESA_ALIASES = {
    "empresa junior",
    "empresa",
    "ej",
    "nome da ej",
    "nome empresa junior",
    "organizacao",
}

IGNORED_COLUMNS = {
    "timestamp",
    "data",
    "hora",
    "email",
    "observacao",
    "observacoes",
}


def normalize_text(value: Any) -> str:
    text = "" if value is None else str(value)
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[_\-]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def clean_value(value: Any) -> Any:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except TypeError:
        pass

    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        if math.isnan(value):
            return None
        return round(value, 4)
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value).strip()


def read_file(file_path: Path) -> pd.DataFrame:
    suffix = file_path.suffix.lower()
    if suffix == ".csv":
        try:
            return pd.read_csv(file_path, sep=None, engine="python")
        except UnicodeDecodeError:
            return pd.read_csv(file_path, sep=None, engine="python", encoding="latin-1")
    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(file_path)
    raise ValueError("Formato não suportado. Envie XLSX, XLS ou CSV.")


def find_company_column(columns: list[str]) -> str:
    normalized = {column: normalize_text(column) for column in columns}
    for original, normalized_name in normalized.items():
        if normalized_name in EMPRESA_ALIASES:
            return original
    for original, normalized_name in normalized.items():
        if "empresa" in normalized_name or normalized_name == "ej":
            return original
    raise ValueError(
        "Não foi possível localizar a coluna da Empresa Júnior. "
        "Use um nome como 'Empresa Júnior', 'Empresa' ou 'EJ'."
    )


def dataframe_to_records(dataframe: pd.DataFrame) -> tuple[str, list[dict[str, Any]]]:
    dataframe = dataframe.dropna(how="all").copy()
    dataframe.columns = [str(column).strip() for column in dataframe.columns]
    company_column = find_company_column(list(dataframe.columns))

    records: list[dict[str, Any]] = []
    for _, row in dataframe.iterrows():
        company = clean_value(row.get(company_column))
        if company is None or str(company).strip() == "":
            continue

        payload = {
            column: clean_value(row.get(column))
            for column in dataframe.columns
            if column != company_column
        }
        records.append({"empresa": str(company).strip(), "payload": payload})

    if not records:
        raise ValueError("A planilha não possui linhas válidas com nome de Empresa Júnior.")
    return company_column, records


def to_number(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip()
    if not text:
        return None

    text = text.replace("R$", "").replace("%", "").replace(" ", "")
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(",", ".")

    try:
        return float(text)
    except ValueError:
        return None


def is_meta_column(column: str) -> bool:
    normalized = normalize_text(column)
    return normalized.startswith("meta ") or normalized.endswith(" meta") or "meta de " in normalized


def metric_base_name(column: str) -> str:
    normalized = normalize_text(column)
    normalized = re.sub(r"^meta\s+(de\s+)?", "", normalized)
    normalized = re.sub(r"\s+meta$", "", normalized)
    return normalized.strip()


def build_dashboard(company: str, payload: dict[str, Any]) -> dict[str, Any]:
    columns = list(payload.keys())
    meta_columns = [column for column in columns if is_meta_column(column)]
    metric_columns = [
        column
        for column in columns
        if column not in meta_columns
        and normalize_text(column) not in IGNORED_COLUMNS
        and to_number(payload.get(column)) is not None
    ]

    meta_map = {metric_base_name(column): column for column in meta_columns}
    metrics = []

    for column in metric_columns:
        value = to_number(payload.get(column))
        base = metric_base_name(column)
        meta_column = meta_map.get(base)

        if not meta_column:
            for meta_base, candidate in meta_map.items():
                if base in meta_base or meta_base in base:
                    meta_column = candidate
                    break

        target = to_number(payload.get(meta_column)) if meta_column else None
        percentage = None
        status = "sem_meta"
        difference = None

        if value is not None and target not in (None, 0):
            percentage = round((value / target) * 100, 2)
            difference = round(value - target, 2)
            status = "atingida" if value >= target else "pendente"

        metrics.append(
            {
                "name": column,
                "value": value,
                "target": target,
                "percentage": percentage,
                "difference": difference,
                "status": status,
            }
        )

    achieved = sum(metric["status"] == "atingida" for metric in metrics)
    pending = sum(metric["status"] == "pendente" for metric in metrics)
    with_target = achieved + pending
    overall = round((achieved / with_target) * 100, 2) if with_target else 0

    alerts = []
    for metric in metrics:
        if metric["status"] == "pendente":
            missing = abs(metric["difference"] or 0)
            alerts.append(
                {
                    "type": "warning",
                    "message": f"{metric['name']}: faltam {missing:g} para atingir a meta.",
                }
            )
        elif metric["status"] == "atingida":
            alerts.append(
                {
                    "type": "success",
                    "message": f"{metric['name']}: meta atingida.",
                }
            )

    return {
        "empresa": company,
        "summary": {
            "total_indicators": len(metrics),
            "with_target": with_target,
            "achieved": achieved,
            "pending": pending,
            "overall_percentage": overall,
        },
        "metrics": metrics,
        "alerts": alerts,
        "raw": payload,
    }
