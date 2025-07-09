import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import ComprehensiveDashboard from '../../pages/dashboard';

// Mock the next/head component
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: Array<React.ReactElement> }) => <>{children}</>,
  };
});

// Mock the Layout component
jest.mock('../components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactElement }) => <div>{children}</div>,
}));

describe('ComprehensiveDashboard', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderDashboard = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ComprehensiveDashboard />
      </QueryClientProvider>
    );

  beforeEach(() => {
    queryClient.clear();
  });

  it('renders the dashboard title', () => {
    renderDashboard();
    expect(screen.getByText('Comprehensive Dashboard')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderDashboard();
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('allows switching between different views', async () => {
    renderDashboard();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Test view switching
    const analyticsTab = screen.getByText('analytics');
    fireEvent.click(analyticsTab);
    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();

    const overviewTab = screen.getByText('overview');
    fireEvent.click(overviewTab);
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
  });

  it('allows changing time range', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const timeRangeSelect = screen.getByRole('combobox');
    fireEvent.change(timeRangeSelect, { target: { value: 'last7days' } });
    expect(timeRangeSelect).toHaveValue('last7days');
  });

  it('shows API connection status', () => {
    renderDashboard();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('displays project progress correctly', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows task status distribution', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Task Status Distribution')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('allows refreshing dashboard data', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh All');
    fireEvent.click(refreshButton);
    
    // Should show loading state again
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
}); 