#!/usr/bin/env python3
"""
Web Research Helper Script
Parallel web search using exa
"""

import argparse
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any


def run_exa_search(query: str, num_results: int = 5) -> list[dict[str, Any]]:
    """Execute web search using exa."""
    try:
        env = os.environ.copy()
        env["OPENCODE_ENABLE_EXA"] = "1"
        
        cmd = [
            "python3", "-c",
            f"import os; os.environ['OPENCODE_ENABLE_EXA'] = '1'; "
            f"import webfetch; "
            f"results = webfetch.search('{query}', format='markdown', timeout=30); "
            f"print(json.dumps(results))"
        ]
        
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            return json.loads(result.stdout)
    except Exception as e:
        print(f"Warning: exa search failed for '{query}': {e}", file=sys.stderr)
    
    return []


def run_webfetch(query: str) -> dict[str, Any]:
    """Fetch single web page content."""
    try:
        env = os.environ.copy()
        env["OPENCODE_ENABLE_EXA"] = "1"
        
        cmd = [
            "python3", "-c",
            f"import os; os.environ['OPENCODE_ENABLE_EXA'] = '1'; "
            f"import webfetch; "
            f"result = webfetch.fetch('{query}', format='markdown'); "
            f"print(json.dumps(result))"
        ]
        
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return json.loads(result.stdout)
    except Exception as e:
        print(f"Warning: webfetch failed for '{query}': {e}", file=sys.stderr)
    
    return {}


def parallel_web_search(queries: list[str], num_results: int = 5) -> dict[str, Any]:
    """Execute parallel web searches across multiple queries."""
    results = {}
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_query = {
            executor.submit(run_exa_search, query, num_results): query
            for query in queries
        }
        
        for future in as_completed(future_to_query):
            query = future_to_query[future]
            try:
                results[query] = future.result()
            except Exception as e:
                results[query] = []
                print(f"Error searching '{query}': {e}", file=sys.stderr)
    
    return results


def save_results(results: dict[str, Any], output_path: str) -> None:
    """Save search results to JSON file."""
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Execute parallel web searches")
    parser.add_argument("--query", "-q", action="append", help="Search query (can be repeated)")
    parser.add_argument("--queries-file", "-f", help="File with newline-separated queries")
    parser.add_argument("--num-results", "-n", type=int, default=5, help="Number of results per query")
    parser.add_argument("--output", "-o", help="Output JSON file path")
    
    args = parser.parse_args()
    
    queries = []
    if args.queries_file:
        with open(args.queries_file) as f:
            queries = [line.strip() for line in f if line.strip()]
    
    if args.query:
        queries.extend(args.query)
    
    if not queries:
        parser.error("No queries provided. Use --query or --queries-file")
    
    print(f"Executing parallel search for {len(queries)} queries...")
    results = parallel_web_search(queries, args.num_results)
    
    if args.output:
        save_results(results, args.output)
    else:
        print(json.dumps(results, indent=2))
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
