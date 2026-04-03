# Example Outputs

This directory contains example outputs from the deep research skill.

## Example 1: Technical Research Outline

**Input**: "Research modern JavaScript performance optimization techniques"

**Output**:
```markdown
## Research Outline: Modern JavaScript Performance Optimization

### Sections

1. JavaScript Engine Optimization
   - Question: How do modern JavaScript engines optimize code execution?
   - Sources: Web, Documentation
   
2. Memory Management
   - Question: What are the best practices for memory management in JS?
   - Sources: Web, Academic Papers
   
3. Async Performance
   - Question: How can async/await patterns be optimized?
   - Sources: Web, Blog Posts
   
4. Bundler Optimization
   - Question: What bundler settings yield best performance?
   - Sources: Web, Documentation
   
5. Runtime Performance
   - Question: How to optimize runtime code paths?
   - Sources: Web, Benchmark Results
```

## Example 2: Multi-Source Research Report

**Input**: "Analyze climate change impacts on agriculture using recent studies and government data"

**Output Structure**:
```markdown
# Research Report: Climate Change Impacts on Agriculture

## Executive Summary

This research synthesizes findings from 15 web sources, 3 government databases,
and 2 academic API endpoints to analyze climate change effects on agriculture.

## Research Outline

### Section 1: Temperature Trends
**Source**: Web + Database
**Findings**: Rising global temperatures affecting crop yields...

## Findings

### Section 1: Temperature Trends
- Crop yield decreases of 5-10% per degree Celsius (source 1)
- Growing season lengthening in temperate zones (source 2)
- Increased heat stress on livestock (source 3)

**Sources**:
1. https://exa.example.com/search/temperature-crop-yield
2. https://data.gov/climate/temperature-trends
3. https://api.example.com/livestock-stress

### Section 2: Precipitation Changes
...

## Conclusion

Climate change is significantly altering agricultural patterns globally,
with regional variations in impacts and adaptation needs.

## References

[1] https://exa.example.com/search/temperature-crop-yield
[2] https://data.gov/climate/temperature-trends
[3] https://api.example.com/livestock-stress
```

## Example 3: State File for Persistence

**File**: `research-20260403-143023-quantum Computing.json`

```json
{
  "topic": "Quantum Computing Applications",
  "created_at": "2026-04-03T14:30:23.123456",
  "current_phase": "report",
  "phase_data": {
    "outline": {
      "sections": [...],
      "summary": "...",
      "conclusion": "..."
    },
    "web_search": [
      {"url": "...", "findings": "..."},
      {"url": "...", "findings": "..."}
    ],
    "database_search": [...]
  },
  "citations": {
    "section_1": ["https://...", "..."],
    "section_2": ["..."]
  },
  "saved_at": "2026-04-03T15:45:32.789012"
}
```

## Example 4: Web Research Results

**Script**: `python scripts/web_research.py --query "JavaScript performance" --num-results 3`

```json
{
  "JavaScript performance": [
    {
      "url": "https://example.com/article1",
      "title": "JavaScript Performance Optimization Guide",
      "content": "...",
      "snippet": "...",
      "published_date": "2026-03-15"
    },
    {
      "url": "https://example.com/article2",
      "title": "Modern JS Performance Patterns",
      "content": "...",
      "snippet": "...",
      "published_date": "2026-02-20"
    }
  ]
}
```

## Example 5: Database Research Results

**Script**: `python scripts/database_research.py --db-type postgresql --query "SELECT * FROM climate_data WHERE year > 2020"`

```json
{
  "SELECT * FROM climate_data WHERE year > 2020": [
    {
      "year": 2021,
      "region": "North America",
      "avg_temperature": 15.2,
      "precipitation": 1250
    },
    {
      "year": 2022,
      "region": "North America",
      "avg_temperature": 15.8,
      "precipitation": 1180
    }
  ]
}
```

## Example 6: API Research Results

**Script**: `python scripts/api_research.py --url "https://api.example.com/data" --method GET`

```json
{
  "https://api.example.com/data": {
    "status_code": 200,
    "headers": {
      "Content-Type": "application/json",
      "X-RateLimit-Remaining": "99"
    },
    "body": {
      "data": [...],
      "metadata": {...}
    }
  }
}
```

## Example 7: File Analysis Results

**Script**: `python scripts/file_analysis.py --path "/data/research_paper.md"`

```json
{
  "/data/research_paper.md": {
    "path": "/data/research_paper.md",
    "type": "markdown",
    "content": "# Research Paper\n\n...",
    "line_count": 2547,
    "word_count": 12345
  }
}
```

## Example 8: Report Generation Input

**JSON Findings File**:
```json
{
  "outline": {
    "sections": [
      {"title": "JavaScript Engine", "question": "..."},
      {"title": "Memory Management", "question": "..."}
    ],
    "summary": "...",
    "conclusion": "..."
  },
  "web_findings": {
    "javascript_engine": ["Optimization technique 1", "Optimization technique 2"],
    "memory_management": ["Garbage collection strategies"]
  },
  "citations": {
    "javascript_engine": ["https://...", "..."],
    "memory_management": ["..."]
  }
}
```

**Command**:
```bash
python scripts/report_generator.py \
  --topic "JavaScript Performance" \
  --outline outline.json \
  --web-findings findings.json \
  --output report.md
```

## Example 9: State Management Commands

**Save State**:
```bash
python scripts/state_manager.py \
  --save \
  --topic "Climate Research" \
  --phase "outline"
```

**Resume Research**:
```bash
python scripts/state_manager.py \
  --resume \
  --id "research-20260402-091523-climate_research"
```

**List All States**:
```bash
python scripts/state_manager.py --list
```

**Delete State**:
```bash
python scripts/state_manager.py \
  --delete \
  --id "research-20260402-old-topic"
```
