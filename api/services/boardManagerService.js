/**
 * Check if a user is a board manager
 * @param {string} userIdentifier - User's display name, unique name, or email
 * @returns {boolean} True if user is a board manager
 */
export function isBoardManager(userIdentifier) {
  if (!userIdentifier) {
    return false;
  }
  
  const boardManagers = process.env.BOARD_MANAGERS;
  
  if (!boardManagers) {
    console.log('⚠️  BOARD_MANAGERS not configured, no bypass allowed');
    return false;
  }
  
  // Parse comma-separated list of board managers
  const managerList = boardManagers
    .split(',')
    .map(m => m.trim().toLowerCase())
    .filter(m => m);
  
  // Normalize user identifier for comparison
  const normalizedUser = userIdentifier.trim().toLowerCase();
  
  // Check if user is in the board managers list
  const isManager = managerList.includes(normalizedUser);
  
  if (isManager) {
    console.log(`✅ User "${userIdentifier}" is a board manager - bypass allowed`);
  }
  
  return isManager;
}

/**
 * Get list of board managers
 * @returns {Array<string>} List of board manager identifiers
 */
export function getBoardManagers() {
  const boardManagers = process.env.BOARD_MANAGERS;
  
  if (!boardManagers) {
    return [];
  }
  
  return boardManagers
    .split(',')
    .map(m => m.trim())
    .filter(m => m);
}

/**
 * Extract user identifier from ADO changed by field
 * @param {Object} changedBy - Changed by object or string
 * @returns {Array<string>} Array of possible user identifiers (displayName, uniqueName, email)
 */
export function extractUserIdentifiers(changedBy) {
  const identifiers = [];
  
  if (!changedBy) {
    return identifiers;
  }
  
  // If changedBy is a string
  if (typeof changedBy === 'string') {
    identifiers.push(changedBy);
    return identifiers;
  }
  
  // If changedBy is an object, extract all relevant fields
  if (changedBy.displayName) {
    identifiers.push(changedBy.displayName);
  }
  
  if (changedBy.uniqueName) {
    identifiers.push(changedBy.uniqueName);
  }
  
  if (changedBy.email) {
    identifiers.push(changedBy.email);
  }
  
  return identifiers;
}

/**
 * Check if any of the user's identifiers match a board manager
 * @param {Object|string} changedBy - Changed by field from ADO
 * @returns {boolean} True if user is a board manager
 */
export function isUserBoardManager(changedBy) {
  const identifiers = extractUserIdentifiers(changedBy);
  
  for (const identifier of identifiers) {
    if (isBoardManager(identifier)) {
      return true;
    }
  }
  
  return false;
}
