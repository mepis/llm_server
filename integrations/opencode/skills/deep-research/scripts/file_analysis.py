#!/usr/bin/env python3
"""
File Analysis Helper Script
Analyzes local files for research data extraction.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any


def read_markdown(path: str) -> dict[str, Any]:
    """Read and parse markdown file."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return {
            "path": path,
            "type": "markdown",
            "content": content,
            "line_count": len(content.splitlines()),
            "word_count": len(content.split())
        }
    except Exception as e:
        return {"path": path, "error": str(e)}


def read_text(path: str) -> dict[str, Any]:
    """Read text file."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return {
            "path": path,
            "type": "text",
            "content": content,
            "line_count": len(content.splitlines()),
            "word_count": len(content.split())
        }
    except Exception as e:
        return {"path": path, "error": str(e)}


def read_json(path: str) -> dict[str, Any]:
    """Read and parse JSON file."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return {
            "path": path,
            "type": "json",
            "data": data
        }
    except Exception as e:
        return {"path": path, "error": str(e)}


def read_csv(path: str, delimiter: str = ",") -> dict[str, Any]:
    """Read CSV file."""
    try:
        import csv
        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter=delimiter)
            rows = list(reader)
        
        return {
            "path": path,
            "type": "csv",
            "headers": reader.fieldnames,
            "rows": rows,
            "row_count": len(rows)
        }
    except Exception as e:
        return {"path": path, "error": str(e)}


def read_pdf(path: str) -> dict[str, Any]:
    """Read PDF file (extract text)."""
    try:
        import PyPDF2
        with open(path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
        
        return {
            "path": path,
            "type": "pdf",
            "page_count": len(reader.pages),
            "text": text,
            "word_count": len(text.split())
        }
    except ImportError:
        return {"path": path, "error": "PyPDF2 not installed. Install with: pip install PyPDF2"}
    except Exception as e:
        return {"path": path, "error": str(e)}


def read_excel(path: str) -> dict[str, Any]:
    """Read Excel file."""
    try:
        import pandas as pd
        sheets = pd.read_excel(path, sheet_name=None)
        
        result = {"path": path, "type": "excel", "sheets": {}}
        for sheet_name, df in sheets.items():
            result["sheets"][sheet_name] = {
                "columns": list(df.columns),
                "row_count": len(df),
                "data": df.to_dict(orient="records")
            }
        
        return result
    except ImportError:
        return {"path": path, "error": "pandas not installed. Install with: pip install pandas openpyxl"}
    except Exception as e:
        return {"path": path, "error": str(e)}


def analyze_file(path: str, file_type: str | None = None) -> dict[str, Any]:
    """Analyze a single file."""
    if file_type is None:
        ext = Path(path).suffix.lower()
        file_type_map = {
            ".md": "markdown",
            ".txt": "text",
            ".json": "json",
            ".csv": "csv",
            ".pdf": "pdf",
            ".xlsx": "excel",
            ".xls": "excel"
        }
        file_type = file_type_map.get(ext, "text")
    
    type_handlers = {
        "markdown": read_markdown,
        "text": read_text,
        "json": read_json,
        "csv": read_csv,
        "pdf": read_pdf,
        "excel": read_excel
    }
    
    handler = type_handlers.get(file_type, read_text)
    return handler(path)


def parallel_file_analysis(paths: list[str], file_types: dict[str, str] | None = None) -> dict[str, Any]:
    """Analyze multiple files in parallel."""
    results = {}
    
    for path in paths:
        file_type = file_types.get(path) if file_types else None
        results[path] = analyze_file(path, file_type)
    
    return results


def save_results(results: dict[str, Any], output_path: str) -> None:
    """Save analysis results to JSON file."""
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"Results saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Analyze files for research")
    parser.add_argument("--path", "-p", action="append", help="File path (can be repeated)")
    parser.add_argument("--type", "-t", choices=["markdown", "text", "json", "csv", "pdf", "excel"],
                       help="File type (auto-detected if not specified)")
    parser.add_argument("--type-file", help="JSON file mapping paths to types")
    parser.add_argument("--glob-pattern", "-g", help="Glob pattern for file matching")
    parser.add_argument("--output", "-o", help="Output JSON file path")
    
    args = parser.parse_args()
    
    paths = []
    if args.glob_pattern:
        paths = [str(p) for p in Path.cwd().glob(args.glob_pattern)]
    
    if args.path:
        paths.extend(args.path)
    
    if not paths:
        parser.error("No files provided. Use --path, --glob-pattern, or --type-file")
    
    file_types = None
    if args.type_file:
        with open(args.type_file) as f:
            file_types = json.load(f)
    
    results = parallel_file_analysis(paths, file_types)
    
    if args.output:
        save_results(results, args.output)
    else:
        print(json.dumps(results, indent=2, default=str))
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
