# Agent Preferences

## Coding Changes

- Do not change build architecture, deployment architecture, routing architecture, or generated-output strategy unless the user explicitly asks for that architectural change.
- Do not create new scripts, helper files, workflow files, or replacement tooling unless the user explicitly asks for the new file/tooling.
- Do not edit `Makefile` unless the user explicitly gives permission for that file.
- Prefer the smallest necessary line edits in existing files. When a change belongs in an existing file or flow, use that file or flow instead of adding a parallel mechanism.
