tags: [config-management, settings, administration]
role: [developer, ops, admin]

# Config Management

Centralized application settings stored in MongoDB, with environment variable defaults.

## Overview

The Config feature provides a CRUD interface for application configuration settings. All settings are stored as key-value pairs in the `Config` model with categories for organization. On first startup, a seed script populates the database from environment variables. The reset endpoint can restore all settings to their env-derived values.

**Base path:** `/api/config`

## Config Model

```
+---------------------------+
| Config                    |
+---------------------------+
| _id        ObjectId       |
| key        String (uniq)  |
| value      String         |
| category   Enum           |
| created_at Date           |
| updated_at Date           |
+---------------------------+

Categories: server, database, auth, llama, tts, matrix, session, logging
```

The `key` field is unique across all documents. The `value` is always stored as a string regardless of the original type.

## Seed Script

Run `npm run seed-admin` to initialize the Config collection from environment variables. This script:

1. Connects to MongoDB
2. Checks if any Config documents already exist (skips if seeded)
3. Creates one document per env-derived setting using `Config.insertMany()`
4. Prints masked values for sensitive keys (`MONGODB_URI`, `JWT_SECRET`)

**Source:** `src/scripts/seedConfig.js`

### Seeded Settings

| Key | Category | Source |
|---|---|---|
| `PORT` | server | `config.port` |
| `NODE_ENV` | server | `config.env` |
| `FRONTEND_URL` | server | `process.env.FRONTEND_URL` |
| `MONGODB_URI` | database | `config.mongodb.uri` |
| `JWT_SECRET` | auth | `config.jwt.secret` |
| `JWT_EXPIRES_IN` | auth | `config.jwt.expiresin` |
| `LLAMA_SERVER_URL` | llama | `config.llama.url` |
| `LLAMA_TIMEOUT` | llama | `config.llama.timeout` |
| `TTS_SERVER_URL` | tts | `config.tts.serverUrl` |
| `TTS_TIMEOUT` | tts | `config.tts.timeout` |
| `TTS_DEFAULT_SPEAKER` | tts | `config.tts.speaker` |
| `TTS_DEFAULT_LANGUAGE` | tts | `config.tts.language` |
| `MATRIX_HOMESERVER` | matrix | `config.matrix.homeserver` |
| `MATRIX_USER_ID` | matrix | `config.matrix.userId` |
| `SESSION_TIMEOUT` | session | `config.sessionTimeout` |
| `MAX_FILE_SIZE` | session | `config.maxFileSize` |
| `MAX_TOOL_TURNS` | session | `config.session.maxToolTurns` (default 10) |
| `LOG_LEVEL` | logging | `process.env.LOG_LEVEL` (default "info") |
| `LOG_FORMAT` | logging | `process.env.LOG_FORMAT` (default "combined") |

## API Endpoints

### Get All Settings

```
GET /api/config
Authorization: Bearer <token>
Role: admin required
```

**Response:** Sorted by category, then key.

```json
{
  "success": true,
  "data": [
    { "_id": "...", "key": "PORT", "value": "3000", "category": "server" },
    ...
  ]
}
```

### Get Single Setting

```
GET /api/config/:key
Authorization: Bearer <token>
```

Returns the setting matching `:key`. No admin role required.

**Response:**

```json
{
  "success": true,
  "data": { "_id": "...", "key": "PORT", "value": "3000", "category": "server" }
}
```

| Status | Condition |
|---|---|
| 404 | Setting key not found |

### Update Setting

```
PATCH /api/config/:key
Authorization: Bearer <token>
Role: admin required
Content-Type: application/json
```

**Request body:**

```json
{ "value": "new_value" }
```

Setting value is always converted to a string. If the key does not exist but other settings do, a new document is created with category `"server"`. If no settings exist at all (not seeded), returns 400.

**Response:** Updated Config document.

| Status | Condition |
|---|---|
| 400 | Value missing/null, or settings not initialized |
| 409 | Duplicate key (MongoDB error 11000) |

### Reset to Environment Defaults

```
GET /api/config/reset
Authorization: Bearer <token>
Role: admin required
```

Compares all current Config documents against environment-derived defaults. Updates changed values and creates missing entries. Returns counts of updated and created documents.

**Response:**

```json
{
  "success": true,
  "data": { "updated": 3, "created": 1 }
}
```

## Update Flow

```
PATCH /api/config/:key
        |
        v
+---------------------+
| Validate: value     |
|   present & non-null|
+---------------------+
        |
        v
+---------------------+     yes    +-------------------+
| Config exists?      | --------> | Update value, save  |
+---------------------+           +-------------------+
        | no
        v
+---------------------------+
| Other settings exist?     |
| (seeded?)                 |
+---------------------------+
        | yes                    | no
        v                        v
  Create new doc             400 Not
  category="server"          Initialized
```

## Config Key-Value Schema

```
+--------------------------------------------------+
|  Config Collection                               |
|                                                  |
|  +-------+---+-----------+--------+------+      |
|  | key   | v | category  | ...    | ...  |      |
|  +-------+---+-----------+--------+------+      |
|  | PORT  |3k | server    |        |      |      |
|  | NODE_ |de | server    |        |      |      |
|  | ENV   |v  |           |        |      |      |
|  +-------+---+-----------+--------+------+      |
|  | JWT_S |se  | auth      |        |      |      |
|  | ECRET |c  |           |        |      |      |
|  +-------+---+-----------+--------+------+      |
|  | LLAMA_|ur | llama     |        |      |      |
|  | URL   |l  |           |        |      |      |
|  +-------+---+-----------+--------+------+      |
|  | TTS_S |ur | tts       |        |      |      |
|  | ERVER_|l  |           |        |      |      |
|  | URL   |r  |           |        |      |      |
|  +-------+---+-----------+--------+------+      |
|  | ...   |...| ...       | ...    | ...  |      |
|  +-------+---+-----------+--------+------+      |
+--------------------------------------------------+

All values stored as strings. Categories used for grouping in UI and filtering.
```

## Usage in Code

Services read from the Config model at runtime rather than hardcoding values:

- **ChatService** reads `MAX_TOOL_TURNS` from Config to limit tool invocation rounds
- **LlamaService** reads TTS settings via `config.tts.serverUrl` for external service URL
- **ConfigController** and **seedConfig.js** use the same internal `getEnvConfig()` function

## Related Pages

- [TTS Configuration](./audio-generation.md) — TTS-specific config keys
- [Setup Guide](../technical/setup.md) — initial database seeding
- [API Reference](../api/config-api.md)
