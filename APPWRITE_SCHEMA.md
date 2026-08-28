# Phour Appwrite schema

Create one database, then create the following collections using the IDs from `.env.local`. Keep every collection private: Phour accesses Appwrite only from server route handlers using a scoped server API key.

Every collection has `userId` (string, required, indexed). Appwrite also supplies `$id`, `$createdAt`, and `$updatedAt`; Phour exposes those as the document id, createdAt, and updatedAt application fields.

| Collection | Required attributes | Recommended indexes |
| --- | --- | --- |
| users | userId, displayName, email | userId unique |
| projects | userId, name, description, color, icon, archived | userId, archived |
| tasks | userId, title, description, completed, archived, priority, dueDate, dueTime, projectId, categoryId, tagIds (string array), estimatedDuration, completedAt, notes | userId, completed, archived, dueDate, projectId |
| subtasks | userId, taskId, title, completed, position | userId, taskId |
| tags | userId, name, color | userId, name |
| categories | userId, name, color | userId, name |
| focus_sessions | userId, duration, completed, startedAt, endedAt | userId, startedAt |
| habits | userId, title, frequency, streak, completedDates (string array) | userId |
| settings | userId, theme, timezone, preferences (JSON string) | userId unique |
| activity_log | userId, action, entity, entityId, timestamp | userId, timestamp |

For optional strings, set a safe default (usually an empty string) in Appwrite. Keep the API key server-only and grant it only the database scopes it needs. The server repositories enforce Clerk ownership independently of Appwrite permissions, so user ID checks never rely on a browser-provided value.
