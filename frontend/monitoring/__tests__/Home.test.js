import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../Home';

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Home Component', () => {
  test('renders monitoring dashboard title', () => {
    renderWithRouter(<Home />);
    
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  test('displays dashboard placeholder message', () => {
    renderWithRouter(<Home />);
    
    expect(screen.getByText('There should be a global dashboard...')).toBeInTheDocument();
  });

  test('renders all navigation links', () => {
    renderWithRouter(<Home />);
    
    // Check for all navigation links
    expect(screen.getByRole('link', { name: /Pipeline Requests/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Batch Requests/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Job Requests/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Execution System View/i })).toBeInTheDocument();
  });

  test('navigation links have correct href attributes', () => {
    renderWithRouter(<Home />);
    
    expect(screen.getByRole('link', { name: /Pipeline Requests/i })).toHaveAttribute('href', '/pipeline-request/list');
    expect(screen.getByRole('link', { name: /Batch Requests/i })).toHaveAttribute('href', '/batch-request/list');
    expect(screen.getByRole('link', { name: /Job Requests/i })).toHaveAttribute('href', '/job-request/list');
    expect(screen.getByRole('link', { name: /Execution System View/i })).toHaveAttribute('href', '/execution-system-view');
  });

  test('renders with correct CSS classes for layout', () => {
    renderWithRouter(<Home />);
    
    // Check for responsive grid classes
    const rows = screen.getAllByRole('generic').filter(el => el.className.includes('row'));
    expect(rows).toHaveLength(2);
    
    // Check for column classes
    const cols = screen.getAllByRole('generic').filter(el => el.className.includes('col-'));
    expect(cols.length).toBeGreaterThan(0);
  });

  test('displays Font Awesome icons', () => {
    renderWithRouter(<Home />);
    
    // Check for icon classes
    const icons = document.querySelectorAll('i.fa');
    expect(icons).toHaveLength(4); // 4 navigation items with icons
    
    // Check specific icon classes
    expect(document.querySelector('i.fa-plug')).toBeInTheDocument();
    expect(document.querySelector('i.fa-tasks')).toBeInTheDocument(); 
    expect(document.querySelector('i.fa-rocket')).toBeInTheDocument();
    expect(document.querySelector('i.fa-server')).toBeInTheDocument();
  });

  test('has proper accessibility structure', () => {
    renderWithRouter(<Home />);
    
    // Check for proper heading structure
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass('display-4');
    
    // Check for proper link structure
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    
    links.forEach(link => {
      expect(link).toHaveClass('app-link');
    });
  });

  test('matches snapshot', () => {
    const { container } = renderWithRouter(<Home />);
    expect(container.firstChild).toMatchSnapshot();
  });
});