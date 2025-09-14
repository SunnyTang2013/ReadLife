import React from 'react';
import { Link } from 'react-router-dom';

import { getJobConfigCategoriesByType } from '../../utils/constants';

const JobConfigCategoriesAside = ({ currentCategory = null }) => {
  const categoriesByType = getJobConfigCategoriesByType();

  const $cards = Object.keys(categoriesByType).map((type) => {
    const title = type.charAt(0).toUpperCase() + type.slice(1);
    const $items = categoriesByType[type].map((category) => {
      let className = 'list-group-item list-group-item-action';
      if (category === currentCategory) {
        className += ' active';
      }
      return (
        <Link
          key={category}
          className={className}
          to={`/job-config-group/list-by-category/${category}`}
        >
          {category}
        </Link>
      );
    });
    
    return (
      <div 
        key={`config-group-category-${type}`} 
        className="card mb-2"
      >
        <div className="card-header">{title}</div>
        <div className="list-group list-group-flush">{$items}</div>
      </div>
    );
  });

  return (
    <aside>
      <h2 className="lighter">Categories</h2>
      {$cards}
    </aside>
  );
};

export default JobConfigCategoriesAside;