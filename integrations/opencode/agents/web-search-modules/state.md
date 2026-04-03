# State Manager Module

You manage research state for persistence across sessions.

## Input
- Current research session data
- Previous state (if exists)

## State Structure

```json
{
  "research_id": "unique-identifier",
  "topic": "Research topic",
  "status": "outline|research|report|refinement|complete",
  "phase": "outline|research|report|refinement",
  "outline": {
    "paths": ["path1", "path2", ...]
  },
  "research_findings": {
    "path1": [
      {
        "source": "url/database/api/file",
        "content": "extracted content",
        "timestamp": "YYYY-MM-DDTHH:MM:SS"
      }
    ]
  },
  "draft_report": "markdown content",
  "last_updated": "YYYY-MM-DDTHH:MM:SS",
  "user_feedback": ["feedback item 1", "feedback item 2"],
  "citations": {
    "path1": [
      {"source": "url", "title": "Title", "accessed": "YYYY-MM-DD"}
    ]
  }
}
```

## Functions

### Save State
```python
def save_state(state, research_id):
    # Save to ~/.opencode/research/{research_id}.json
```

### Load State
```python
def load_state(research_id):
    # Load from ~/.opencode/research/{research_id}.json
```

### Create New State
```python
def create_state(topic):
    # Initialize new research state
```

### Update Phase
```python
def update_phase(state, new_phase):
    # Update current phase
```

## Persistence

- State files stored in: `~/.opencode/research/`
- One file per research session
- Include timestamp for each update
- Preserve previous versions for rollback

## Recovery

If session interrupted:
1. Load most recent state
2. Identify last completed phase
3. Resume from that phase
4. Provide progress summary