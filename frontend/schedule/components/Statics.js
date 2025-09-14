const Statics = {
  PAUSED: 'PAUSED',
  BLOCKED: 'BLOCKED',
  RESUME: 'RESUME',

  getActionFont(action) {
    let actionFont = null;
    switch (action) {
      case ('NORMAL' || 'COMPLETE' || 'ERROR' || 'NONE'):
        actionFont = true;
        break;
      case ('PAUSED' || 'BLOCKED'):
        actionFont = false;
        break;
      default:
        // we should not reach here
        actionFont = false;
        break;
    }
    return actionFont;
  },

  getTriggerFields() {
    return ['cronExpression', 'nextFireTime', 'previousSuccessfulRun', 'lastUpdateBy', 'action'];
  }
};

export default Statics;
