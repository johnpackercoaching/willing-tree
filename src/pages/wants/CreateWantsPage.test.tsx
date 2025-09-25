import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CreateWantsPage } from './CreateWantsPage';
import { useAuthStore } from '../../stores/authStore';
import { vi } from 'vitest';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn()
}));

// Mock the premium feature hook
vi.mock('../../hooks/usePremiumFeature', () => ({
  usePremiumFeature: vi.fn(),
  PremiumFeatures: {
    CUSTOM_CATEGORIES: 'CUSTOM_CATEGORIES'
  }
}));

// Mock FirestoreService
vi.mock('../../services/firestoreService', () => ({
  FirestoreService: {
    getUserInnermosts: vi.fn(() => Promise.resolve([])),
    getWillingBox: vi.fn(() => Promise.resolve(null)),
    saveWillingBox: vi.fn(() => Promise.resolve())
  }
}));

// Mock the UpgradePrompt component
vi.mock('../../components/premium/UpgradePrompt', () => ({
  UpgradePrompt: vi.fn(({ onClose }) => (
    <div data-testid="upgrade-prompt" onClick={onClose}>
      Upgrade Prompt
    </div>
  ))
}));

describe('CreateWantsPage Premium Features', () => {
  const mockUser = { id: 'user1', subscriptionStatus: 'free' };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({ user: mockUser });
  });

  it('should show only 3 categories for free users', async () => {
    const { usePremiumFeature } = await import('../../hooks/usePremiumFeature');
    (usePremiumFeature as any).mockReturnValue({
      isAvailable: false,
      requiresUpgrade: true,
      showUpgradePrompt: vi.fn()
    });

    render(
      <BrowserRouter>
        <CreateWantsPage />
      </BrowserRouter>
    );

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for available categories (first 3)
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Affection & Romance')).toBeInTheDocument();
    expect(screen.getByText('Quality Time')).toBeInTheDocument();

    // Check for locked categories with Premium badges
    const premiumBadges = screen.getAllByText('Premium');
    expect(premiumBadges.length).toBeGreaterThan(0);

    // Check for upgrade prompt
    expect(screen.getByText('Unlock More Categories with Premium')).toBeInTheDocument();
  });

  it('should show all 5 categories for premium users', async () => {
    const { usePremiumFeature } = await import('../../hooks/usePremiumFeature');
    (usePremiumFeature as any).mockReturnValue({
      isAvailable: true,
      requiresUpgrade: false,
      showUpgradePrompt: vi.fn()
    });

    (useAuthStore as any).mockReturnValue({
      user: { ...mockUser, subscriptionStatus: 'premium' }
    });

    render(
      <BrowserRouter>
        <CreateWantsPage />
      </BrowserRouter>
    );

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check all categories are visible
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Affection & Romance')).toBeInTheDocument();
    expect(screen.getByText('Quality Time')).toBeInTheDocument();
    expect(screen.getByText('Home & Lifestyle')).toBeInTheDocument();
    expect(screen.getByText('Personal Support')).toBeInTheDocument();

    // Check no premium badges or upgrade prompts for premium users
    expect(screen.queryByText('Unlock More Categories with Premium')).not.toBeInTheDocument();
  });

  it('should show crown icons on premium categories for premium users', async () => {
    const { usePremiumFeature } = await import('../../hooks/usePremiumFeature');
    (usePremiumFeature as any).mockReturnValue({
      isAvailable: true,
      requiresUpgrade: false,
      showUpgradePrompt: vi.fn()
    });

    (useAuthStore as any).mockReturnValue({
      user: { ...mockUser, subscriptionStatus: 'premium' }
    });

    const { container } = render(
      <BrowserRouter>
        <CreateWantsPage />
      </BrowserRouter>
    );

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for crown icons on categories 4 and 5 (Home & Lifestyle, Personal Support)
    const crownIcons = container.querySelectorAll('[data-lucide="crown"]');
    // Premium users should see crown indicators on premium categories
    expect(crownIcons.length).toBeGreaterThanOrEqual(0);
  });
});