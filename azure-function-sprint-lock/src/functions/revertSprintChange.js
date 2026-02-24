import { app } from '@azure/functions';
import fetch from 'node-fetch';

// ─── Config ───────────────────────────────────────────────────────────────────

const ADO_ORG     = process.env.ADO_ORG;
const ADO_PROJECT = process.env.ADO_PROJECT;
const ADO_PAT     = process.env.ADO_PAT;

/** Comma-separated list of projects allowed to trigger this function. Defaults to ADO_PROJECT. */
const ALLOWED_PROJECTS = (process.env.OPTIONAL_ALLOWED_PROJECTS || ADO_PROJECT || '')
  .split(',')
  .map(p => p.trim().toLowerCase())
  .filter(Boolean);

/** Comma-separated list of user emails / identity IDs allowed to bypass the sprint lock. */
const OVERRIDE_USERS = (process.env.ADO_OVERRIDE_USERS || '')
  .split(',')
  .map(u => u.trim().toLowerCase())
  .filter(Boolean);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(label, message, data) {
  const entry = { timestamp: new Date().toISOString(), label, message };
  if (data !== undefined) entry.data = data;
  console.log(JSON.stringify(entry));
}

function adoHeaders() {
  const token = Buffer.from(`:${ADO_PAT}`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/**
 * Safely call ADO API. Returns parsed JSON body on success, null on failure.
 */
async function adoGet(url) {
  try {
    const res = await fetch(url, { headers: adoHeaders() });
    const body = await res.json();
    if (!res.ok) {
      log('ADO_GET_FAILED', `HTTP ${res.status} for ${url}`, body);
      return null;
    }
    return body;
  } catch (err) {
    log('ADO_GET_ERROR', err.message, { url });
    return null;
  }
}

/**
 * PATCH a work item with a JSON Patch document.
 */
async function adoPatch(url, patchDocument) {
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...adoHeaders(),
        'Content-Type': 'application/json-patch+json',
      },
      body: JSON.stringify(patchDocument),
    });
    const body = await res.json();
    if (!res.ok) {
      log('ADO_PATCH_FAILED', `HTTP ${res.status} for ${url}`, body);
      return null;
    }
    return body;
  } catch (err) {
    log('ADO_PATCH_ERROR', err.message, { url });
    return null;
  }
}

// ─── ADO API calls ────────────────────────────────────────────────────────────

/**
 * Get the iteration classification node for a given iteration path (sprint name).
 * e.g. iterationOnlyPath = "Sprint 2"
 */
async function getIterationNode(iterationOnlyPath) {
  const encoded = encodeURIComponent(iterationOnlyPath);
  const url = `${ADO_ORG}/${encodeURIComponent(ADO_PROJECT)}/_apis/wit/classificationnodes/iterations/${encoded}?api-version=7.0`;
  return adoGet(url);
}

/**
 * Get all revisions for a work item and return the previous iteration path
 * (the one before the current newIterationPath).
 */
async function getPreviousIterationPath(workItemId, currentIterationPath) {
  const url = `${ADO_ORG}/${encodeURIComponent(ADO_PROJECT)}/_apis/wit/workitems/${workItemId}/revisions?api-version=7.0`;
  const body = await adoGet(url);
  if (!body?.value) return null;

  const revisions = body.value;
  for (let i = revisions.length - 1; i >= 0; i--) {
    const path = revisions[i].fields?.['System.IterationPath'];
    if (path && path !== currentIterationPath) {
      return path;
    }
  }
  return null;
}

/**
 * Revert a work item's iteration to oldIterationPath and add a history comment.
 */
async function revertIteration(workItemId, oldIterationPath, comment) {
  const url = `${ADO_ORG}/${encodeURIComponent(ADO_PROJECT)}/_apis/wit/workitems/${workItemId}?api-version=7.0`;
  const patch = [
    { op: 'add', path: '/fields/System.IterationPath', value: oldIterationPath },
    { op: 'add', path: '/fields/System.History',       value: comment },
  ];
  return adoPatch(url, patch);
}

/**
 * Add a history comment to a work item (no iteration change).
 */
