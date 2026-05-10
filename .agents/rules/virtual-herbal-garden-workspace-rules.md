---
trigger: always_on
---

# Workspace Rules — Virtual Herbal Garden

## Project Context
- Full-stack medicinal plant platform
- Frontend: React + TypeScript, feature-based under frontend/src/features/
- Backend: Node.js + Express + TypeScript, module-based under backend/src/modules/
- Database: MongoDB with Mongoose
- Auth: JWT + Google OAuth (always assigns USER role by default)
- Real-time: Socket.io
- Testing: Jest + Vitest

## Structure Rules
- Always follow existing folder structure and naming conventions exactly
- Match how existing features are implemented — do not invent new patterns
- Backend modules follow: controller / service / routes / types / validators
- Frontend features follow: pages / components / hooks / api / index.ts barrel

## Non-Negotiable Rules
- Never break any working feature — auth, plants, tours, remedies, 3D garden, AI scanner, dashboard, notifications must always remain functional
- Google OAuth login must always assign USER role by default same as regular registration
- Do not redo any task already listed as complete in PREVIOUS_TASKS.md
- Do not assume any requirement not written in PRD.md — ask first
- Always reference @AGENT_RULES.md for the full rule set
- Always reference @PRD.md for all feature requirements
- Always reference @TASK_LIST.md for current phase and tasks
- Always reference @PREVIOUS_TASKS.md before starting to avoid redoing work

## RBAC — 5 Role Hierarchy
- GUEST (0) → USER (1) → BOTANIST (2) → ADMIN (3) → SUPER_ADMIN (4)
- Higher roles inherit all permissions of roles below
- requireRole middleware must enforce this hierarchy on every protected route