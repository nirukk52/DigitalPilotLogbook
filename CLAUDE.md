# Project Guidelines

## Authentication
- `getSessionUserId()` from `lib/session.ts` is the single source of truth for user identity - use it in all API routes, even after implementing login functionality.
