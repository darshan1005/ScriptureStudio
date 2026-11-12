# Scripture Studio — Cloud Synchronization & Remote Control API Contracts

**Document Version:** 1.0.0  
**Status:** Approved for Architecture Review (Milestone M0)  
**Backend Framework:** ASP.NET Core 9 Web API + WebSockets  
**Deployment Scope:** Optional Cloud Service & Local LAN Remote Controller (Milestone M9)  

---

## 1. Overview & Offline Independence Principle

Cloud synchronization and remote control are **optional extensions** designed to augment Scripture Studio without ever creating a runtime dependency for local desktop presentations.
1. The desktop application is 100% operational when running completely offline.
2. The local mobile remote operates via a lightweight embedded WebSocket server in the Electron main process, requiring only a local church Wi-Fi connection without internet access.
3. The ASP.NET Core cloud API enables pastors and media teams to sync sermon programs, custom themes, and user preferences across multiple machines (e.g., pastor's office laptop and sanctuary projection PC).

---

## 2. Local LAN Remote Control Protocol (Embedded WebSocket)

The desktop application hosts an authenticated local WebSocket server on `ws://127.0.0.1:4820` (or local LAN IP) protected by a PIN code displayed in the Control Studio settings.

### 2.1 Handshake & Authentication
```json
// Client -> Server: Auth request
{
  "action": "AUTH",
  "pin": "7482"
}

// Server -> Client: Auth response
{
  "status": "AUTHENTICATED",
  "serverVersion": "1.0.0",
  "currentState": {
    "reference": "Romans 8:28",
    "version": "KJV",
    "isLive": true,
    "isFrozen": false
  }
}
```

### 2.2 Remote Commands
```json
// Client -> Server: Next verse
{ "action": "NEXT_SLIDE" }

// Client -> Server: Previous verse
{ "action": "PREV_SLIDE" }

// Client -> Server: Jump to specific reference
{
  "action": "JUMP_REFERENCE",
  "reference": "John 3:16",
  "versionId": "kjv",
  "immediateLive": true
}

// Client -> Server: Toggle Freeze
{ "action": "TOGGLE_FREEZE" }
```

---

## 3. ASP.NET Core Cloud Sync Endpoints (REST API)

### 3.1 Authentication
* `POST /api/v1/auth/login`
  - Request: `{ "email": "media@church.org", "password": "..." }`
  - Response: `{ "token": "jwt_bearer_token", "expiresIn": 86400 }`

### 3.2 Program Synchronization
* `GET /api/v1/programs`
  - Retrieves all synced sermon programs for the church organization.
* `POST /api/v1/programs/sync`
  - Syncs local programs to the cloud using timestamped conflict resolution (Last-Write-Wins with explicit branch protection).
  - Request Payload:
    ```json
    {
      "programs": [
        {
          "id": "prog-uuid-1",
          "name": "Sunday Morning - Oct 25",
          "updatedAt": "2026-10-25T08:30:00Z",
          "items": [
            {
              "position": 0,
              "itemType": "SCRIPTURE",
              "reference": {
                "bookId": "rom",
                "chapter": 8,
                "verse": 28
              }
            }
          ]
        }
      ]
    }
    ```

### 3.3 Theme Synchronization
* `GET /api/v1/themes`
  - Lists organization theme templates.
* `POST /api/v1/themes/upload`
  - Uploads a custom theme package including serialized typography rules and background asset identifiers.

