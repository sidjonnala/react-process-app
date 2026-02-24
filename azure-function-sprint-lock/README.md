# Azure Function: Sprint Lock (revertSprintChange)

An Azure Function (v4 programming model) that enforces sprint lock rules in Azure DevOps. When a work item is moved to an iteration that has already started, the function automatically reverts the change and adds a comment explaining why — unless the user is on the Engineering Manager override list.

---

## How It Works

```
ADO Service Hook
      │
      ▼
POST /api/revertSprintChange
      │
      ├─ Project allowed?          ──No──► Return 200 (ignored)
      │
      ├─ Is an iteration change?   ──No──► Return 200 (nothing to do)
      │
      ├─ User in override list?    ──Yes─► Allow + add EM override comment
      │
      ├─ Fetch sprint start date
      │
      ├─ Sprint already started?   ──No──► Allow + log
      │
      └─ Sprint started            ──Yes─► Revert iteration + add history comment
```

---

## Project Structure

```
azure-function-sprint-lock/
├── src/
│   └── functions/
│       └── revertSprintChange.js   # Azure Function (v4 model) — all logic here
├── package.json
├── local.settings.json.example     # Copy to local.settings.json for local dev
└── README.md
```

---

## Prerequisites

- Node.js 18+
- [Azure Functions Core Tools v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local)

```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

---

## Environment Variables

### Required

| Variable      | Description                                              | Example                              |
|---------------|----------------------------------------------------------|--------------------------------------|
| `ADO_ORG`     | Azure DevOps organization base URL                       | `https://dev.azure.com/myorg`        |
| `ADO_PROJECT` | Default project name (used if OPTIONAL_ALLOWED_PROJECTS not set) | `MyProject`             |
| `ADO_PAT`     | Personal Access Token — needs Work Items Read + Write    | `abc123...`                          |

### Optional

| Variable                    | Description                                                        | Default          |
|-----------------------------|--------------------------------------------------------------------|------------------|
| `OPTIONAL_ALLOWED_PROJECTS` | Comma-separated list of project names allowed to trigger the lock  | Value of `ADO_PROJECT` |
| `ADO_OVERRIDE_USERS`        | Comma-separated user emails / IDs that bypass the sprint lock      | _(none)_         |

---

## Running Locally

1. **Install dependencies**

```bash
cd azure-function-sprint-lock
npm install
```

2. **Create your local settings file**

```bash
cp local.settings.json.example local.settings.json
```

Edit `local.settings.json` and fill in your values:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "ADO_ORG": "https://dev.azure.com/your-org",
    "ADO_PROJECT": "YourProjectName",
    "ADO_PAT": "your-pat-here",
    "OPTIONAL_ALLOWED_PROJECTS": "YourProjectName",
    "ADO_OVERRIDE_USERS": "em@company.com"
  }
}
```

3. **Start the function host**

```bash
npm start
```

The function will be available at:
```
POST http://localhost:7071/api/revertSprintChange
```

---

## Testing Locally with Sample Payloads

### Test 1 — Sprint already started, regular user (should revert)

```bash
curl -X POST http://localhost:7071/api/revertSprintChange \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "workitem.updated",
    "resourceContainers": {
      "project": { "name": "YourProjectName" }
    },
    "resource": {
      "workItemId": 42,
      "revisedBy": {
        "displayName": "Jane Smith",
        "uniqueName": "jane.smith@company.com"
      },
      "revision": {
        "fields": {
          "System.IterationPath": "YourProjectName\\Sprint 2",
          "System.ChangedDate": "2026-02-24T18:00:00Z"
        }
      }
    }
  }'
```

**Expected response:**
```json
{ "message": "Webhook received - sprint started, iteration change reverted", "action": "REVERTED" }
```

---

### Test 2 — EM override user (should allow)

```bash
curl -X POST http://localhost:7071/api/revertSprintChange \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "workitem.updated",
    "resourceContainers": {
      "project": { "name": "YourProjectName" }
    },
    "resource": {
      "workItemId": 42,
      "revisedBy": {
        "displayName": "Engineering Manager",
        "uniqueName": "em@company.com"
      },
      "revision": {
        "fields": {
          "System.IterationPath": "YourProjectName\\Sprint 2"
        }
      }
    }
  }'
```

**Expected response:**
```json
{ "message": "Webhook received - override user, change allowed", "action": "ALLOWED", "reason": "EM override" }
```

---

### Test 3 — Ignored project

```bash
curl -X POST http://localhost:7071/api/revertSprintChange \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "workitem.updated",
    "resourceContainers": {
      "project": { "name": "UnrelatedProject" }
    },
    "resource": { "workItemId": 99 }
  }'
