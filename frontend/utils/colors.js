// Material Design color palette (the 500 series).
// See: https://material-ui.com/style/color/#color-palette

const RED = '#F44336';
const PINK = '#E91E63';
const PURPLE = '#9C27B0';
const DEEP_PURPLE = '#673AB7';
const INDIGO = '#3F51B5';
const BLUE = '#2196F3';
const LIGHT_BLUE = '#03A9F4';
const CYAN = '#00BCD4';
const TEAL = '#009688';
const GREEN = '#4CAF50';
const LIGHT_GREEN = '#8BC34A';
const LIME = '#CDDC39';
const YELLOW = '#FFEB3B';
const AMBER = '#FFC107';
const ORANGE = '#FF9800';
const DEEP_ORANGE = '#FF5722';
const BROWN = '#795548';
const GRAY = '#9E9E9E';
const BLUE_GRAY = '#607D8B';

// Semantic colors.

const SUCCESS = GREEN;
const WARNING = AMBER;
const ERROR = RED;
const CANCELLED = BLUE_GRAY;
const MUTED = GRAY;
const LIGHT = '#E0E0E0';


export default {
  RED,
  PINK,
  PURPLE,
  DEEP_PURPLE,
  INDIGO,
  BLUE,
  LIGHT_BLUE,
  CYAN,
  TEAL,
  GREEN,
  LIGHT_GREEN,
  LIME,
  YELLOW,
  AMBER,
  ORANGE,
  DEEP_ORANGE,
  BROWN,
  GRAY,
  BLUE_GRAY,
  SUCCESS,
  WARNING,
  ERROR,
  CANCELLED,
  MUTED,
  LIGHT,

  guess(text) {
    if (!text || !text.trim()) {
      return LIGHT;
    }
    const lowerText = text.trim().toLowerCase();
    if (['success', 'succeed', 'succeeded', 'ok'].includes(lowerText)) {
      return SUCCESS;
    }
    if (['fail', 'failed', 'warn', 'warning'].includes(lowerText)) {
      return WARNING;
    }
    if (['cancel', 'cancelled', 'canceled'].includes(lowerText)) {
      return CANCELLED;
    }
    if (['error', 'fatal', 'abort', 'aborted'].includes(lowerText)) {
      return ERROR;
    }
    return BROWN;
  },

};
