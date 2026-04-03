#!/usr/bin/env python3
"""
Report Generator Helper Script
Synthesizes research findings into comprehensive markdown reports.
"""

import argparse
import json
import os
import sys
from datetime import datetime
from typing import Any


def generate_markdown_report(
    topic: str,
    outline: dict[str, Any],
    findings: dict[str, Any],
    citations: dict[str, list[str]]
) -> str:
    """Generate comprehensive markdown report."""
    lines = []
    
    lines.append(f"# Research Report: {topic}")
    lines.append("")
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("")
    
    lines.append("## Executive Summary")
    lines.append("")
    summary = outline.get("summary", f"Comprehensive research on {topic} covering {len(outline.get('sections', []))} key sections.")
    lines.append(summary)
    lines.append("")
    
    lines.append("## Research Outline")
    lines.append("")
    for section in outline.get("sections", []):
        lines.append(f"### {section.get('title', 'Section')}")
        lines.append("")
        if section.get('question'):
            lines.append(f"**Research Question**: {section['question']}")
            lines.append("")
    lines.append("")
    
    lines.append("## Findings")
    lines.append("")
    
    for section in outline.get("sections", []):
        section_title = section.get('title', 'Section')
        section_id = section.get('id', section_title.lower().replace(' ', '_'))
        
        lines.append(f"### {section_title}")
        lines.append("")
        
        section_findings = findings.get(section_id, findings.get(section_title, []))
        section_citations = citations.get(section_id, citations.get(section_title, []))
        
        if isinstance(section_findings, str):
            lines.append(section_findings)
        elif isinstance(section_findings, list):
            for finding in section_findings:
                if isinstance(finding, str):
                    lines.append(f"- {finding}")
                elif isinstance(finding, dict):
                    lines.append(f"- {finding.get('text', str(finding))}")
        
        lines.append("")
        
        if section_citations:
            lines.append("**Sources**:")
            for citation in section_citations:
                lines.append(f"- {citation}")
            lines.append("")
        
        lines.append("")
    
    lines.append("## Conclusion")
    lines.append("")
    conclusion = outline.get("conclusion", "This research identified key insights across multiple domains.")
    lines.append(conclusion)
    lines.append("")
    
    lines.append("## References")
    lines.append("")
    
    all_citations = []
    for citation_list in citations.values():
        all_citations.extend(citation_list)
    
    for i, citation in enumerate(all_citations, 1):
        lines.append(f"[{i}] {citation}")
    
    return "\n".join(lines)


def generate_summary_report(topic: str, findings: dict[str, Any]) -> str:
    """Generate brief summary report."""
    lines = []
    lines.append(f"# Summary Report: {topic}")
    lines.append("")
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("")
    lines.append("## Key Findings")
    lines.append("")
    
    for key, value in findings.items():
        lines.append(f"### {key}")
        if isinstance(value, str):
            lines.append(value)
        elif isinstance(value, list):
            for item in value:
                lines.append(f"- {item}")
        lines.append("")
    
    return "\n".join(lines)


def merge_findings(outline_findings: dict[str, Any], web_findings: dict[str, Any],
                  database_findings: dict[str, Any], api_findings: dict[str, Any],
                  file_findings: dict[str, Any]) -> dict[str, Any]:
    """Merge findings from all source types."""
    merged = {}
    
    all_keys = set(outline_findings.keys()) | set(web_findings.keys()) | \
               set(database_findings.keys()) | set(api_findings.keys()) | \
               set(file_findings.keys())
    
    for key in all_keys:
        all_values = []
        
        for findings_dict in [outline_findings, web_findings, database_findings, 
                              api_findings, file_findings]:
            if key in findings_dict:
                value = findings_dict[key]
                if isinstance(value, list):
                    all_values.extend(value)
                elif isinstance(value, str):
                    all_values.append(value)
                elif isinstance(value, dict):
                    if 'text' in value:
                        all_values.append(value['text'])
                    else:
                        all_values.append(str(value))
        
        merged[key] = all_values
    
    return merged


def save_report(report: str, output_path: str) -> None:
    """Save report to file."""
    with open(output_path, 'w') as f:
        f.write(report)
    print(f"Report saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate research reports")
    parser.add_argument("--topic", "-t", required=True, help="Research topic")
    parser.add_argument("--outline", "-o", help="Outline JSON file")
    parser.add_argument("--web-findings", "-w", help="Web search findings JSON file")
    parser.add_argument("--database-findings", "-d", help="Database search findings JSON file")
    parser.add_argument("--api-findings", "-a", help="API search findings JSON file")
    parser.add_argument("--file-findings", "-f", help="File analysis findings JSON file")
    parser.add_argument("--citations", "-c", help="Citations JSON file")
    parser.add_argument("--output", "-O", help="Output markdown file path")
    parser.add_argument("--summary", "-s", action="store_true", help="Generate summary report only")
    
    args = parser.parse_args()
    
    outline = {"sections": []}
    if args.outline:
        with open(args.outline) as f:
            outline = json.load(f)
    
    web_findings = {}
    if args.web_findings:
        with open(args.web_findings) as f:
            web_findings = json.load(f)
    
    database_findings = {}
    if args.database_findings:
        with open(args.database_findings) as f:
            database_findings = json.load(f)
    
    api_findings = {}
    if args.api_findings:
        with open(args.api_findings) as f:
            api_findings = json.load(f)
    
    file_findings = {}
    if args.file_findings:
        with open(args.file_findings) as f:
            file_findings = json.load(f)
    
    citations = {}
    if args.citations:
        with open(args.citations) as f:
            citations = json.load(f)
    
    if args.summary:
        all_findings = merge_findings({}, web_findings, database_findings, 
                                       api_findings, file_findings)
        report = generate_summary_report(args.topic, all_findings)
    else:
        findings = merge_findings(outline, web_findings, database_findings,
                                  api_findings, file_findings)
        report = generate_markdown_report(args.topic, outline, findings, citations)
    
    if args.output:
        save_report(report, args.output)
    else:
        print(report)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
