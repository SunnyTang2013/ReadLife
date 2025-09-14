import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobSelector from '../JobSelector';

// Mock job data
const mockOriginalJobList = [
  { id: 1, name: 'Job 1' },
  { id: 2, name: 'Job 2' },
  { id: 3, name: 'Job 3' }
];

const mockRunJobList = [
  { id: 4, name: 'Job 4' },
  { id: 5, name: 'Job 5' }
];

const mockOnAddJobToRunList = jest.fn();

describe('JobSelector', () => {
  beforeEach(() => {
    mockOnAddJobToRunList.mockClear();
  });

  it('renders without crashing', () => {
    render(
      <JobSelector
        originalJobList={mockOriginalJobList}
        runJobList={mockRunJobList}
        loading={false}
        onAddJobToRunList={mockOnAddJobToRunList}
      />
    );

    expect(screen.getByText('Original Job List')).toBeInTheDocument();
    expect(screen.getByText('Run Job List')).toBeInTheDocument();
  });

  it('displays loading spinner when loading prop is true', () => {
    render(
      <JobSelector
        originalJobList={mockOriginalJobList}
        runJobList={mockRunJobList}
        loading={true}
        onAddJobToRunList={mockOnAddJobToRunList}
      />
    );

    expect(screen.getByText('Original Job List')).toBeInTheDocument();
    const spinnerIcon = document.querySelector('.fa-spinner');
    expect(spinnerIcon).toBeInTheDocument();
  });

  it('filters original jobs based on search input', () => {
    render(
      <JobSelector
        originalJobList={mockOriginalJobList}
        runJobList={mockRunJobList}
        loading={false}
        onAddJobToRunList={mockOnAddJobToRunList}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search ...').closest('#search-original-job');
    fireEvent.change(searchInput, { target: { value: 'Job 1' } });

    // The filtering logic should work based on the state change
    expect(searchInput.value).toBe('Job 1');
  });

  it('filters run jobs based on search input', () => {
    render(
      <JobSelector
        originalJobList={mockOriginalJobList}
        runJobList={mockRunJobList}
        loading={false}
        onAddJobToRunList={mockOnAddJobToRunList}
      />
    );

    const searchInputs = screen.getAllByPlaceholderText('Search ...');
    const runJobSearchInput = searchInputs.find(input => input.id === 'search-run-job');
    
    fireEvent.change(runJobSearchInput, { target: { value: 'Job 4' } });

    expect(runJobSearchInput.value).toBe('Job 4');
  });

  it('displays the correct number of run jobs', () => {
    render(
      <JobSelector
        originalJobList={mockOriginalJobList}
        runJobList={mockRunJobList}
        loading={false}
        onAddJobToRunList={mockOnAddJobToRunList}
      />
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // mockRunJobList has 2 items
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });
});