```

**Expected response:**
```json
{ "message": "Webhook received - project not in allowed list" }
```

---

## Project Restriction Logic

Set `OPTIONAL_ALLOWED_PROJECTS` to a comma-separated list of project names:

```
OPTIONAL_ALLOWED_PROJECTS=TeamAlpha,TeamBeta
```

- Events from any **other** project are ignored immediately — the function returns `200` without processing.
- If `OPTIONAL_ALLOWED_PROJECTS` is not set, only `ADO_PROJECT` is allowed by default.
- Project name matching is **case-insensitive**.

---

## EM Whitelist Override

Set `ADO_OVERRIDE_USERS` to a comma-separated list of Azure DevOps unique names (emails) or display names:

```
ADO_OVERRIDE_USERS=em@company.com,scrummaster@company.com
```

When a whitelisted user moves a work item into a started sprint:
- The change is **NOT reverted**
- A history comment is added: _"Sprint change allowed due to EM override."_
- The function logs: `Override allowed for whitelisted user`

Matching is **case-insensitive** against the `uniqueName` field (email) in the ADO payload.

---

## Log Output Structure

All logs are emitted as structured JSON for easy filtering in Application Insights or local console:

```json
{ "timestamp": "...", "label": "DECISION", "message": "Sprint HAS started - reverting", "data": { ... } }
```

Key log labels:

| Label                  | Meaning                                                       |
|------------------------|---------------------------------------------------------------|
| `WEBHOOK_RECEIVED`     | Incoming request parsed                                       |
| `PROJECT_VALIDATION`   | Project allowlist check                                       |
| `PROJECT_IGNORED`      | Event ignored - project not in allowed list                   |
| `PROJECT_ALLOWED`      | Project passed validation                                     |
| `NO_ITERATION_CHANGE`  | Webhook had no iteration path change                          |
| `ITERATION_CHANGE_DETECTED` | An iteration change was found in payload                 |
| `EXTRACTED_DATA`       | Summary of parsed work item details                           |
| `WHITELIST_CHECK`      | Override user list check                                      |
| `OVERRIDE_ALLOWED`     | EM override user detected, change allowed                     |
| `SPRINT_EVALUATION`    | Fetching iteration classification node from ADO               |
| `SPRINT_START_DATE`    | Sprint start date retrieved                                   |
| `SPRINT_DECISION`      | Whether sprint has started (true/false)                       |
| `DECISION`             | Final allow or revert decision                                |
| `REVERT_SUCCESS`       | Work item successfully reverted                               |
| `REVERT_FAILED`        | ADO API revert call failed (logged, not crashed)              |

---

## Deploying to Azure

### 1. Login to Azure

```bash
az login
```

### 2. Create Azure resources (first time only)

```bash
az group create --name sprint-lock-rg --location eastus

az storage account create \
  --name sprintlockstorage \
  --resource-group sprint-lock-rg \
  --sku Standard_LRS

az functionapp create \
  --resource-group sprint-lock-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name ado-sprint-lock \
  --storage-account sprintlockstorage \
  --os-type Linux
```

### 3. Set environment variables

```bash
az functionapp config appsettings set \
  --name ado-sprint-lock \
  --resource-group sprint-lock-rg \
  --settings \
    ADO_ORG="https://dev.azure.com/your-org" \
    ADO_PROJECT="YourProjectName" \
    ADO_PAT="your-pat-here" \
    OPTIONAL_ALLOWED_PROJECTS="YourProjectName" \
    ADO_OVERRIDE_USERS="em@company.com"
```

### 4. Deploy using Core Tools

```bash
func azure functionapp publish ado-sprint-lock
```

### 5. Get your function URL

```bash
az functionapp function show \
  --name ado-sprint-lock \
  --resource-group sprint-lock-rg \
  --function-name revertSprintChange \
  --query "invokeUrlTemplate"
```

Use this URL in your Azure DevOps Service Hook configuration.

---

## Azure DevOps Service Hook Configuration

1. Go to **Project Settings → Service hooks → + Create subscription**
2. Select **Web Hooks**
3. Event: **Work item updated**
4. Field filter: `System.IterationPath`
5. URL: `https://<your-function-app>.azurewebsites.net/api/revertSprintChange`
6. Click **Test** then **Finish**

---

## Getting a PAT

1. Go to `https://dev.azure.com/{your-org}/_usersSettings/tokens`
2. **New Token** → name it `sprint-lock-function`
3. Scopes needed:
   - ✅ **Work Items – Read**
   - ✅ **Work Items – Write**
4. Copy the token into `ADO_PAT`
