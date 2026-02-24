import https from 'https';

/**
 * Get iteration details from Azure DevOps using Classification Nodes API
 * @param {string} orgUrl - Azure DevOps organization URL
 * @param {string} project - Project name
 * @param {string} iterationPath - Full iteration path (e.g., "MyProject\\Sprint 2")
 * @param {string} pat - Personal Access Token
 * @returns {Promise<Object|null>} Iteration details with start/end dates
 */
export async function getIterationDetails(orgUrl, project, iterationPath, pat) {
  return new Promise((resolve, reject) => {
    // Extract iteration path parts
    // Path format: "ProjectName\IterationName" or "ProjectName\Parent\Child"
    const pathParts = iterationPath.split('\\').filter(p => p);
    
    // Remove project name from path if present
    const projectIndex = pathParts.findIndex(p => p.toLowerCase() === project.toLowerCase());
    const iterationOnlyPath = projectIndex >= 0 
      ? pathParts.slice(projectIndex + 1).join('\\')
      : pathParts.slice(1).join('\\'); // Assume first part is project
    
    // Use Classification Nodes API to get iteration details
    const encodedPath = encodeURIComponent(iterationOnlyPath || '');
    const url = `${orgUrl}/${encodeURIComponent(project)}/_apis/wit/classificationnodes/iterations/${encodedPath}?api-version=7.0`;
    
    console.log(`🔍 Fetching iteration details for: ${iterationPath}`);
    console.log(`   API URL: ${url}`);
    
    const auth = Buffer.from(`:${pat}`).toString('base64');
    
    const options = {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const iteration = JSON.parse(data);
            
            resolve({
              id: iteration.id,
              name: iteration.name,
              path: iteration.path,
              startDate: iteration.attributes?.startDate || null,
              finishDate: iteration.attributes?.finishDate || null,
              timeFrame: getTimeFrame(iteration.attributes?.startDate, iteration.attributes?.finishDate)
            });
          } catch (error) {
            console.error(`❌ Failed to parse iteration response: ${error.message}`);
            reject(new Error(`Failed to parse iteration response: ${error.message}`));
          }
        } else {
          console.log(`⚠️  API request failed with status ${res.statusCode}`);
          console.log(`   Response: ${data}`);
          resolve(null);
        }
      });
    }).on('error', (error) => {
      console.error(`❌ HTTP request error: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * Determine the time frame of an iteration
 * @param {string} startDate - ISO date string
 * @param {string} finishDate - ISO date string
 * @returns {string} Time frame status
 */
function getTimeFrame(startDate, finishDate) {
  if (!startDate || !finishDate) {
    return 'unknown';
  }
  
  const now = new Date();
  const start = new Date(startDate);
  const finish = new Date(finishDate);
  
  if (now < start) return 'future';
  if (now > finish) return 'past';
  return 'current';
}

/**
 * Check if an iteration has started
 * @param {Object} iteration - Iteration details with startDate
 * @returns {boolean} True if iteration has started
 */
export function hasIterationStarted(iteration) {
  if (!iteration || !iteration.startDate) {
    console.log('⚠️  No start date available, assuming iteration has not started');
    return false;
  }
  
  const startDate = new Date(iteration.startDate);
  const now = new Date();
  
  return now >= startDate;
}

/**
 * Revert work item to previous iteration
 * @param {string} orgUrl - Azure DevOps organization URL
 * @param {string} project - Project name
 * @param {number} workItemId - Work item ID
 * @param {string} oldIterationPath - Previous iteration path to revert to
 * @param {string} pat - Personal Access Token
 * @param {string} reason - Reason for reversion
 * @returns {Promise<Object>} Result of the revert operation
 */
export async function revertWorkItemIteration(orgUrl, project, workItemId, oldIterationPath, pat, reason) {
  return new Promise((resolve, reject) => {
    const url = `${orgUrl}/${project}/_apis/wit/workitems/${workItemId}?api-version=7.0`;
    
    console.log(`🔄 Reverting work item ${workItemId} to iteration: ${oldIterationPath}`);
    
    const auth = Buffer.from(`:${pat}`).toString('base64');
    
    const patchDocument = [
      {
        op: 'add',
        path: '/fields/System.IterationPath',
        value: oldIterationPath
      },
      {
        op: 'add',
        path: '/fields/System.History',
        value: `<div><b>⚠️ AUTOMATIC REVERSION</b></div><div>${reason}</div><div>Work item automatically moved back to <b>${oldIterationPath}</b></div>`
      }
    ];
    
    const postData = JSON.stringify(patchDocument);
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'PATCH',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json-patch+json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log(`✅ Work item ${workItemId} successfully reverted`);
            resolve({
              success: true,
              workItemId,
              newIterationPath: result.fields['System.IterationPath'],
              message: 'Work item successfully reverted'
            });
          } catch (error) {
            reject(new Error(`Failed to parse revert response: ${error.message}`));
          }
        } else {
          console.error(`❌ Failed to revert work item. Status: ${res.statusCode}`);
          console.error(`Response: ${data}`);
          reject(new Error(`Failed to revert work item: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Add a comment to a work item
 * @param {string} orgUrl - Azure DevOps organization URL
 * @param {string} project - Project name
 * @param {number} workItemId - Work item ID
 * @param {string} comment - Comment text (supports HTML)
 * @param {string} pat - Personal Access Token
 * @returns {Promise<Object>} Result of adding the comment
 */
export async function addWorkItemComment(orgUrl, project, workItemId, comment, pat) {
  return new Promise((resolve, reject) => {
    const url = `${orgUrl}/${project}/_apis/wit/workitems/${workItemId}/comments?api-version=7.0`;
    
    console.log(`💬 Adding comment to work item ${workItemId}`);
    
    const auth = Buffer.from(`:${pat}`).toString('base64');
    
    const commentData = JSON.stringify({
      text: comment
    });
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(commentData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✅ Comment added successfully`);
          resolve({ success: true, message: 'Comment added' });
        } else {
          console.error(`⚠️  Failed to add comment. Status: ${res.statusCode}`);
          resolve({ success: false, message: `Failed to add comment: ${res.statusCode}` });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Error adding comment: ${error.message}`);
      resolve({ success: false, message: error.message });
    });
    
    req.write(commentData);
    req.end();
  });
}
