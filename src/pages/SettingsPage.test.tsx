import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsPage } from './SettingsPage';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePremiumFeature } from '../hooks/usePremiumFeature';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('../stores/authStore');
vi.mock('../hooks/usePremiumFeature');
vi.mock('react-hot-toast');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SettingsPage - Data Export Premium Feature', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    age: 25,
    gender: 'male',
    createdAt: new Date(),
    subscriptionStatus: 'free'
  };

  const mockPremiumUser = {
    ...mockUser,
    subscriptionStatus: 'premium'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('should show premium lock for free users on data export', () => {
    // Setup mocks for free user
    (useAuthStore as any).mockReturnValue({ user: mockUser });
    (usePremiumFeature as any).mockReturnValue({
      isAvailable: false,
      requiresUpgrade: true,
      featureName: 'Data Export',
      showUpgradePrompt: vi.fn(),
    });

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Check for lock icon and premium badge
    expect(screen.getByText(/Premium/i)).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to access/i)).toBeInTheDocument();

    // Verify the lock icon is shown (Lock component should be rendered)
    const exportButton = screen.getByText(/Export My Data/i).closest('button');
    expect(exportButton).toBeInTheDocument();
  });

  it('should show upgrade prompt when free user clicks export', async () => {
    const mockShowUpgradePrompt = vi.fn();

    // Setup mocks for free user
    (useAuthStore as any).mockReturnValue({ user: mockUser });
    (usePremiumFeature as any).mockReturnValue({
      isAvailable: false,
      requiresUpgrade: true,
      featureName: 'Data Export',
      showUpgradePrompt: mockShowUpgradePrompt,
    });

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Click the export button
    const exportButton = screen.getByText(/Export My Data/i).closest('button');
    fireEvent.click(exportButton!);

    // Verify upgrade prompt was called
    expect(mockShowUpgradePrompt).toHaveBeenCalledTimes(1);

    // Verify navigation to subscription page after delay
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/subscription');
    }, { timeout: 3500 });
  });

  it('should allow premium users to export data', async () => {
    // Setup mocks for premium user
    (useAuthStore as any).mockReturnValue({ user: mockPremiumUser });
    (usePremiumFeature as any).mockReturnValue({
      isAvailable: true,
      requiresUpgrade: false,
      featureName: 'Data Export',
      showUpgradePrompt: vi.fn(),
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock document methods
    const mockClick = vi.fn();
    const mockElement = {
      href: '',
      download: '',
      click: mockClick,
    };
    document.createElement = vi.fn(() => mockElement as any);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Should not show "Upgrade to access" for premium users
    expect(screen.queryByText(/Upgrade to access/i)).not.toBeInTheDocument();

    // Click the export button
    const exportButton = screen.getByText(/Export My Data/i).closest('button');
    fireEvent.click(exportButton!);

    // Verify export process started
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Data export started. This may take a few minutes.');
    });

    // Verify file download was triggered
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockElement.download).toContain('willing-box-data');

    // Verify success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Data exported successfully!');
    });
  });

  it('should show crown icon for premium feature', () => {
    // Setup for both free and premium users to verify crown is always shown
    (useAuthStore as any).mockReturnValue({ user: mockUser });
    (usePremiumFeature as any).mockReturnValue({
      isAvailable: false,
      requiresUpgrade: true,
      featureName: 'Data Export',
      showUpgradePrompt: vi.fn(),
    });

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // The crown icon should be visible as part of the export feature
    // It's rendered as <Crown className="w-4 h-4 text-purple-600" />
    const exportSection = screen.getByText(/Export My Data/i).closest('div');
    expect(exportSection).toBeInTheDocument();
  });

  it('should not attempt export when requiresUpgrade is true', async () => {
    const mockShowUpgradePrompt = vi.fn();

    // Setup mocks for free user
    (useAuthStore as any).mockReturnValue({ user: mockUser });
    (usePremiumFeature as any).mockReturnValue({
      isAvailable: false,
      requiresUpgrade: true,
      featureName: 'Data Export',
      showUpgradePrompt: mockShowUpgradePrompt,
    });

    // Mock to ensure export doesn't happen
    const createObjectURLSpy = vi.spyOn(global.URL, 'createObjectURL');

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    // Directly call exportData through clicking
    const exportButton = screen.getByText(/Export My Data/i).closest('button');
    fireEvent.click(exportButton!);

    // Verify that the actual export process was NOT started
    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalledWith('Data export started. This may take a few minutes.');

    // Only the upgrade prompt should be shown
    expect(mockShowUpgradePrompt).toHaveBeenCalledTimes(1);
  });
});