---
name: deep-research
description: ALWAYS execute deep, multi-phase, recursive, and highly structured research on a specified topic ($TOPIC). The primary goal is to build a complete knowledge base, culminating in a definitive, formal analysis report.
license: MIT
compatibility: opencode
metadata:
  audience: analysts, researchers
  workflow: deep-dive, synthesis, recursion
  expertise_level: expert
  state_management: file-based, persistent
roles: ["user"]
---
## 📦 STATE MANAGEMENT

### State File Location
Maintain research state in `./opencode/deep-research/STATE.md` (project-local) or `~/.config/opencode/deep-research/STATE.md` (global).

### State File Schema
```markdown
---
topic: "$TOPIC"
created_at: "YYYY-MM-DD HH:MM:SS"
last_updated: "YYYY-MM-DD HH:MM:SS"
current_phase: "Phase 1|Phase 2|Phase 3|Complete"
status: "active|paused|completed"
---

## Phase 1: Foundational Survey
sub_topics_identified:
  - name: "Sub-topic 1"
    definition: "One-sentence definition"
    key_concepts: ["concept1", "concept2", "concept3"]
  - name: "Sub-topic 2"
    definition: "One-sentence definition"
    key_concepts: ["concept1", "concept2", "concept3"]

## Phase 2: Deep Dive
critical_sub_topics:
  - name: "Sub-topic X"
    defined: true|false
    trends_identified: ["trend1", "trend2", "trend3"]
    example_provided: true|false
    example_source: "URL or citation"

## Phase 3: Gap Analysis
gaps_identified:
  - gap_description: "What is thin/contradictory/unexplored"
    follow_up_questions:
      - "Question 1"
      - "Question 2"
    resolved: true|false
    findings: "Integrated findings here"

## Progress Tracking
phase_1_complete: true|false
phase_2_complete: true|false
phase_3_complete: true|false
stopping_criteria_met: "A|B|Neither"
```

### State Operations

**On Skill Activation (Read State)**
1. Check if state file exists at either location
2. If exists, load and display current progress
3. Resume from `current_phase` if `status` is "active"
4. If no state or status is "completed", initialize new state

**After Each Phase (Update State)**
1. Update `current_phase` to next phase
2. Populate relevant section with findings
3. Set phase completion flag to `true`
4. Update `last_updated` timestamp
5. Write state file with `synthetic: true` flag for compaction survival

**On Completion (Finalize State)**
1. Set `status` to "completed"
2. Set `stopping_criteria_met` to "A" or "B"
3. Archive state file with completion timestamp
4. Optionally create checkpoint copy: `STATE_YYYYMMDD.md`

### Compaction Survival Strategy
All state updates must use OpenCode's synthetic context injection:
- Mark state file writes with `synthetic: true` to survive context compaction
- Use `noReply: true` to avoid counting as user input
- Re-inject critical state at phase boundaries if session is long-running

### Cross-Session Continuity
If research spans multiple sessions:
1. At session start, automatically read state file
2. Display summary: "Resuming research on $TOPIC from Phase X"
3. Continue from where previous session left off
4. All findings persist across session boundaries

## 🔬 WHAT I DO (Execution Plan)
ALWAYS execute the research using the following mandatory, sequential phases. Proceed to the next phase ONLY when the current phase's stated objectives are 100% met.

**⚡ INITIALIZATION (Before Phase 1)**
1. Check for existing state file at `./opencode/deep-research/STATE.md` or `~/.config/opencode/deep-research/STATE.md`
2. If state exists and `status` is "active": Display "Resuming research on $TOPIC from {current_phase}" and skip to that phase
3. If no state or status is "completed": Initialize new state file with topic, timestamp, and `current_phase: "Phase 1"`

**Phase 1: Foundational Survey & Scoping.**
*   **Objective:** Establish terminology, historical context, and current domain landscape for $TOPIC.
*   **Action:** Identify 5-7 primary, distinct sub-topics/angles. For each, provide a one-sentence definition AND list 2-3 key concepts related to it.
*   **State Update:** Write findings to state file under "Phase 1: Foundational Survey", set `phase_1_complete: true`
*   **Output Format:** A bulleted list titled "Phase 1: Foundational Survey of $TOPIC"

