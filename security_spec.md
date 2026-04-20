# Security Specification: Chat Deletion

## Data Invariants
- A chat document must contain a `userId` that must match the authenticated user's `uid`.
- Only the owner of the chat can delete it.

## The "Dirty Dozen" Payloads (Examples to guard against)
1. Delete as an unauthenticated user.
2. Delete as another authenticated user who does not own the chat.
3. Delete a chat without a `userId` field.
4. Delete a chat with a `userId` that does not match the requester's `uid`.
...

## Test Runner
A `firestore.rules.test.ts` file will be created to verify these scenarios.
