import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

function autoAdjustHeight(element) {
  if (element) {
    element.style.height = 'auto';
    const scrollHeight = element.scrollHeight;
    if (scrollHeight > 40) {
      element.style.height = `${scrollHeight}px`;
    }
  }
}

/**
 * A textarea whose height can grow dynamically to fit its content. To achieve this, we use a
 * non-resizable textarea and adjust its height to the scroll height.
 *
 * To achieve the effect, we have to use a ref to the HTML element and change its style outside of
 * React. There is no pure-CSS solution.
 */
function AutoGrowTextarea({ style = {}, ...otherProps }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    autoAdjustHeight(textareaRef.current);
  });

  const updatedStyle = {
    ...style,
    resize: 'none',
    height: 'auto',
    overflowY: 'hidden',
  };

  return (
    <textarea
      ref={textareaRef}
      rows="1"
      style={updatedStyle}
      {...otherProps}
    />
  );
}


AutoGrowTextarea.propTypes = {
  style: PropTypes.objectOf(PropTypes.string.isRequired),
};

export default AutoGrowTextarea;
