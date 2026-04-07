---
name: deep-research
description: Performs comprehensive research on any topic using web, database, API, and file sources with multi-phase workflow and human approval
context: fork
agent: general
disable-model-invocation: true
allowed-tools:
  - bash
  - read
  - glob
  - grep
  - write
  - edit
  - task
  - webfetch
  - search_the_web
---

# Deep Research Skill

Perform comprehensive, multi-source research on any topic. This skill follows a structured 4-phase workflow with human-in-the-loop approval at each stage.

## When to Use

- Research complex topics requiring multiple information sources
- Investigate topics where accuracy and breadth matter
- Gather information from web, databases, APIs, and files
- Long-running research that may span multiple sessions

## When NOT to Use

- Simple factual questions that don't need deep investigation
- Topics requiring real-time data (check if sources are current)
- Situations where user just wants quick overview

---

## 4-Phase Research Workflow

### Phase 1: Outline Generation

**Goal**: Create structured research plan

**Steps**:

1. User provides research topic
2. AI generates comprehensive outline with research questions
3. Outline is saved for persistence

**Output**: Structured markdown outline with sections and research questions

**Approval Prompt Template**:

```
I've created a research outline for "{{topic}}". Does this cover what you need?

[Outline content here]

Please approve or request changes.
```

---

### Phase 2: Deep Research

**Goal**: Execute parallel research across 5 paths using multiple source types

**Sources Supported**:

- **Web**: 'search_the_web' tool web search, webfetch tool
- **Database**: Direct database queries
- **API**: HTTP requests to APIs
- **Files**: Local file analysis

**Steps**:

1. For each outline section, identify best source type
2. Execute parallel research (5 concurrent paths)
3. Collect findings with source citations
4. Review the information gathered thus far and update the outline with additional information to research when appropriate.

**Research Template per Section**:

```
Section: {{section title}}
Source Type: web/database/api/file
Query: {{specific search terms}}
Findings: {{key insights with citations}}
```

#### Parallel Execution

- Use ThreadPoolExecutor for concurrent research
- Maximum 5 parallel operations per path
- Handle errors gracefully
- Log progress for state persistence

---

### Phase 3: Report Generation

**Goal**: Synthesize findings into comprehensive markdown report

**Steps**:

1. Gather all research findings from Phase 2
2. Organize by outline structure
3. Add executive summary
4. Include citations for all sources
5. **USER APPROVAL**: User must approve draft before finalization

**Report Structure**:

```markdown
# Research Report: {{topic}}

## Executive Summary

Brief overview of key findings

## Sections

### Section 1: {{title}}

**Findings**: {{summary}}
**Sources**: {{list of citations}}

### Section 2: {{title}}

...

## Conclusion

Key takeaways and implications

## References

Full citation list
```

---

### Phase 4: Refinement

**Goal**: Iterate based on user feedback

**Steps**:

1. User requests additions/revisions
2. AI performs targeted additional research
3. Updates report with new findings
4. Final approval and saving

**Common Refinements**:

- Expand on specific sections
- Add new sources
- Clarify findings
- Update outdated information

---

## Research State Persistence

Research state is saved between sessions for long-running topics.

**State Location**: Save the state in a folder called 'deep_research' in the docs folder of the current repository. If a docs folder does not exist, create one.

**State Includes**:

- Research topic and timestamp
- Approved outline
- Collected findings with source metadata
- Report draft
- Session history for resumption

**Resuming Research**:

- Use `/deep-research resume` command
- State files are auto-saved after each phase

---

## Helper Scripts

Use the 'search_the_web' tool to perform web searches. This should be your primary tool for performing research activities.

The following Python scripts are available in `scripts/`:

### web_research.py

Execute parallel web searches using 'search_the_web' tool:

```bash
python scripts/web_research.py --query "search terms" --num-results 5
```

### database_research.py

Query databases directly:

```bash
python scripts/database_research.py --query "SQL statement" --db-type postgresql
```

### file_analysis.py

Analyze local files:

```bash
python scripts/file_analysis.py --path "/path/to/file" --type markdown
```

### report_generator.py

Synthesize findings into report:

```bash
python scripts/report_generator.py --input "findings.json" --output "report.md"
```

### state_manager.py

Manage research state:

```bash
python scripts/state_manager.py --save --topic "my research"
python scripts/state_manager.py --resume --id "research-20260403-123456"
```

---

## Examples

### Example 1: Technical Topic Research

**User**: "Research modern JavaScript performance optimization techniques"

**Phase 1 Output**: Outline with sections:

- JavaScript Engine Optimization
- Memory Management
- Async Performance
- Bundler Optimization
- Runtime Performance

**Phase 2 Output**: Parallel research findings with 'search_the_web' tool queries

**Phase 3 Output**: Markdown report with 10+ source citations

---

### Example 2: Multi-Source Research

**User**: "Analyze climate change impacts on agriculture using recent studies and government data"

**Source Mix**:

- Web: 'search_the_web' tool searches for recent academic papers
- Database: Government climate databases
- API: Weather/agriculture data APIs
- Files: Local PDF reports if available

---

### Example 3: Resume Previous Research

**User**: "Resume my previous research on quantum computing applications"

**State Manager**: Loads research-20260402-091523.json

**Phase 4**: Continues from where left off with updated context

---

## Best Practices

1. **Be Specific**: Clear research questions yield better results
2. **Review Progress**: Check Phase 2 findings before Phase 3
3. **Request Additions**: Tell AI when sources are missing
4. **Cite Your Work**: Always verify source citations
5. **Update Topics**: Topics may evolve during research
6. **Save States**: Long research benefit from state persistence

---

## Troubleshooting

**No Results Found**:

- Try broader search terms
- Check source availability
- Switch to different source type

**Outdated Information**:

- Add date filters to web searches
- Check source publication dates
- Request recent alternatives

**Conflicting Sources**:

- Note discrepancies in report
- Seek additional authoritative sources
- Present balanced view with context

**Research Hangs**:

- Check network/API connectivity
- Verify database credentials
- Review file permissions

---

## Commands

- `/deep-research <topic>` - Start new research
- `/deep-research resume` - Resume previous research
- `/deep-research approve` - Approve current phase
- `/deep-research refine <request>` - Request additions
