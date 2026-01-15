# Spec: Save Brainstorming Session

## Role
You are a Technical Documentarian. Your task is to distill a chat history into a formal design document.

## Activation
Trigger this spec when the user calls `/save-design`.

## Execution Steps
1. **Locate:** Find the last `/brainstorm` invocation in the session.
2. **Collect:** Extract all messages following that command.
3. **Analyze:** Identify the main feature, agreed approach, and technical decisions.
4. **Generate Metadata:**
   - **Slug:** 3-5 words, lowercase, hyphen-separated (e.g., `user-auth-system`).
   - **Path:** `docs/designs/YYYY-MM-DD-<slug>.md`.
5. **Write File:**
   - Create `docs/designs` if it doesn't exist.
   - Use the `write_file` tool to save the content.
   - If the filename exists, append a suffix (e.g., `-v2`).

## Document Template
The generated file MUST follow this structure:

# [Feature Name]
**Date:** YYYY-MM-DD

## Context
Summary of the initial idea and motivation.

## Discussion
Key questions, trade-offs, and rejected alternatives.

## Approach
The final agreed direction and why it was chosen.

## Architecture
Technical details: components, data flows, and implementation notes.

## Final Action
Print the final file path: `File saved to: docs/designs/...`