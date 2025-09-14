import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import ScorchPropTypes from '../proptypes/scorch';
import Alert from './Alert';

function extractItemNames(forest) {
  if (!forest || forest.length === 0) {
    return [];
  }
  let names = forest.map(item => item.name);
  for (let i = 0; i < forest.length; i++) {
    const item = forest[i];
    const childNames = extractItemNames(item.children);
    names = names.concat(childNames);
  }
  return names;
}

function extractSubItems(forest, rootName) {
  if (!forest || forest.length === 0) {
    return [];
  }
  if (!rootName) {
    return forest.filter(item => !item.parentName);
  }
  return forest.filter(item => item.parentName === rootName);
}

function Forest({ forest, expanded = false, onClickItem }) {
  const [name, setName] = useState('');
  const [expandedNames, setExpandedNames] = useState([]);
  const [dropTarget, setDropTarget] = useState({
    jobGroupId: null,
    refCount: 0,
  });

  /**
   * Expands all items.
   */
  const onExpandAll = useCallback(() => {
    const allNames = extractItemNames(forest);
    setExpandedNames(allNames);
  }, [forest]);

  /**
   * Collapse all items.
   */
  const onCollapseAll = useCallback(() => {
    setExpandedNames([]);
  }, []);

  /**
   * Toggles collapse/expand for the given item.
   */
  const onToggleCollapse = useCallback((item) => {
    const itemName = item.name;
    setExpandedNames((prevExpandedNames) => {
      const newExpandedNames = prevExpandedNames.slice();
      const index = newExpandedNames.indexOf(itemName);
      if (index < 0) {
        // This item was not expanded: Expand it.
        newExpandedNames.push(itemName);
      } else {
        // This item was expanded: Collapse it.
        newExpandedNames.splice(index, 1);
      }
      return newExpandedNames;
    });
    setName(itemName);
  }, []);

  /**
   * Renders the given item, as well as its related actions, in an element. This function does
   * not render the sub items.
   */
  const renderItemCard = useCallback((item, isExpanded, childLength) => {
    const isHighlighted = dropTarget.name === item.name;
    const isBold = name === item.name;

    let $collapseToggle = null;
    if (childLength === 0) {
      $collapseToggle = (
        <span className="text-muted mr-1">
          <i className="fa fa-fw fa-square-o" />
        </span>
      );
    } else {
      let $icon = null;
      if (isExpanded) {
        $icon = <i className="fa fa-fw fa-minus-square-o" />;
      } else {
        $icon = <i className="fa fa-fw fa-plus-square-o" />;
      }
      $collapseToggle = (
        <button className="anchor mr-1" type="button" onClick={() => onToggleCollapse(item)}>
          {$icon}
        </button>
      );
    }

    return (
      <div
        className={`sco-job-group d-flex justify-content-between ${isHighlighted && 'bg-highlight'}`}
        id={item.name}
      >
        <div>
          {$collapseToggle}
          <button
            type="button"
            className={`${isBold && 'font-weight-bold'} btn btn-link`}
            onClick={() => onClickItem && onClickItem(item)}
          >
            {item.name}
          </button>
        </div>
      </div>
    );
  }, [dropTarget.name, name, onToggleCollapse, onClickItem]);

  /**
   * Builds and returns a list of the item hierarchy recursively.
   */
  const renderForestRecursively = useCallback((forestData, rootName, path = []) => {
    if (!forestData || forestData.length === 0) {
      return null;
    }

    const $items = [];
    const subItems = extractSubItems(forestData, rootName);
    for (let i = 0; i < subItems.length; i++) {
      const item = subItems[i];
      if (path.indexOf(item.name) !== -1) {
        return <Alert text={`DeadLoop encountered, check ${item.name}`} type="danger" />;
      }

      let $subItemList = null;
      const isExpanded = expandedNames.indexOf(item.name) >= 0;
      if (isExpanded) {
        const newPath = path.slice();
        newPath.push(item.name);
        $subItemList = renderForestRecursively(forestData, item.name, newPath);
      }
      const itemCard = renderItemCard(item, isExpanded,
        forestData.filter(child => child.parentName === item.name).length);

      const $item = (
        <li key={`item-${item.name}`}>
          {itemCard}
          {$subItemList}
        </li>
      );
      $items.push($item);
    }
    return (
      <ul className="sco-job-group-forest">{$items}</ul>
    );
  }, [expandedNames, renderItemCard]);

  useEffect(() => {
    if (expanded) {
      onExpandAll();
    }
  }, [expanded, onExpandAll]);

  if (!forest || forest.length === 0) {
    return (
      <div>
        <div className="text-muted">
          <i className="fa fa-fw fa-info-circle mr-1" />
          There are no hierarchies to show.
        </div>
      </div>
    );
  }

  const $forest = renderForestRecursively(forest);
  
  return (
    <div>
      <div className="d-flex justify-content-between">
        <ul className="align-self-end list-inline text-right text-sm mb-2">
          <li className="list-inline-item">
            <button className="anchor" type="button" onClick={onCollapseAll}>
              <i className="fa fa-fw fa-compress" /> Collapse All
            </button>
          </li>
          <li className="list-inline-item">
            <button className="anchor" type="button" onClick={onExpandAll}>
              <i className="fa fa-fw fa-expand" /> Expand All
            </button>
          </li>
        </ul>
      </div>
      {$forest}
    </div>
  );
}

Forest.propTypes = {
  forest: PropTypes.arrayOf(ScorchPropTypes.forest()).isRequired,
  expanded: PropTypes.bool,
  onClickItem: PropTypes.func,
};

Forest.defaultProps = {
  onClickItem: null,
  expanded: false,
};

export default Forest;