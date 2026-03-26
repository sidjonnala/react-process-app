/**
 * googleChatNotifier.js
 *
 * ADO service hook receiver that sends a Google Chat card notification whenever
 * a User Story is created under a specific area path.
 *
 * Endpoint: POST /api/notifyGoogleChat
 *
 * Required env vars (api/.env):
 *   GOOGLE_CHAT_WEBHOOK_URL  — incoming webhook URL from the target Google Chat space
 *   TARGET_AREA_PATH         — area path prefix to watch, e.g. "MyProject\\Hotfix"
 *
 * Configure the ADO service hook at:
 *   Project Settings → Service hooks → Web Hooks → Work item created
 */

import express from 'express';

const router = express.Router();

router.post('/notifyGoogleChat', async (req, res) => {
  const GOOGLE_CHAT_WEBHOOK_URL = process.env.GOOGLE_CHAT_WEBHOOK_URL;
  const TARGET_AREA_PATH = process.env.TARGET_AREA_PATH;

  console.log('\n' + '='.repeat(80));
  console.log('📥 ADO WEBHOOK RECEIVED — Google Chat Notifier');
  console.log('='.repeat(80));

  if (!GOOGLE_CHAT_WEBHOOK_URL || !TARGET_AREA_PATH) {
    console.error('❌ Missing required env vars: GOOGLE_CHAT_WEBHOOK_URL and/or TARGET_AREA_PATH');
    return res.status(500).json({ error: 'Server misconfiguration: missing env vars.' });
  }

  const body = req.body;

  // 1. Only handle work item creation events
  const eventType = body?.eventType ?? '';
  if (eventType !== 'workitem.created') {
    console.log(`ℹ️  Ignored event type: ${eventType}`);
    return res.status(200).json({ message: 'Event ignored.' });
  }

  // 2. Extract work item fields from the ADO payload
  const resource  = body?.resource ?? {};
  const fields    = resource?.fields ?? {};

  const workItemType = getField(fields, 'System.WorkItemType');
  const areaPath     = getField(fields, 'System.AreaPath');
  const title        = getField(fields, 'System.Title');
  const assignedTo   = getFieldNested(fields, 'System.AssignedTo', 'displayName');
  const state        = getField(fields, 'System.State');
  const priority     = getField(fields, 'Microsoft.VSTS.Common.Priority');
  const description  = getField(fields, 'System.Description');
  const workItemId   = resource?.id;
  const project      = getField(fields, 'System.TeamProject');

  const orgUrl      = body?.resourceContainers?.account?.baseUrl ?? '';
  const workItemUrl = orgUrl
    ? `${orgUrl.replace(/\/$/, '')}/${project}/_workitems/edit/${workItemId}`
    : '(link unavailable)';

  // 3. Filter: User Stories only
  if (workItemType.toLowerCase() !== 'user story') {
    console.log(`ℹ️  Ignored work item type: ${workItemType}`);
    return res.status(200).json({ message: 'Not a User Story.' });
  }

  // 4. Filter: area path must start with TARGET_AREA_PATH.
  // Normalize backslashes so .env values like "Proj\\Team" match ADO's "Proj\Team".
  const normalize = (s) => s.replace(/\\\\/g, '\\');
  if (!normalize(areaPath).toLowerCase().startsWith(normalize(TARGET_AREA_PATH).toLowerCase())) {
    console.log(`ℹ️  Ignored area path: ${areaPath}`);
    return res.status(200).json({ message: 'Area path does not match.' });
  }

  console.log(`✅ Matched User Story #${workItemId} in ${areaPath}`);

  // 5. Build the Google Chat card payload
  let cleanDescription = description
    ? description.replace(/<[^>]*>/g, '').trim()
    : '_No description provided._';
  if (cleanDescription.length > 300) {
    cleanDescription = cleanDescription.slice(0, 300) + '…';
  }

  const chatPayload = {
    cardsV2: [
      {
        cardId: `ado-userstory-${workItemId}`,
        card: {
          header: {
            title: `New User Story #${workItemId}`,
            subtitle: areaPath,
            imageUrl: 'https://cdn.vsassets.io/content/icons/favicon.ico',
            imageType: 'CIRCLE',
          },
          sections: [
            {
              widgets: [
                { decoratedText: { topLabel: 'Title',       text: title } },
                { decoratedText: { topLabel: 'Assigned To', text: assignedTo || 'Unassigned' } },
                { decoratedText: { topLabel: 'State',       text: state } },
                { decoratedText: { topLabel: 'Priority',    text: priority ? `P${priority}` : '—' } },
                { decoratedText: { topLabel: 'Description', text: cleanDescription, wrapText: true } },
              ],
            },
            {
              widgets: [
                {
                  buttonList: {
                    buttons: [
                      {
                        text: 'Open in Azure DevOps',
                        onClick: { openLink: { url: workItemUrl } },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };

  // 6. POST the card to Google Chat
  try {
    const response = await fetch(GOOGLE_CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Chat responded ${response.status}: ${text}`);
    }

    console.log('✅ Notification sent to Google Chat.');
    console.log('='.repeat(80) + '\n');
    return res.status(200).json({ message: 'Notification sent.' });

  } catch (err) {
    console.error('❌ Failed to post to Google Chat:', err.message);
    console.log('='.repeat(80) + '\n');
    return res.status(500).json({ error: 'Failed to notify Google Chat.', details: err.message });
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Returns the string value of a flat ADO field, or '' if absent. */
function getField(fields, fieldName) {
  const val = fields[fieldName];
  if (val === undefined || val === null) return '';
  return typeof val === 'object' ? JSON.stringify(val) : String(val);
}

/** Returns a nested string property of an ADO object field (e.g. AssignedTo.displayName). */
function getFieldNested(fields, fieldName, nested) {
  const val = fields[fieldName];
  if (val && typeof val === 'object' && nested in val) {
    return String(val[nested] ?? '');
  }
  return '';
}

export default router;
