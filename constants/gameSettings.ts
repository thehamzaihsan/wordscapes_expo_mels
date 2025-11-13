/**
 * Global game settings and configuration
 */

export const GAME_SETTINGS = {
  // Multiplayer wheel auto-submit settings
  MULTIPLAYER_WHEEL: {
    // Delay in milliseconds before auto-submitting a word
    AUTO_SUBMIT_DELAY: 2500,
    
    // Minimum word length to trigger auto-submit timer
    MIN_WORD_LENGTH_FOR_AUTO_SUBMIT: 2,
    
    // Delay before clearing the wheel after submission (visual feedback)
    CLEAR_DELAY: 100,
  },
  
  // Single player wheel settings (if different from multiplayer)
  SINGLEPLAYER_WHEEL: {
    AUTO_SUBMIT_DELAY: 2500,
    MIN_WORD_LENGTH_FOR_AUTO_SUBMIT: 2,
    CLEAR_DELAY: 100,
  },
};
