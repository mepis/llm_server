#!/usr/bin/env python3
"""
API Research Helper Script
Fetches data from APIs for research purposes.
"""

import argparse
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError


def fetch_api(url: str, method: str = "GET", headers: dict | None = None, 
             data: dict | None = None, timeout: int = 30) -> dict[str, Any]:
    """Fetch data from API endpoint."""
    try:
        if headers is None:
            headers = {}
        
        if "User-Agent" not in headers:
            headers["User-Agent"] = "DeepResearch/1.0"
        
        if data and method in ("POST", "PUT", "PATCH"):
            data = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
        
        request = Request(url, method=method, headers=headers, data=data)
        
        with urlopen(request, timeout=timeout) as response:
            content_type = response.headers.get("Content-Type", "")
            
            if "application/json" in content_type:
                body = json.loads(response.read().decode("utf-8"))
            else:
                body = {"text": response.read().decode("utf-8")}
            
            return {
                "status_code": response.status,
                "headers": dict(response.headers),
                "body": body
            }
    
    except HTTPError as e:
        return {
            "status_code": e.code,
            "error": str(e),
            "body": None
        }
    except URLError as e:
        return {
            "status_code": 0,
            "error": f"URL error: {e.reason}",
            "body": None
        }
    except Exception as e:
        return {
            "status_code": 0,
            "error": str(e),
            "body": None
        }


def parallel_api_requests(requests: list[dict[str, Any]]) -> dict[str, Any]:
    """Execute parallel API requests."""
    results = {}
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_request = {}
        for req in requests:
            url = req.get("url", "")
            future = executor.submit(
                fetch_api,
                url=url,
                method=req.get("method", "GET"),
                headers=req.get("headers"),
                data=req.get("data")
            )
            future_to_request[future] = url
        
        for future in as_completed(future_to_request):
            url = future_to_request[future]
            try:
                results[url] = future.result()
            except Exception as e:
                results[url] = {"error": str(e)}
    
    return results


def save_results(results: dict[str, Any], output_path: str) -> None:
    """Save API results to JSON file."""
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Fetch data from APIs")
    parser.add_argument("--url", "-u", action="append", help="API URL (can be repeated)")
    parser.add_argument("--method", "-m", default="GET", 
                       choices=["GET", "POST", "PUT", "DELETE", "PATCH"],
                       help="HTTP method")
    parser.add_argument("--headers", "-H", help="JSON headers file")
    parser.add_argument("--data", "-d", help="JSON request body file")
    parser.add_argument("--requests-file", "-f", help="JSON file with multiple API requests")
    parser.add_argument("--output", "-o", help="Output JSON file path")
    
    args = parser.parse_args()
    
    if args.requests_file:
        with open(args.requests_file) as f:
            requests = json.load(f)
        results = parallel_api_requests(requests)
    else:
        if not args.url:
            parser.error("No URLs provided. Use --url or --requests-file")
        
        headers = None
        if args.headers:
            with open(args.headers) as f:
                headers = json.load(f)
        
        data = None
        if args.data:
            with open(args.data) as f:
                data = json.load(f)
        
        results = {}
        for url in args.url:
            results[url] = fetch_api(
                url=url,
                method=args.method,
                headers=headers,
                data=data
            )
    
    if args.output:
        save_results(results, args.output)
    else:
        print(json.dumps(results, indent=2))
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
