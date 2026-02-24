# Understanding API Responses

## When Testing Locally

When you test with curl or sample data that doesn't exist in Azure DevOps, you'll see:

```
⚠️  API request failed with status 404
⚠️  Could not retrieve iteration details, allowing change
```

**This is expected and safe behavior.** The API gracefully handles cases where it cannot validate the iteration by allowing the change.

## When Used with Real Azure DevOps Webhooks

When Azure DevOps sends a real webhook:
1. The work item will exist (guaranteed by ADO)
2. The iteration will exist (guaranteed by ADO)
3. The API will successfully fetch iteration details
4. The validation will work as designed

## API Response Scenarios

### Scenario 1: Iteration Has NOT Started ✅
```json
{
  "message": "Webhook received",
  "action": "ALLOWED",
  "note": "Iteration has not started yet - change allowed",
  "data": { ... }
}
```

**What happens:**
- Change is allowed
- Work item stays in the new iteration
- No comments added to work item

---

### Scenario 2: Iteration HAS Started 🚫
```json
{
  "message": "Iteration change prevented and reverted",
  "action": "REVERTED",
  "reason": "Iteration has already started",
  "data": {
    "revertedTo": "Project\\Previous Sprint",
    "iterationStartDate": "2026-02-17T00:00:00Z",
    "boardManagerContact": "boardmanager@company.com"
  }
}
```

**What happens:**
1. Work item is automatically moved back to previous iteration
2. Comment added to work item explaining the reversion
3. User is directed to contact board manager
4. System logs show the reversion action

**Example comment added to work item:**
> ⚠️ **AUTOMATIC REVERSION NOTICE**
> 
> Your attempt to move this work item to iteration "**Project\Sprint 2**" was automatically reverted.
> 
> **Reason:** The iteration has already started (started on 2/17/2026).
> 
> Work items cannot be added to started iterations to maintain sprint integrity.
> 
> **If you need to add this work item to the current sprint:**
> Please contact boardmanager@company.com who can approve and make the change.
> 
> This work item has been returned to: **Project\Sprint 1**

---

### Scenario 3: Cannot Validate (404/Error) ⚠️
```json
{
  "message": "Webhook received",
  "note": "Could not validate iteration - change allowed",
  "data": { ... }
}
```

**What happens:**
- Change is allowed (fail-safe mode)
- Validation could not be performed
- Work item stays in new iteration
- System logs show the validation failure

**Common causes:**
- Testing with non-existent work items
- PAT missing required permissions
- Iteration not found in classification nodes
- Network/API issues

---

## How to Test the Full Workflow

### Option 1: Use ngrok + Real ADO Webhook
1. Start your local server: `npm run start:api`
2. Expose with ngrok: `ngrok http 3000`
3. Configure webhook in Azure DevOps
4. Move a work item to a started iteration
5. Watch it get automatically reverted

### Option 2: Create Test Iterations in ADO
1. Create a project in Azure DevOps
2. Create iterations with dates:
   - "Sprint 1" (past dates - finished)
   - "Sprint 2" (current dates - in progress) ✅ Use this for testing
   - "Sprint 3" (future dates - not started)
3. Create a test work item
4. Try to move it from Sprint 1 to Sprint 2 (should be reverted)
5. Try to move it from Sprint 1 to Sprint 3 (should be allowed)

---

## Checking PAT Permissions

Your PAT needs these scopes:

| Scope | Purpose | Required |
|-------|---------|----------|
| **Work Items (Read)** | Fetch previous iterations and work item details | ✅ Yes |
| **Work Items (Write)** | Revert work item to previous iteration | ✅ Yes |

To verify your PAT has these permissions:
1. Go to https://dev.azure.com/{org}/_usersSettings/tokens
2. Find your token
3. Click on it to view scopes
4. Ensure both Work Items (Read) and (Write) are checked

---

## Understanding the Logs

### During testing (404 expected):
```
🔍 Fetching iteration details for: ProcessAutomation\Sprint 1
   API URL: https://dev.azure.com/sidjonnalaOrg/ProcessAutomation/_apis/...
⚠️  API request failed with status 404
   Response: The resource cannot be found.
⚠️  Could not retrieve iteration details, allowing change
```

### With real ADO webhook (success):
```
🔍 Fetching iteration details for: ProcessAutomation\Sprint 2
   API URL: https://dev.azure.com/sidjonnalaOrg/ProcessAutomation/_apis/...
📅 Iteration Details:
   Name: Sprint 2
   Start Date: 2026-02-17T00:00:00Z
   Finish Date: 2026-03-03T00:00:00Z
   Time Frame: current
🚫 ITERATION HAS STARTED - REVERTING CHANGE
🔄 Reverting work item 37 to iteration: ProcessAutomation\Sprint 1
✅ Work item 37 successfully reverted
💬 Adding comment to work item 37
✅ Comment added successfully
```

---

## Next Steps

1. **For Development:** Use the current setup with graceful 404 handling
2. **For Testing:** Set up ngrok and connect to real Azure DevOps
3. **For Production:** Deploy to Azure Functions (covered in README.md)

The API is designed to be safe - when in doubt, it allows the change rather than blocking potentially valid operations.
