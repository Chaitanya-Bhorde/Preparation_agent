# Coding Practice Module - Implementation Checklist

## Phase 1: Problem Model Enhancement + Seed Data
- [x] Enhance Problem model with starterCode, category fields
- [x] Generate 15-20 full seed problems with per-language boilerplate for all 5 languages (C++, Java, Python, JavaScript, C)
- [x] Add SQL category to problem model

## Phase 2: Backend Enhancements
- [x] Update problem controller to return user submission status per problem
- [x] Add endpoint for user problem status mapping
- [x] Update submission routes/controller for C language support
- [x] Add SQL problem support

## Phase 3: Problem List UI Overhaul
- [x] Redesign with table columns: Title, Difficulty (color tags), Tags, Acceptance %, Status icons
- [x] Add solved/attempted/unsolved status per problem
- [x] Filter by difficulty, tags, solved status
- [x] Pagination

## Phase 4: Problem Detail UI + Monaco Integration
- [x] Tabbed view: Description, Submissions, Solutions
- [x] Monaco Editor with all 5 languages
- [x] Per-problem starter code that changes per language
- [x] Run/Submit buttons with pass/fail display
- [x] Runtime and memory display

## Phase 5: SQL Runner
- [x] SQL problem schema handling
- [x] In-browser SQL runner using sql.js
- [x] SQL-specific UI components

## Phase 6: Progress Tracking & Recommendation Tie-in
- [x] Per-user solved/attempted status tracking
- [x] Feed into recommendation engine weak-tag detection
- [ ] Wire up solved status in problem list API