# Firestore Security Specification - Generation Genius

## 1. Data Invariants
- **AccessKeys:** A user can only have one access key document (keyed by their UID). 
- **Quota Protection:** Users cannot reset their own `usageCount` to 0 after it's been set (except by reaching a new day, which the client triggers by checking `lastResetDate`).
- **Identity Integrity:** Every document (`chats`, `accessKeys`) must have a `userId` field that strictly matches the authenticated user's UID.

## 2. The Dirty Dozen (Attack Payloads)
1. **AccessKey Hijack:** User A tries to create an access key with User B's UID in `userId`.
2. **AccessKey Shadow Field:** User A tries to add `isAdmin: true` to their access key.
3. **Usage Count Reset:** User A tries to update `usageCount` to `0` mid-day.
4. **Chat Spoofing:** User A tries to read User B's chat history.
5. **ID Poisoning:** User A tries to use a 2MB string as a `chatId`.
6. **Immutable Field Break:** User A tries to change the `userId` of an existing chat.
7. **Blanket Query Scraping:** User A tries to list ALL chats in the collection without a `userId` filter.
8. **Unverified Account Write:** User with `email_verified: false` tries to create an access key.
9. **Timestamp Spoofing:** User tries to set `createdAt` to a date in the future.
10. **Orphaned Chat:** User tries to create a chat with a `projectId` that doesn't exist (if applicable, currently n/a).
11. **Shadow Update Gate:** User tries to update `usageCount` using a `PATCH` that bypasses other logic.
12. **PII Leak:** An authenticated user tries to read the `users` collection to scrape emails.

## 3. Test Cases (Summary)
- [FAIL] create accessKey where `data.userId != request.auth.uid`
- [FAIL] update accessKey where `request.resource.data.keys().size() > existing().keys().size()` (if adding new fields)
- [FAIL] read chat where `resource.data.userId != request.auth.uid`
- [PASS] create accessKey with valid schema and ownership
- [PASS] update usageCount if `userId` remains immutable
