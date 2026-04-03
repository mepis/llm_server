#!/usr/bin/env python3
"""
Database Research Helper Script
Queries databases directly for research data.
"""

import argparse
import json
import os
import sys
from typing import Any


def connect_postgresql(connection_string: str) -> Any:
    """Connect to PostgreSQL database."""
    try:
        import psycopg2
        return psycopg2.connect(connection_string)
    except ImportError:
        print("Error: psycopg2 not installed. Install with: pip install psycopg2", file=sys.stderr)
        sys.exit(1)


def connect_mysql(connection_string: str) -> Any:
    """Connect to MySQL database."""
    try:
        import mysql.connector
        return mysql.connector.connect(**connection_string)
    except ImportError:
        print("Error: mysql.connector not installed. Install with: pip install mysql-connector-python", file=sys.stderr)
        sys.exit(1)


def connect_sqlite(database_path: str) -> Any:
    """Connect to SQLite database."""
    try:
        import sqlite3
        return sqlite3.connect(database_path)
    except ImportError:
        print("Error: sqlite3 not available", file=sys.stderr)
        sys.exit(1)


def query_database(conn, query: str) -> list[dict[str, Any]]:
    """Execute query and return results as list of dicts."""
    cursor = conn.cursor()
    cursor.execute(query)
    
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    
    results = []
    for row in rows:
        results.append(dict(zip(columns, row)))
    
    cursor.close()
    return results


def postgresql_query(connection_string: str, query: str) -> list[dict[str, Any]]:
    """Execute query on PostgreSQL database."""
    conn = connect_postgresql(connection_string)
    try:
        return query_database(conn, query)
    finally:
        conn.close()


def mysql_query(connection_string: str, query: str) -> list[dict[str, Any]]:
    """Execute query on MySQL database."""
    conn = connect_mysql(connection_string)
    try:
        return query_database(conn, query)
    finally:
        conn.close()


def sqlite_query(database_path: str, query: str) -> list[dict[str, Any]]:
    """Execute query on SQLite database."""
    conn = connect_sqlite(database_path)
    try:
        return query_database(conn, query)
    finally:
        conn.close()


def parallel_database_queries(queries: list[dict[str, str]]) -> dict[str, Any]:
    """Execute parallel queries on multiple databases."""
    results = {}
    
    for query_item in queries:
        db_type = query_item.get("db_type", "postgresql")
        connection = query_item.get("connection")
        query = query_item.get("query")
        
        if db_type == "postgresql":
            results[query] = postgresql_query(connection, query)
        elif db_type == "mysql":
            results[query] = mysql_query(connection, query)
        elif db_type == "sqlite":
            results[query] = sqlite_query(connection, query)
        else:
            print(f"Unknown database type: {db_type}", file=sys.stderr)
    
    return results


def save_results(results: dict[str, Any], output_path: str) -> None:
    """Save query results to JSON file."""
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"Results saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Query databases for research")
    parser.add_argument("--query", "-q", help="SQL query to execute")
    parser.add_argument("--db-type", "-t", choices=["postgresql", "mysql", "sqlite"], 
                       required=True, help="Database type")
    parser.add_argument("--connection", "-c", help="Database connection string/path")
    parser.add_argument("--queries-file", "-f", help="JSON file with multiple queries")
    parser.add_argument("--output", "-o", help="Output JSON file path")
    
    args = parser.parse_args()
    
    if args.queries_file:
        with open(args.queries_file) as f:
            queries = json.load(f)
        results = parallel_database_queries(queries)
    else:
        if not args.query or not args.connection:
            parser.error("--query and --connection required when not using --queries-file")
        
        if args.db_type == "postgresql":
            results = {args.query: postgresql_query(args.connection, args.query)}
        elif args.db_type == "mysql":
            results = {args.query: mysql_query(args.connection, args.query)}
        elif args.db_type == "sqlite":
            results = {args.query: sqlite_query(args.connection, args.query)}
    
    if args.output:
        save_results(results, args.output)
    else:
        print(json.dumps(results, indent=2, default=str))
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
