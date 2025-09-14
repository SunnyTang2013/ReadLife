import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteModal from '../DeleteModal';

// Mock StaticModal component
jest.mock('../StaticModal', () => ({ isOpen, children }) => 
  isOpen ? <div data-testid="static-modal">{children}</div> : null
);

describe('DeleteModal', () => {
  const defaultProps = {
    name: 'Test Item',
    title: 'Job',
    openModal: true,
    onDelete: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<DeleteModal {...defaultProps} />);
    expect(screen.getByText('Delete Job')).toBeInTheDocument();
  });

  it('should display the correct item name', () => {
    render(<DeleteModal {...defaultProps} />);
    expect(screen.getByText(/Test Item/)).toBeInTheDocument();
  });

  it('should display warning message', () => {
    render(<DeleteModal {...defaultProps} />);
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', () => {
    const handleDelete = jest.fn();
    const props = {
      ...defaultProps,
      onDelete: handleDelete,
    };
    
    render(<DeleteModal {...props} />);
    const deleteButton = screen.getByText('Delete This Job!');
    fireEvent.click(deleteButton);
    
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', () => {
    const handleClose = jest.fn();
    const props = {
      ...defaultProps,
      onClose: handleClose,
    };
    
    render(<DeleteModal {...props} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should disable fieldset when submitting', async () => {
    render(<DeleteModal {...defaultProps} />);
    const deleteButton = screen.getByText('Delete This Job!');
    
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      const fieldset = screen.getByRole('group');
      expect(fieldset).toBeDisabled();
    });
  });

  it('should not render when openModal is false', () => {
    const props = {
      ...defaultProps,
      openModal: false,
    };
    
    render(<DeleteModal {...props} />);
    expect(screen.queryByTestId('static-modal')).not.toBeInTheDocument();
  });

  it('should display custom title', () => {
    const props = {
      ...defaultProps,
      title: 'Pipeline',
    };
    
    render(<DeleteModal {...props} />);
    expect(screen.getByText('Delete Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Delete This Pipeline!')).toBeInTheDocument();
  });

  it('should display custom name', () => {
    const props = {
      ...defaultProps,
      name: 'My Custom Item',
    };
    
    render(<DeleteModal {...props} />);
    expect(screen.getByText(/My Custom Item/)).toBeInTheDocument();
  });

  it('should show warning icon', () => {
    render(<DeleteModal {...defaultProps} />);
    const icon = screen.getByRole('alert').querySelector('i');
    expect(icon).toHaveClass('fa-exclamation-triangle');
  });

  it('should have proper button styling', () => {
    render(<DeleteModal {...defaultProps} />);
    
    const deleteButton = screen.getByText('Delete This Job!');
    expect(deleteButton).toHaveClass('btn', 'btn-danger', 'mr-2');
    
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toHaveClass('btn', 'btn-default');
  });
});