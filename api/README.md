# Azure DevOps Webhook API

A production-ready Node.js webhook API for receiving Azure DevOps Service Hooks. This API detects iteration (sprint) changes on work items, validates if the target iteration has started, and automatically reverts changes when users try to add items to active sprints.

## Features

- ✅ Express-based REST API
- ✅ Webhook endpoint for ADO Service Hooks
- ✅ Parses work item iteration changes
- ✅ **Automatically fetches old iteration path from ADO API** (when not provided in webhook)
- ✅ **Validates if target iteration has started**
- ✅ **Automatically reverts work items moved to started iterations**
- ✅ **Board Manager bypass** - Designated users can add items to started iterations
- ✅ **Adds informative comments to work items explaining the reversion**
- ✅ Optional token-based security
- ✅ Request logging middleware
- ✅ Modular, cloud-ready architecture
- ✅ Environment variable configuration

## How It Works

1. **Webhook receives iteration change** - Azure DevOps sends a webhook when a work item's iteration is changed
2. **Check if user is board manager** - Verify if the user making the change is in the board managers list
3. **Validate iteration status** - API checks if the target iteration has already started
4. **Board manager bypass** - If user is a board manager, allow the change even if iteration has started
5. **Auto-revert if started** - If the iteration has started and user is NOT a board manager, the work item is automatically moved back to its previous iteration
6. **Notify user** - A comment is added to the work item explaining why the change was reverted and who to contact

This prevents regular users from adding work items to sprints that have already started, while allowing board managers to make necessary adjustments.

## Project Structure

```
api/
├── server.js                    # Entry point - Express server setup
├── routes/
│   └── webhook.js               # Webhook route handler with validation logic
├── services/
│   ├── adoParser.js             # Azure DevOps payload parser
│   ├── adoApiClient.js          # Azure DevOps REST API client
│   ├── iterationValidator.js    # Iteration validation and revert logic
│   └── boardManagerService.js   # Board manager authorization
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Example environment configuration
└── README.md                    # This file
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Azure DevOps organization access (for webhook setup)

## Installation

1. Navigate to the api directory:
```bash
cd api
```

2. Dependencies should already be installed in the parent project. If not:
```bash
npm install express dotenv body-parser
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your configuration:
```env
PORT=3000
NODE_ENV=development
WEBHOOK_SECRET=your-secret-token-here  # Optional but recommended

# Required for validation and auto-revert functionality
ADO_PAT=your-azure-devops-pat-here     # Get from https://dev.azure.com/{org}/_usersSettings/tokens
BOARD_MANAGER_EMAIL=boardmanager@company.com  # Who to contact for sprint changes

# Board Managers - Users who can bypass sprint protection
BOARD_MANAGERS=boardmanager@company.com,scrum.master@company.com
```

### Configuring Board Managers

**Board managers** are users who can add work items to started iterations without being blocked. This is useful for Scrum Masters or project leads who need to make adjustments to active sprints.

To configure board managers, set the `BOARD_MANAGERS` environment variable with a comma-separated list of user identifiers:

```env
BOARD_MANAGERS=sidharth@patagoniahealth.net,Sidharth Jonnala,jane.doe@company.com
```

**Important:** The system checks against multiple user identifiers from Azure DevOps:
- Display Name (e.g., "Sidharth Jonnala")
- Unique Name / Email (e.g., "sidharth@patagoniahealth.net")
- Email address

The comparison is **case-insensitive**, so these all match:
- `sidharth@patagoniahealth.net`
- `SIDHARTH@PATAGONIAHEALTH.NET`
- `Sidharth@PatagoniaHealth.net`

### Getting an Azure DevOps Personal Access Token (PAT)

**Important:** Azure DevOps webhooks do NOT include the old iteration path value. To get the old value and enable auto-revert functionality, the API needs to make calls to the ADO REST API.

To enable this feature:

1. Go to https://dev.azure.com/{your-org}/_usersSettings/tokens
2. Click "New Token"
3. Give it a name (e.g., "Webhook API - Sprint Protection")
4. Set expiration as needed
5. **Select scopes:** 
   - ✅ Work Items (Read) - to fetch previous iteration
   - ✅ Work Items (Write) - to revert changes and add comments
6. Click "Create"
7. Copy the token and add it to your `.env` file as `ADO_PAT`

### Configuration Impact

