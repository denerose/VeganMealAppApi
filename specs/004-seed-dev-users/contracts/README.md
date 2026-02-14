# Contracts: Seed Dev Users (004-seed-dev-users)

**Feature**: 004-seed-dev-users  
**Date**: 2025-02-15

## No new API contracts

This feature adds **seed data only** (3 dev users). It does not introduce new REST endpoints, request/response shapes, or OpenAPI changes.

Existing auth endpoints (e.g. login, register) and their contracts remain unchanged. Seed dev users are consumed by signing in with the documented credentials; no new API surface is required.

If the project maintains a central OpenAPI spec (e.g. `openapi.yaml` at repo root), no updates are needed for this feature.