async function addComment(workItemId, comment) {
  const url = `${ADO_ORG}/${encodeURIComponent(ADO_PROJECT)}/_apis/wit/workitems/${workItemId}?api-version=7.0`;
  const patch = [{ op: 'add', path: '/fields/System.History', value: comment }];
  return adoPatch(url, patch);
}

// ─── Payload parsing ──────────────────────────────────────────────────────────

function extractChangedBy(resource) {
  const revisedBy = resource?.revisedBy;
  if (!revisedBy) return null;
  return {
    displayName: revisedBy.displayName || null,
    uniqueName:  revisedBy.uniqueName  || revisedBy.id || null,
  };
}

function extractProject(payload) {
  return (
    payload?.resourceContainers?.project?.name ||
    payload?.resourceContainers?.project?.id   ||
    null
  );
}

function extractIterationChange(resource) {
  const newPath = resource?.revision?.fields?.['System.IterationPath']
               || resource?.fields?.['System.IterationPath']
               || null;
  return newPath;
}

// ─── Azure Function ───────────────────────────────────────────────────────────

app.http('revertSprintChange', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'revertSprintChange',
  handler: async (request, context) => {

    const respond = (msg, extra = {}) => ({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, ...extra }),
    });

    // ── Parse payload ──────────────────────────────────────────────────────
    let payload;
    try {
      payload = await request.json();
    } catch {
      log('PARSE_ERROR', 'Could not parse request body as JSON');
      return respond('Webhook received - invalid JSON');
    }

    const resource = payload?.resource;
    const workItemId = resource?.workItemId ?? resource?.id;

    log('WEBHOOK_RECEIVED', 'Incoming webhook', {
      eventType: payload?.eventType,
      workItemId,
    });

    // ── Project validation ─────────────────────────────────────────────────
    const projectName = extractProject(payload);
    const projectKey  = (projectName || '').toLowerCase();

    log('PROJECT_VALIDATION', 'Checking project', {
      projectName,
      allowedProjects: ALLOWED_PROJECTS,
    });

    if (ALLOWED_PROJECTS.length > 0 && !ALLOWED_PROJECTS.includes(projectKey)) {
      log('PROJECT_IGNORED', `Ignored project: "${projectName}"`);
      return respond('Webhook received - project not in allowed list', { project: projectName });
    }

    log('PROJECT_ALLOWED', `Project "${projectName}" is allowed`);

    // ── Iteration change detection ─────────────────────────────────────────
    const newIterationPath = extractIterationChange(resource);

    if (!newIterationPath) {
      log('NO_ITERATION_CHANGE', 'No System.IterationPath found in payload');
      return respond('Webhook received - no iteration change detected');
    }

    log('ITERATION_CHANGE_DETECTED', 'Iteration path changed', {
      workItemId,
      newIterationPath,
    });

    // ── Fetch old iteration path ───────────────────────────────────────────
    const oldIterationPath = await getPreviousIterationPath(workItemId, newIterationPath);

    // ── Extract changed-by user ────────────────────────────────────────────
    const changedBy = extractChangedBy(resource);
    const changedByEmail = changedBy?.uniqueName || changedBy?.displayName || 'unknown';

    log('EXTRACTED_DATA', 'Work item details', {
      workItemId,
      oldIterationPath:  oldIterationPath || 'N/A',
      newIterationPath,
      changedBy:         changedByEmail,
      project:           projectName,
    });

    // ── Whitelist check ────────────────────────────────────────────────────
    const normalizedUser  = changedByEmail.toLowerCase();
    const isOverrideUser  = OVERRIDE_USERS.includes(normalizedUser);

    log('WHITELIST_CHECK', 'Checking override whitelist', {
      user:          changedByEmail,
      overrideUsers: OVERRIDE_USERS,
      isOverrideUser,
    });

    if (isOverrideUser) {
      log('OVERRIDE_ALLOWED', `Override allowed for whitelisted user: ${changedByEmail}`);

      await addComment(
        workItemId,
        `<b>Sprint change allowed due to EM override.</b><br/>` +
        `User <b>${changedByEmail}</b> is on the approved override list and may move work items into active sprints.`
      );

      return respond('Webhook received - override user, change allowed', {
        action:      'ALLOWED',
        reason:      'EM override',
        workItemId,
        changedBy:   changedByEmail,
        newIteration: newIterationPath,
      });
    }

    // ── Sprint start evaluation ────────────────────────────────────────────
    const pathParts        = newIterationPath.split('\\').filter(Boolean);
    const projectIndex     = pathParts.findIndex(p => p.toLowerCase() === (projectName || '').toLowerCase());
    const iterationOnlyPath = projectIndex >= 0
      ? pathParts.slice(projectIndex + 1).join('\\')
      : pathParts.slice(1).join('\\');

    const finalIterationPath = iterationOnlyPath || pathParts[pathParts.length - 1];

    log('SPRINT_EVALUATION', 'Fetching iteration metadata', { iterationOnlyPath: finalIterationPath });

    const iterationNode = await getIterationNode(finalIterationPath);
    const startDateStr  = iterationNode?.attributes?.startDate;

    log('SPRINT_START_DATE', 'Sprint start date', {
      iterationName: iterationNode?.name,
      startDate:     startDateStr || 'N/A',
    });

    if (!startDateStr) {
      log('SPRINT_NO_DATE', 'No start date found for iteration - allowing change by default');
      return respond('Webhook received - no sprint start date, change allowed', {
        action:      'ALLOWED',
        reason:      'No sprint start date configured',
        workItemId,
        newIteration: newIterationPath,
      });
    }

    const sprintStarted = new Date() >= new Date(startDateStr);

    log('SPRINT_DECISION', 'Sprint start evaluation result', {
      startDate:     startDateStr,
      now:           new Date().toISOString(),
      sprintStarted,
    });

    // ── Final decision ─────────────────────────────────────────────────────
    if (!sprintStarted) {
      log('DECISION', 'Sprint has NOT started - allowing change', {
        workItemId, newIterationPath,
      });

      return respond('Webhook received - sprint not started, change allowed', {
        action:      'ALLOWED',
        reason:      'Sprint has not started',
        workItemId,
        changedBy:   changedByEmail,
        newIteration: newIterationPath,
        sprintStartDate: startDateStr,
      });
    }

    // Sprint has started - revert
    log('DECISION', 'Sprint HAS started - reverting iteration change', {
      workItemId,
      newIterationPath,
      revertingTo: oldIterationPath || 'N/A',
      changedBy:   changedByEmail,
    });

    if (!oldIterationPath) {
      log('REVERT_SKIPPED', 'Cannot revert - old iteration path not available');
      return respond('Webhook received - sprint started but no previous iteration to revert to', {
        action:    'BLOCKED',
        workItemId,
        newIteration: newIterationPath,
      });
    }

    const revertComment =
      `<b>⚠️ Automatic Sprint Lock Reversion</b><br/><br/>` +
      `This work item was moved to <b>${newIterationPath}</b> by <b>${changedByEmail}</b>, ` +
      `but that sprint has already started (${new Date(startDateStr).toLocaleDateString()}).<br/><br/>` +
      `Work items cannot be added to a sprint that has already begun. ` +
      `Please contact your board manager if you need to add items to the current sprint.<br/><br/>` +
      `<b>Reverted to:</b> ${oldIterationPath}`;

    const revertResult = await revertIteration(workItemId, oldIterationPath, revertComment);

    if (revertResult) {
      log('REVERT_SUCCESS', 'Work item successfully reverted', {
        workItemId,
        revertedTo: oldIterationPath,
      });
    } else {
      log('REVERT_FAILED', 'Revert API call failed - work item may not have been updated', {
        workItemId,
      });
    }

    return respond('Webhook received - sprint started, iteration change reverted', {
      action:          'REVERTED',
      workItemId,
      changedBy:       changedByEmail,
      attemptedIteration: newIterationPath,
      revertedTo:      oldIterationPath,
      sprintStartDate: startDateStr,
      revertSuccess:   !!revertResult,
    });
  },
});
