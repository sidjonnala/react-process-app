import express from 'express';
import { parseAdoWebhook } from '../services/adoParser.js';
import { getPreviousIterationPath, extractOrgAndProject } from '../services/adoApiClient.js';
import { 
  getIterationDetails, 
  hasIterationStarted, 
  revertWorkItemIteration,
  addWorkItemComment 
} from '../services/iterationValidator.js';
import { isUserBoardManager, getBoardManagers } from '../services/boardManagerService.js';

const router = express.Router();

// Middleware to validate webhook token
const validateWebhookToken = (req, res, next) => {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  if (webhookSecret) {
    const providedToken = req.headers['x-webhook-token'];
    
    if (!providedToken) {
      console.log('❌ Webhook token missing in headers');
      return res.status(401).json({ error: 'Unauthorized: Missing webhook token' });
    }
    
    if (providedToken !== webhookSecret) {
      console.log('❌ Invalid webhook token provided');
      return res.status(401).json({ error: 'Unauthorized: Invalid webhook token' });
    }
    
    console.log('✅ Webhook token validated');
  }
  
  next();
};

// POST endpoint for Azure DevOps webhook
router.post('/revertSprintChange', validateWebhookToken, async (req, res) => {
  console.log('\n' + '='.repeat(80));
  console.log('📥 WEBHOOK RECEIVED');
  console.log('='.repeat(80));
  
  try {
    // Log raw payload for debugging
    console.log('\n📦 Raw Payload:');
    console.log(JSON.stringify(req.body, null, 2));
    
    // Parse the webhook payload
    const parsedData = parseAdoWebhook(req.body);
    
    if (!parsedData) {
      console.log('\n⚠️  No iteration change detected or unable to parse payload');
      return res.status(200).json({ 
        message: 'Webhook received',
        note: 'No iteration change detected'
      });
    }
    
    // Extract organization and project info
    const orgAndProject = extractOrgAndProject(req.body);
    
    if (!orgAndProject) {
      console.log('\n⚠️  Could not extract organization and project from webhook');
      return res.status(200).json({ 
        message: 'Webhook received',
        note: 'Could not extract organization information'
      });
    }
    
    // Check if ADO PAT is configured
    if (!process.env.ADO_PAT) {
      console.log('\n⚠️  ADO_PAT not configured, cannot validate or revert');
      
      // Log extracted data
      console.log('\n' + '─'.repeat(80));
      console.log('📊 EXTRACTED DATA (Validation Disabled):');
      console.log('─'.repeat(80));
      console.log(`🔑 Work Item ID:       ${parsedData.workItemId}`);
      console.log(`📅 Old Iteration Path: ${parsedData.oldIterationPath}`);
      console.log(`📅 New Iteration Path: ${parsedData.newIterationPath}`);
      console.log(`👤 Changed By:         ${parsedData.changedBy}`);
      console.log(`🕐 Changed Date:       ${parsedData.changedDate}`);
      console.log('─'.repeat(80));
      
      return res.status(200).json({ 
        message: 'Webhook received',
        note: 'ADO_PAT not configured - validation and revert disabled',
        data: parsedData
      });
    }
    
    // If old iteration path is not available, fetch it
    if (parsedData.oldIterationPath === 'N/A (not provided in webhook)' || !parsedData.oldIterationPath) {
      console.log('\n🔄 Old iteration path not in webhook, fetching from API...');
      
      if (orgAndProject) {
        const oldPath = await getPreviousIterationPath(
          orgAndProject.orgUrl,
          orgAndProject.project,
          parsedData.workItemId,
          process.env.ADO_PAT,
          parsedData.newIterationPath
        );
        
        if (oldPath) {
          parsedData.oldIterationPath = oldPath;
        } else {
          parsedData.oldIterationPath = 'N/A';
        }
      } else {
        console.log('⚠️  Cannot fetch old iteration - organization info not available');
        parsedData.oldIterationPath = 'N/A';
      }
    }
    
    // Log extracted data
    console.log('\n' + '─'.repeat(80));
    console.log('📊 EXTRACTED DATA:');
    console.log('─'.repeat(80));
    console.log(`🔑 Work Item ID:       ${parsedData.workItemId}`);
    console.log(`📅 Old Iteration Path: ${parsedData.oldIterationPath}`);
    console.log(`📅 New Iteration Path: ${parsedData.newIterationPath}`);
    console.log(`👤 Changed By:         ${parsedData.changedBy}`);
    console.log(`🕐 Changed Date:       ${parsedData.changedDate}`);
    console.log('─'.repeat(80));
    
    // Validate if the new iteration has started (only if we have org info)
    if (!orgAndProject) {
      console.log('\n⚠️  Cannot validate iteration - organization info not available');
      console.log('   Allowing change by default');
      
      return res.status(200).json({ 
        message: 'Webhook received',
        note: 'Cannot validate iteration - organization info missing',
        data: parsedData
      });
    }
    
    console.log('\n🔍 VALIDATING ITERATION STATUS...');
    console.log(`   Organization URL: ${orgAndProject.orgUrl}`);
    console.log(`   Project:          ${orgAndProject.TeamProject}`);
    console.log(`   New Iteration:    ${parsedData.newIterationPath}`);
    
    const newIteration = await getIterationDetails(
      orgAndProject.orgUrl,
      orgAndProject.project,
      parsedData.newIterationPath,
      process.env.ADO_PAT
    );
    
    if (!newIteration) {
      console.log('⚠️  Could not retrieve iteration details, allowing change');
      return res.status(200).json({ 
        message: 'Webhook received',
        note: 'Could not validate iteration - change allowed',
        data: parsedData
      });
    }
    
    console.log(`📅 Iteration Details:`);
    console.log(`   Name: ${newIteration.name}`);
    console.log(`   Start Date: ${newIteration.startDate || 'N/A'}`);
    console.log(`   Finish Date: ${newIteration.finishDate || 'N/A'}`);
    console.log(`   Time Frame: ${newIteration.timeFrame}`);
    
    const iterationStarted = hasIterationStarted(newIteration);
    
    if (iterationStarted) {
      console.log('\n🚫 ITERATION HAS STARTED');
      
      // Check if the user making the change is a board manager
      const userIsBoardManager = isUserBoardManager(parsedData.changedBy);
      
      if (userIsBoardManager) {
        console.log('✅ USER IS BOARD MANAGER - ALLOWING CHANGE');
        console.log(`   User: ${parsedData.changedBy}`);
        console.log(`   Board managers can add items to started iterations`);
        console.log('='.repeat(80) + '\n');
        
        return res.status(200).json({ 
          message: 'Iteration change allowed - board manager override',
          action: 'ALLOWED',
          reason: 'User is a board manager',
          data: {
            ...parsedData,
            iterationStartDate: newIteration.startDate,
            boardManagerOverride: true
          }
        });
      }
      
      console.log('🚫 USER IS NOT BOARD MANAGER - REVERTING CHANGE');
      console.log(`   User: ${parsedData.changedBy}`);
      console.log(`   Configured board managers: ${getBoardManagers().join(', ')}`);
      
      const boardManagerEmail = process.env.BOARD_MANAGER_EMAIL || 'your board manager';
      const reason = `⚠️ <b>Iteration "${newIteration.name}" has already started!</b><br/><br/>` +
                     `Work items cannot be added to an iteration that has already started.<br/>` +
                     `Please contact ${boardManagerEmail} if you need to make changes to the current sprint.<br/><br/>` +
                     `<b>Action Taken:</b> Work item has been automatically moved back to "${parsedData.oldIterationPath}"`;
      
      // Revert the work item
      try {
        const revertResult = await revertWorkItemIteration(
          orgAndProject.orgUrl,
          orgAndProject.project,
          parsedData.workItemId,
          parsedData.oldIterationPath,
          process.env.ADO_PAT,
          reason
        );
        
        console.log('✅ Successfully reverted work item to previous iteration');
        console.log(`   Work Item ID: ${revertResult.workItemId}`);
        console.log(`   Reverted to: ${revertResult.newIterationPath}`);
        
        // Add a comment to notify the user
        const commentText = `⚠️ <b>AUTOMATIC REVERSION NOTICE</b><br/><br/>` +
                          `Your attempt to move this work item to iteration "<b>${parsedData.newIterationPath}</b>" was automatically reverted.<br/><br/>` +
                          `<b>Reason:</b> The iteration has already started (started on ${new Date(newIteration.startDate).toLocaleDateString()}).<br/><br/>` +
                          `Work items cannot be added to started iterations to maintain sprint integrity.<br/><br/>` +
                          `<b>If you need to add this work item to the current sprint:</b><br/>` +
                          `Please contact ${boardManagerEmail} who can approve and make the change.<br/><br/>` +
                          `This work item has been returned to: <b>${parsedData.oldIterationPath}</b>`;
        
        await addWorkItemComment(
          orgAndProject.orgUrl,
          orgAndProject.project,
          parsedData.workItemId,
          commentText,
          process.env.ADO_PAT
        );
        
        console.log('='.repeat(80) + '\n');
        
        return res.status(200).json({ 
          message: 'Iteration change prevented and reverted',
          action: 'REVERTED',
          reason: 'Iteration has already started',
          data: {
            ...parsedData,
            revertedTo: revertResult.newIterationPath,
            iterationStartDate: newIteration.startDate,
            boardManagerContact: boardManagerEmail
          }
        });
        
      } catch (revertError) {
        console.error('❌ Failed to revert work item:', revertError.message);
        console.log('='.repeat(80) + '\n');
        
        return res.status(200).json({ 
          message: 'Webhook received - revert failed',
          action: 'REVERT_FAILED',
          error: revertError.message,
          data: parsedData
        });
      }
      
    } else {
      console.log('\n✅ ITERATION HAS NOT STARTED - ALLOWING CHANGE');
      console.log('='.repeat(80) + '\n');
      
      return res.status(200).json({ 
        message: 'Webhook received',
        action: 'ALLOWED',
        note: 'Iteration has not started yet - change allowed',
        data: parsedData
      });
    }
    
  } catch (error) {
    console.error('\n❌ ERROR PROCESSING WEBHOOK:');
    console.error(error);
    console.log('='.repeat(80) + '\n');
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export default router;
