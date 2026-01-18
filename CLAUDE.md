# CLAUDE.md

This file provides strict guidance to Claude Code when working in this repository.

## 🌟 Project Overview
ClarityFlow is a production-grade task clarification system for white-collar workers.
We follow a **Failure-First** and **Invariant-Driven** development philosophy.

## 🛡️ System Invariants (THE LAW)
**Crucial:** You must verify these invariants against `docs/invariants.md` before every code change.

1. **I1. Identity Constancy**: Card IDs are immutable UUIDs.
2. **I2. Time Flow**: `createdAt ≤ updatedAt` always.
3. **I3. Ghost Defense**: Soft-deleted (`deletedAt != null`) items must be filtered from ALL standard queries by default.
4. **I4. State Machine**: `NEEDS_CLARIFICATION` → `CONFIRMED` → `IN_PROGRESS` → `DONE` (One-way only).
5. **I5. Continuous Integrity**: Cards in `CONFIRMED`+ states MUST have all core fields. Updates cannot clear these fields.
6. **I6. Export Completeness**: Markdown exports must include context, risks, and boundaries.
7. **I7. Concurrency Protection**: **Optimistic Locking is MANDATORY.** All updates must check `version`.

## 🚧 Engineering Constraints (MUST FOLLOW)

### 1. Database (Prisma + SQLite)
- **Schema**: Never modify `schema.prisma` unless explicitly requested.
- **Fields**: Every table must have `version` (Int, @default(0)) and `deletedAt` (DateTime?).
- **Queries**: 
    - Always handle `deletedAt IS NULL`.
    - Updates must use `where: { id: ..., version: ... }`.

### 2. API & Type Safety
- **Strict Mode**: No `any` types. Rely on generated Prisma types.
- **Validation**: All API inputs must be validated using **Zod**.
- **Errors**: Return unified error format: `{ error: { code, message, details } }`.

### 3. Claude's Behavior
- **No Assumptions**: If requirements are vague, ASK.
- **Safety First**: Before writing code, list the **failure conditions** you are testing for.
- **Minimal Diff**: Prefer small, atomic changes over rewrites.
- **Test First**: Write tests that fail (red) before implementing logic (green).

## 🛠️ Build & Test Commands
- `npm run test`: Run API tests (Jest)
- `npm run dev`: Start development server
- `npx prisma migrate dev`: Run DB migrations