import https from 'https';

/**
 * Fetch work item revisions from Azure DevOps REST API
 * @param {string} orgUrl - Azure DevOps organization URL (e.g., "https://dev.azure.com/myorg")
 * @param {string} project - Project name
 * @param {number} workItemId - Work item ID
 * @param {string} pat - Personal Access Token for authentication
 * @returns {Promise<Array>} Array of revisions
 */
export async function getWorkItemRevisions(orgUrl, project, workItemId, pat) {
  return new Promise((resolve, reject) => {
    const url = `${orgUrl}/${project}/_apis/wit/workitems/${workItemId}/revisions?api-version=7.0`;
    
    console.log(`🔍 Fetching revisions from: ${url}`);
    
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
            const parsed = JSON.parse(data);
            resolve(parsed.value || []);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Get the previous iteration path for a work item
 * @param {string} orgUrl - Azure DevOps organization URL
 * @param {string} project - Project name
 * @param {number} workItemId - Work item ID
 * @param {string} pat - Personal Access Token
 * @param {string} currentIterationPath - Current iteration path to compare against
 * @returns {Promise<string|null>} Previous iteration path or null if not found
 */
export async function getPreviousIterationPath(orgUrl, project, workItemId, pat, currentIterationPath) {
  try {
    const revisions = await getWorkItemRevisions(orgUrl, project, workItemId, pat);
    
    if (!revisions || revisions.length === 0) {
      console.log('⚠️  No revisions found');
      return null;
    }
    
    // Find the most recent revision that has a different iteration path
    for (let i = revisions.length - 1; i >= 0; i--) {
      const revision = revisions[i];
      const iterationPath = revision.fields?.['System.IterationPath'];
      
      if (iterationPath && iterationPath !== currentIterationPath) {
        console.log(`✅ Found previous iteration path: ${iterationPath}`);
        return iterationPath;
      }
    }
    
    console.log('⚠️  No previous iteration path found (work item may have been created with current iteration)');
    return null;
    
  } catch (error) {
    console.error('❌ Error fetching previous iteration path:', error.message);
    return null;
  }
}

/**
 * Parse URL from ADO webhook to extract organization and project
 * @param {Object} payload - The webhook payload
 * @returns {Object} Object with orgUrl and project
 */
export function extractOrgAndProject(payload) {
  try {
    // Try to extract from resource URL
    if (payload.resourceContainers) {
      const collection = payload.resourceContainers.collection;
      const project = payload.resourceContainers.project;
      
      if (collection && project) {
        return {
          orgUrl: collection.baseUrl,
          project: project.name
        };
      }
    }
    
    // Try to extract from resource._links
    if (payload.resource?._links?.self?.href) {
      const url = payload.resource._links.self.href;
      const match = url.match(/(https:\/\/dev\.azure\.com\/[^\/]+)\/([^\/]+)\/_apis/);
      
      if (match) {
        return {
          orgUrl: match[1],
          project: decodeURIComponent(match[2])
        };
      }
    }
    
    console.log('⚠️  Could not extract organization and project from payload');
    return null;
    
  } catch (error) {
    console.error('❌ Error extracting org and project:', error);
    return null;
  }
}
