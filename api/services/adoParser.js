/**
 * Parse Azure DevOps webhook payload to extract iteration change information
 * @param {Object} payload - The webhook payload from Azure DevOps
 * @returns {Object|null} Parsed data or null if no iteration change detected
 */
export function parseAdoWebhook(payload) {
  try {
    // Check if payload has required structure
    if (!payload || !payload.resource) {
      console.log('⚠️  Invalid payload structure');
      return null;
    }
    
    const resource = payload.resource;
    
    // Extract work item ID
    const workItemId = resource.workItemId || resource.id;
    
    if (!workItemId) {
      console.log('⚠️  No work item ID found');
      return null;
    }
    
    // ADO sends changed fields in resource.fields with oldValue/newValue structure
    // OR in resource.revision.fields for the current state
    let oldIterationPath = null;
    let newIterationPath = null;
    
    // Method 1: Check if fields contains the iteration change with old/new values
    // ADO structure: resource.fields['System.IterationPath'] = { oldValue: "...", newValue: "..." }
    if (resource.fields && resource.fields['System.IterationPath']) {
      const iterationField = resource.fields['System.IterationPath'];
      
      // Check if it's an object with oldValue and newValue
      if (typeof iterationField === 'object' && iterationField !== null) {
        oldIterationPath = iterationField.oldValue || null;
        newIterationPath = iterationField.newValue || iterationField;
      } else if (typeof iterationField === 'string') {
        // It's just a string, this is the new value
        newIterationPath = iterationField;
      }
    }
    
    // Method 2: Check revision.fields for current state (if not found above)
    if (!newIterationPath && resource.revision && resource.revision.fields) {
      const revisionFields = resource.revision.fields;
      if (revisionFields['System.IterationPath']) {
        newIterationPath = revisionFields['System.IterationPath'];
      }
    }
    
    // Method 3: Look for old value in previous revision (if revisions array exists)
    if (!oldIterationPath && resource.revisions && resource.revisions.length > 0) {
      // Get the previous revision (last item in revisions array)
      const previousRevision = resource.revisions[resource.revisions.length - 1];
      if (previousRevision.fields && previousRevision.fields['System.IterationPath']) {
        oldIterationPath = previousRevision.fields['System.IterationPath'];
      }
    }
    
    // Method 4: Try to get old value from _links or url
    if (!oldIterationPath && resource._links && resource._links.workItemRevisions) {
      // We would need to make an API call here to get the previous revision
      // For now, we'll just note that we can't get the old value without an API call
      console.log('⚠️  Old iteration path not in payload, would need API call to previous revision');
    }
    
    // Extract changed by information
    let changedBy = 'Unknown';
    if (resource.revisedBy) {
      changedBy = resource.revisedBy.displayName || resource.revisedBy.uniqueName || 'Unknown';
    } else if (resource.revision && resource.revision.fields && resource.revision.fields['System.ChangedBy']) {
      const changedByField = resource.revision.fields['System.ChangedBy'];
      changedBy = changedByField.displayName || 
                  changedByField.uniqueName || 
                  changedByField;
    } else if (payload.message && payload.message.text) {
      // Try to extract from message
      const match = payload.message.text.match(/by (.+?)(?:\s|$)/);
      if (match) changedBy = match[1];
    }
    
    // Extract changed date
    let changedDate = new Date().toISOString();
    if (resource.revision && resource.revision.fields && resource.revision.fields['System.ChangedDate']) {
      changedDate = resource.revision.fields['System.ChangedDate'];
    } else if (resource.revisedDate) {
      changedDate = resource.revisedDate;
    } else if (resource.fields && resource.fields['System.ChangedDate']) {
      changedDate = resource.fields['System.ChangedDate'];
    }
    
    // Only return data if we have a new iteration path
    if (newIterationPath) {
      return {
        workItemId,
        oldIterationPath: oldIterationPath || 'N/A (not provided in webhook)',
        newIterationPath,
        changedBy,
        changedDate
      };
    }
    
    console.log('⚠️  No iteration path change detected in payload');
    return null;
    
  } catch (error) {
    console.error('❌ Error parsing ADO webhook:', error);
    return null;
  }
}