| Configuration | Behavior |
|--------------|----------|
| **No ADO_PAT** | Only logs changes, no validation or reversion |
| **With ADO_PAT** | Validates iterations and auto-reverts changes to started sprints |
| **With BOARD_MANAGERS** | Listed users can add items to started iterations (bypass protection) |
| **With BOARD_MANAGER_EMAIL** | Users are directed to contact this person in reversion notices |

## Running Locally

### Option 1: Direct Node execution
```bash
node server.js
```

### Option 2: Using npm script
Add to your `package.json`:
```json
"scripts": {
  "start:api": "node api/server.js",
  "dev:api": "node --watch api/server.js"
}
```

Then run:
```bash
npm run start:api
```

The server will start on `http://localhost:3000` (or your configured PORT).

## Testing Locally

### Test with curl

**Without webhook token:**
```bash
curl -X POST http://localhost:3000/api/revertSprintChange \
  -H "Content-Type: application/json" \
  -d "{\"resource\":{\"workItemId\":12345,\"fields\":{\"System.IterationPath\":\"Project\\Sprint 2\"},\"revisedBy\":{\"displayName\":\"John Doe\"}},\"message\":{\"text\":\"Work item updated by John Doe\"}}"
```

**With webhook token (if WEBHOOK_SECRET is set):**
```bash
curl -X POST http://localhost:3000/api/revertSprintChange \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: your-secret-token-here" \
  -d "{\"resource\":{\"workItemId\":12345,\"fields\":{\"System.IterationPath\":\"Project\\Sprint 2\"},\"revisedBy\":{\"displayName\":\"John Doe\"}},\"message\":{\"text\":\"Work item updated by John Doe\"}}"
```

### Test with sample Azure DevOps payload

```bash
curl -X POST http://localhost:3000/api/revertSprintChange \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: your-secret-token-here" \
  -d @sample-payload.json
```

Create `sample-payload.json`:
```json
{
  "subscriptionId": "00000000-0000-0000-0000-000000000000",
  "notificationId": 1,
  "id": "00000000-0000-0000-0000-000000000000",
  "eventType": "workitem.updated",
  "publisherId": "tfs",
  "message": {
    "text": "Bug #12345 (Sprint Change) updated by John Doe"
  },
  "resource": {
    "id": 12345,
    "workItemId": 12345,
    "rev": 2,
    "fields": {
      "System.IterationPath": "MyProject\\Sprint 2",
      "System.ChangedBy": {
        "displayName": "John Doe",
        "uniqueName": "john.doe@company.com"
      },
      "System.ChangedDate": "2026-02-24T16:45:00Z"
    },
    "revisions": [
      {
        "fields": {
          "System.IterationPath": "MyProject\\Sprint 1"
        }
      }
    ]
  }
}
```

## Exposing via ngrok

To allow Azure DevOps to reach your local server:

1. Install ngrok: https://ngrok.com/download

2. Start your local server:
```bash
node server.js
```

3. In a new terminal, start ngrok:
```bash
ngrok http 3000
```

4. ngrok will provide a public URL like: `https://abc123.ngrok.io`

5. Use this URL in Azure DevOps: `https://abc123.ngrok.io/api/revertSprintChange`

**Note:** Keep both terminal windows open while testing.

## Azure DevOps Service Hook Configuration

### Setting up the webhook in Azure DevOps:

1. **Navigate to Project Settings**
   - Go to your Azure DevOps project
   - Click on "Project Settings" (bottom left)
   - Select "Service hooks" under "General"

2. **Create a new Service Hook**
   - Click "Create subscription"
   - Select "Web Hooks"
   - Click "Next"

3. **Configure the Trigger**
   - **Service:** Web Hooks
   - **Event:** Work item updated
   - **Filters (optional):**
     - Area path: Leave blank or specify
     - Work item type: Leave blank or specify (e.g., "Bug", "User Story")
     - Field: `System.IterationPath` (to only trigger on iteration changes)
   - Click "Next"

4. **Configure the Action**
   - **URL:** `https://your-ngrok-url.ngrok.io/api/revertSprintChange`
     - For local testing: Use your ngrok URL
     - For production: Use your Azure Function URL (future deployment)
   - **HTTP headers:**
     - Name: `x-webhook-token`
     - Value: `your-secret-token-here` (must match WEBHOOK_SECRET in .env)
   - **Resource details to send:** All
   - **Messages to send:** All
   - Click "Test" to verify
   - Click "Finish"

### Example Configuration Values:

| Field | Value |
|-------|-------|
| **Service** | Web Hooks |
| **Event** | Work item updated |
| **Field filter** | System.IterationPath |
| **URL** | https://abc123.ngrok.io/api/revertSprintChange |
| **Header Name** | x-webhook-token |
| **Header Value** | your-secret-token-here |
| **Resource version** | Latest |

## API Endpoints

### POST /api/revertSprintChange
Receives Azure DevOps work item update webhooks and validates iteration changes.

**Headers:**
- `Content-Type: application/json` (required)
- `x-webhook-token: your-secret-token` (required if WEBHOOK_SECRET is set)

**Response when iteration has NOT started (change allowed):**
```json
{
  "message": "Webhook received",
  "action": "ALLOWED",
  "note": "Iteration has not started yet - change allowed",
  "data": {
    "workItemId": 12345,
    "oldIterationPath": "Project\\Sprint 1",
    "newIterationPath": "Project\\Sprint 2",
    "changedBy": "John Doe",
    "changedDate": "2026-02-24T16:45:00Z"
  }
}
```

**Response when iteration HAS started but user is a BOARD MANAGER (change allowed):**
```json
{
  "message": "Iteration change allowed - board manager override",
  "action": "ALLOWED",
  "reason": "User is a board manager",
  "data": {
    "workItemId": 12345,
    "oldIterationPath": "Project\\Sprint 1",
    "newIterationPath": "Project\\Sprint 2",
    "changedBy": "Board Manager Name",
    "changedDate": "2026-02-24T16:45:00Z",
    "iterationStartDate": "2026-02-17T00:00:00Z",
    "boardManagerOverride": true
  }
}
```

**Response when iteration HAS started and user is NOT a board manager (change reverted):**
```json
{
  "message": "Iteration change prevented and reverted",
  "action": "REVERTED",
  "reason": "Iteration has already started",
  "data": {
    "workItemId": 12345,
    "oldIterationPath": "Project\\Sprint 1",
    "newIterationPath": "Project\\Sprint 2",
    "changedBy": "John Doe",
    "changedDate": "2026-02-24T16:45:00Z",
    "revertedTo": "Project\\Sprint 1",
    "iterationStartDate": "2026-02-17T00:00:00Z",
    "boardManagerContact": "boardmanager@company.com"
  }
}
```

**What happens in each scenario:**

**Scenario 1: Iteration NOT started**
- Change is allowed for all users
- Work item stays in new iteration

**Scenario 2: Iteration started + Board Manager**
- Change is allowed (board manager bypass)
- Work item stays in new iteration
- No reversion or comments added

**Scenario 3: Iteration started + Regular User**
- Change is blocked and reverted
- Work item automatically moved back to previous iteration
- Comment added explaining reversion
1. The work item is automatically moved back to its previous iteration
2. A comment is added to the work item explaining the reversion
3. The comment directs the user to contact the board manager if they need to add items to the current sprint
4. The webhook response indicates the action taken

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-02-24T16:45:00.000Z"
}
```

## Security

- **Webhook Token Validation:** Set `WEBHOOK_SECRET` in `.env` to require authentication
- **HTTPS:** Use ngrok or deploy to Azure for HTTPS in production
- **Environment Variables:** Never commit `.env` file to source control

## Logging

The API provides detailed console logging:
- 📥 Webhook received notifications
- 📦 Raw payload data
- 📊 Extracted work item information
- ✅ Successful token validation
- ❌ Errors and validation failures

## Next Steps

- [ ] Test locally with sample payloads
- [ ] Expose via ngrok and test with Azure DevOps
- [ ] Implement sprint revert logic in the service
- [ ] Add database persistence
- [ ] Deploy to Azure Functions
- [ ] Add automated tests
- [ ] Set up CI/CD pipeline

## Troubleshooting

**Webhook not receiving data:**
- Verify ngrok is running and tunnel is active
- Check Azure DevOps Service Hook status (should show green checkmark)
- Verify the webhook URL is correct
- Check firewall settings

**401 Unauthorized errors:**
- Verify `x-webhook-token` header matches `WEBHOOK_SECRET`
- Check that the header is properly configured in Azure DevOps

**500 Internal Server Error:**
- Check server logs for detailed error messages
- Verify the payload structure matches expected format
- Test with the sample payload first

## Development

To modify the parser logic, edit `services/adoParser.js`.
To add new endpoints, create routes in `routes/` directory.
To add middleware, modify `server.js`.

## License

ISC