**Phase 2: Deep Dive & Synthesis.**
*   **Objective:** Systematically explore the 3 most critical sub-topics from Phase 1.
*   **Pre-Check:** Read state file, identify 3 critical sub-topics from Phase 1 findings
*   **Action:** For each of the 3 critical sub-topics:
    1.  **Define:** Explain the concept thoroughly (approx. 150-200 words, maintaining expert tone).
    2.  **Trends:** List and briefly describe 3 major current trends/advances.
    3.  **Example:** Provide 1 concrete, high-quality example (must be verifiable or cited).
*   **State Update:** Populate "Phase 2: Deep Dive" section with `defined`, `trends_identified`, `example_provided`, and `example_source` for each sub-topic. Set `phase_2_complete: true`
*   **Output Format:** A dedicated section for each sub-topic, clearly titled (e.g., `### Sub-Topic: [Concept Name]`).

**Phase 3: Recursive Gap Analysis & Expansion.**
*   **Objective:** Challenge the existing knowledge base and drill down into uncertainty.
*   **Pre-Check:** Read state file, review all findings from Phases 1 & 2
*   **Action:**
    1.  **Critique:** Review Phases 1 & 2. Articulate 2-3 specific areas where knowledge feels thin, contradictory, or unexplored.
    2.  **Generate:** For each identified gap, generate 2 highly focused, unanswered follow-up questions.
    3.  **Recurse:** Research the precise answers to these 6 questions, integrating the findings seamlessly into the existing structure.
*   **State Update:** Document each gap under "Phase 3: Gap Analysis" with `gap_description`, `follow_up_questions`, set `resolved: true` after research, add `findings`. Set `phase_3_complete: true`
*   **Output Format:** A section titled "Phase 3: Gap Analysis & Expansion," detailing the critique, the gaps, and the new findings.

**🛑 STOPPING CRITERIA (The Guardrail):**
Halt research when Phase 3 is complete AND one of these conditions is met:
(A) All gaps have been addressed with sufficient depth (no obvious weak spots remain).
(B) Your self-critique determines that the next logical step will only yield minor, redundant detail (i.e., incremental knowledge vs. breakthrough knowledge).

**State Finalization:** Upon meeting stopping criteria:
1. Set `status: "completed"` and `stopping_criteria_met: "A"` or `"B"`
2. Update `last_updated` timestamp
3. Create checkpoint copy: `STATE_YYYYMMDD_HHMMSS.md`
4. Archive original state file for future reference

**✍️ FINAL DELIVERABLE (Report Synthesis):**
Once the criteria are met, generate the final report in strict Markdown format:

# 📊 ANALYTICAL REPORT: $TOPIC
---
**Executive Summary:** (Max 3 paragraphs. Must summarize *the journey* before summarizing *the findings*.)
**Methodology:** (Detail the 3-phase process, noting the stopping criteria used.)
**Detailed Findings:** (A consolidated, structured presentation of all data from Phases 1, 2, & 3—this is the bulk of the content.)
**Conclusion:** (A definitive, high-impact statement answering the core need for $TOPIC.)
**Future Work & Recommendations:** (Propose 3 actionable, concrete next steps for a human researcher.)
---
## WHEN TO USE ME
Use this skill when the task demands not just *information retrieval*, but *cognitive construction*. Use it for complex whitepapers, comprehensive competitive analyses, or deep technical due diligence.

## 📚 USAGE EXAMPLES

### Starting Fresh Research
```
Research "quantum error correction methods"
```
Skill initializes new state file, begins Phase 1.

### Resuming Interrupted Research
```
Continue research
```
Skill reads state file, displays "Resuming research on quantum error correction from Phase 2", continues from checkpoint.

### Checking Progress
```
What's the research status?
```
Skill reads state file, displays:
- Current phase and completion status
- Sub-topics identified
- Gaps discovered
- Next actions required

### Pausing and Resuming Later
State persists automatically. Next session automatically resumes from last phase.

### Cross-Session Research
Research can span days/weeks. State file ensures:
- No duplicate work across sessions
- All findings preserved through context compaction
- Seamless continuation from any interruption point