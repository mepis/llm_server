#!/usr/bin/env python3
"""
State Manager Helper Script
Manages research state for persistence and resumption.
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


def get_state_dir() -> Path:
    """Get the state directory path."""
    state_dir = Path.home() / ".local" / "share" / "opencode" / "deep-research"
    state_dir.mkdir(parents=True, exist_ok=True)
    return state_dir


def generate_state_id(topic: str) -> str:
    """Generate unique state ID for research session."""
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    safe_topic = topic.lower().replace(" ", "_")[:50]
    return f"research-{timestamp}-{safe_topic}"


def save_state(state_id: str, state: dict[str, Any]) -> str:
    """Save research state to file."""
    state_dir = get_state_dir()
    filepath = state_dir / f"{state_id}.json"
    
    state["saved_at"] = datetime.now().isoformat()
    
    with open(filepath, 'w') as f:
        json.dump(state, f, indent=2, default=str)
    
    return str(filepath)


def load_state(state_id: str) -> dict[str, Any] | None:
    """Load research state from file."""
    state_dir = get_state_dir()
    filepath = state_dir / f"{state_id}.json"
    
    if not filepath.exists():
        return None
    
    with open(filepath) as f:
        return json.load(f)


def list_states() -> list[dict[str, str]]:
    """List all saved research states."""
    state_dir = get_state_dir()
    
    states = []
    if state_dir.exists():
        for filepath in state_dir.glob("research-*.json"):
            try:
                with open(filepath) as f:
                    state = json.load(f)
                    states.append({
                        "id": filepath.stem,
                        "topic": state.get("topic", "Unknown"),
                        "phase": state.get("current_phase", "Unknown"),
                        "saved_at": state.get("saved_at", "Unknown"),
                        "filepath": str(filepath)
                    })
            except Exception:
                pass
    
    return sorted(states, key=lambda x: x["saved_at"], reverse=True)


def delete_state(state_id: str) -> bool:
    """Delete a research state file."""
    state_dir = get_state_dir()
    filepath = state_dir / f(f"{state_id}.json")
    
    if filepath.exists():
        filepath.unlink()
        return True
    return False


def update_phase(state_id: str, phase: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
    """Update research phase in existing state."""
    state = load_state(state_id)
    if state is None:
        raise ValueError(f"State not found: {state_id}")
    
    state["current_phase"] = phase
    if data:
        state["phase_data"] = state.get("phase_data", {})
        state["phase_data"][phase] = data
    
    save_state(state_id, state)
    return state


def main():
    parser = argparse.ArgumentParser(description="Manage research state")
    parser.add_argument("--save", action="store_true", help="Save current state")
    parser.add_argument("--resume", action="store_true", help="Resume previous research")
    parser.add_argument("--list", action="store_true", help="List saved states")
    parser.add_argument("--delete", action="store_true", help="Delete a state")
    
    parser.add_argument("--topic", "-t", help="Research topic (for save)")
    parser.add_argument("--id", help="State ID (for resume/delete)")
    parser.add_argument("--phase", help="Current research phase")
    parser.add_argument("--data", help="State data JSON file")
    parser.add_argument("--input", "-i", help="Input state JSON file (for save)")
    parser.add_argument("--output", "-o", help="Output directory")
    
    args = parser.parse_args()
    
    if args.list:
        states = list_states()
        if states:
            print("Saved Research States:")
            print("-" * 80)
            for state in states:
                print(f"ID: {state['id']}")
                print(f"Topic: {state['topic']}")
                print(f"Phase: {state['phase']}")
                print(f"Saved: {state['saved_at']}")
                print(f"File: {state['filepath']}")
                print("")
        else:
            print("No saved research states found.")
        return 0
    
    if args.save:
        state_dir = get_state_dir()
        
        if args.input:
            with open(args.input) as f:
                state = json.load(f)
        else:
            if not args.topic:
                parser.error("--topic required for save without --input")
            
            state = {
                "topic": args.topic,
                "created_at": datetime.now().isoformat(),
                "current_phase": args.phase or "outline"
            }
        
        state_id = args.id or generate_state_id(state.get("topic", "research"))
        filepath = save_state(state_id, state)
        print(f"State saved: {filepath}")
        print(f"State ID: {state_id}")
        return 0
    
    if args.resume:
        if not args.id:
            parser.error("--id required for resume")
        
        state = load_state(args.id)
        if state:
            print(json.dumps(state, indent=2))
            return 0
        else:
            print(f"State not found: {args.id}", file=sys.stderr)
            return 1
    
    if args.delete:
        if not args.id:
            parser.error("--id required for delete")
        
        if delete_state(args.id):
            print(f"State deleted: {args.id}")
            return 0
        else:
            print(f"State not found: {args.id}", file=sys.stderr)
            return 1
    
    parser.error("No action specified. Use --save, --resume, --list, or --delete")
    return 1


if __name__ == "__main__":
    sys.exit(main())
