/**
 * Utility functions for custom events
 */

/**
 * Trigger an event to notify that data has changed
 * This will cause the affectation status to refresh
 */
export const notifyDataChanged = () => {
  const event = new CustomEvent('dataChanged');
  window.dispatchEvent(event);
  console.log('🔔 Event dataChanged dispatched');
};

/**
 * Trigger an event to notify that data has been deleted (delete all)
 * This will cause the affectation status to refresh
 */
export const notifyDataDeleted = () => {
  const event = new CustomEvent('dataDeleted');
  window.dispatchEvent(event);
  console.log('🗑️ Event dataDeleted dispatched');
};

/**
 * Trigger an event to refresh affectation status
 */
export const refreshAffectationStatus = () => {
  notifyDataDeleted();
};
