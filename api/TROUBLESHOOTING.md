# Troubleshooting Guide

## Issue: "ADO_PAT not configured, cannot validate or revert"

### Solution
The issue was that the `.env` file is located in the `api/` directory, but when running `npm run start:api` from the root directory, Node.js was looking for `.env` in the root.

**Fixed by:**
- Updated `server.js` to explicitly load `.env` from the `api/` directory using `path.join(__dirname, '.env')`
- Now the server correctly loads environment variables from `api/.env`

### Verification
When the server starts, you should see:
```
ADO PAT: Configured (will fetch old iteration paths)
```

If you see:
```
ADO PAT: Not Configured (old paths from webhook only)
```

Then the environment variable is not being loaded.

## Common Issues

### 1. PAT Token Permissions
**Symptom:** API returns 404 or 401 errors when calling ADO API

**Solution:** Ensure your PAT has the following scopes:
- ✅ Work Items (Read)
- ✅ Work Items (Write)

### 2. Work Item Not Found (404)
**Symptom:** `❌ Error fetching previous iteration path: API request failed with status 404`

**Possible causes:**
- Work item ID doesn't exist
- PAT doesn't have access to the project
- Organization URL is incorrect
- Project name is incorrect

**How to verify:**
1. Check that the work item exists: `https://dev.azure.com/{org}/{project}/_workitems/edit/{id}`
2. Verify your PAT has access to the project
3. Check organization and project names in the webhook payload

### 3. Iteration Not Found
**Symptom:** `⚠️ Could not retrieve iteration details, allowing change`

**Possible causes:**
- Iteration path format is incorrect
- Team settings API endpoint needs team name
- PAT doesn't have read access to team settings

**Note:** The API gracefully handles this by allowing the change when it cannot validate the iteration status.

## Testing with curl

### Test without ADO_PAT (logging only):
```bash
curl -X POST http://localhost:3000/api/revertSprintChange \
  -H "Content-Type: application/json" \
  -d '{"resource":{"workItemId":123,"revision":{"fields":{"System.IterationPath":"Project\\Sprint 1"}}}}'
```

### Test with real ADO webhook payload:
Use ngrok to expose your local server and configure the webhook in Azure DevOps.

## Environment Variables Quick Reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |
| `WEBHOOK_SECRET` | No | Token for webhook authentication |
| `ADO_PAT` | **Yes** | Azure DevOps Personal Access Token for API calls |
| `BOARD_MANAGER_EMAIL` | No | Contact email shown in reversion messages |

## Log Messages Explained

### Success messages:
- `✅ Webhook token validated` - Authentication successful
- `✅ Found previous iteration path: {path}` - Successfully fetched old iteration
- `✅ Work item {id} successfully reverted` - Reversion completed
- `✅ ITERATION HAS NOT STARTED - ALLOWING CHANGE` - Change allowed

### Warning messages:
- `⚠️ Old iteration path not in webhook, fetching from API...` - Normal, will fetch from API
- `⚠️ Could not retrieve iteration details, allowing change` - Can't validate, change allowed
- `⚠️ No start date available, assuming iteration has not started` - Missing date info

### Error messages:
- `❌ Webhook token missing in headers` - Add x-webhook-token header
- `❌ Invalid webhook token provided` - Token doesn't match WEBHOOK_SECRET
- `❌ Error fetching previous iteration path` - API call failed
- `🚫 ITERATION HAS STARTED - REVERTING CHANGE` - Blocking and reverting change

## How to Get Detailed Logs

The API provides detailed console logging for debugging:
1. Raw webhook payload
2. Extracted data
3. API calls to Azure DevOps
4. Validation results
5. Reversion actions

All logs are formatted with emojis for easy scanning.
