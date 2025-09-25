/**
 * Example Usage of Mock Data Service
 * Demonstrates how to use the mock service in components
 */

import React, { useEffect, useState } from 'react';
import {
  mockUsers,
  mockInnermosts,
  mockWillingBoxes,
  testScenarios,
  createMockUser,
  createMockWishList,
  scenarioBuilders,
  initializeMocks,
} from './index';

// ============================================
// EXAMPLE 1: Using Static Mock Data
// ============================================

export function UserListExample() {
  return (
    <div>
      <h2>All Users</h2>
      <ul>
        {mockUsers.map(user => (
          <li key={user.id}>
            {user.displayName} - {user.subscriptionStatus}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// EXAMPLE 2: Using Factory Functions
// ============================================

export function CreateUserExample() {
  const [users, setUsers] = useState<any[]>([]);

  const addUser = () => {
    const newUser = createMockUser({
      displayName: `User ${users.length + 1}`,
      subscriptionStatus: Math.random() > 0.5 ? 'premium' : 'free',
    });
    setUsers([...users, newUser]);
  };

  return (
    <div>
      <button onClick={addUser}>Add Random User</button>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.displayName}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// EXAMPLE 3: Using Test Scenarios
// ============================================

export function ScenarioExample() {
  const [scenario, setScenario] = useState<string>('emptyState');

  const scenarios = {
    emptyState: testScenarios.emptyState,
    activeGame: testScenarios.activeGame,
    maxCapacity: testScenarios.maxCapacity,
    freeUserLimits: testScenarios.freeUserLimits,
  };

  const currentScenario = scenarios[scenario as keyof typeof scenarios];

  return (
    <div>
      <select
        value={scenario}
        onChange={(e) => setScenario(e.target.value)}
      >
        <option value="emptyState">Empty State</option>
        <option value="activeGame">Active Game</option>
        <option value="maxCapacity">Max Capacity</option>
        <option value="freeUserLimits">Free User Limits</option>
      </select>

      <div>
        <h3>User: {currentScenario.user.displayName}</h3>
        <p>Subscription: {currentScenario.user.subscriptionStatus}</p>
        <p>Active Relationships: {currentScenario.user.activeInnermosts.length}</p>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 4: Using MSW for API Calls
// ============================================

export function APIExample() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'alice@example.com',
          password: 'password123',
        }),
      });

      if (!response.ok) {
        throw new Error('Sign in failed');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <div>
          <h3>Welcome, {user.displayName}!</h3>
          <p>Email: {user.email}</p>
          <p>Status: {user.subscriptionStatus}</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <div>
          <button onClick={signIn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In (Mock)'}
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

// ============================================
// EXAMPLE 5: Using Scenario Builders
// ============================================

export function GameScenarioExample() {
  const [gameData, setGameData] = useState<any>(null);

  useEffect(() => {
    // Create a complete game scenario
    const scenario = scenarioBuilders.createCompleteGameScenario('player-1');
    setGameData(scenario);
  }, []);

  if (!gameData) return <div>Loading...</div>;

  return (
    <div>
      <h2>Game Scenario</h2>

      <div>
        <h3>Players</h3>
        <p>{gameData.user.displayName} vs {gameData.partner.displayName}</p>
      </div>

      <div>
        <h3>Relationship</h3>
        <p>Week: {gameData.innermost.currentWeek}</p>
        <p>Status: {gameData.innermost.status}</p>
      </div>

      <div>
        <h3>Current Willing Box</h3>
        <p>Status: {gameData.willingBox.status}</p>
        <p>Week: {gameData.willingBox.weekNumber}</p>
        <p>Locked: {gameData.willingBox.isLocked ? 'Yes' : 'No'}</p>
      </div>

      <div>
        <h3>Weekly Score</h3>
        <p>Player A: {gameData.weeklyScore.partnerAScore}</p>
        <p>Player B: {gameData.weeklyScore.partnerBScore}</p>
        <p>Complete: {gameData.weeklyScore.isComplete ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 6: Testing Different States
// ============================================

export function StateTestingExample() {
  const [state, setState] = useState<'loading' | 'empty' | 'data' | 'error'>('data');

  const getContent = () => {
    switch (state) {
      case 'loading':
        return <div>Loading willing boxes...</div>;

      case 'empty':
        return (
          <div>
            <p>No willing boxes found.</p>
            <button>Create Your First Willing Box</button>
          </div>
        );

      case 'error':
        return (
          <div style={{ color: 'red' }}>
            <p>Failed to load data</p>
            <button>Retry</button>
          </div>
        );

      case 'data':
        return (
          <div>
            {mockWillingBoxes.slice(0, 3).map(box => (
              <div key={box.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
                <h4>Week {box.weekNumber}</h4>
                <p>Status: {box.status}</p>
                <p>Partner A Wishes: {box.partnerAWishList.length}</p>
                <p>Partner B Wishes: {box.partnerBWishList.length}</p>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div>
      <h2>Test Different UI States</h2>
      <div>
        <button onClick={() => setState('loading')}>Show Loading</button>
        <button onClick={() => setState('empty')}>Show Empty</button>
        <button onClick={() => setState('data')}>Show Data</button>
        <button onClick={() => setState('error')}>Show Error</button>
      </div>
      <div style={{ marginTop: '20px' }}>
        {getContent()}
      </div>
    </div>
  );
}

// ============================================
// MAIN DEMO COMPONENT
// ============================================

export function MockServiceDemo() {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    // Initialize MSW in development
    if (process.env.NODE_ENV === 'development') {
      initializeMocks().then(() => {
        setMswReady(true);
        console.log('Mock Service Worker initialized');
      });
    } else {
      setMswReady(true);
    }
  }, []);

  if (!mswReady) {
    return <div>Initializing mock service...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Willing Tree Mock Service Examples</h1>

      <section style={{ marginBottom: '40px' }}>
        <UserListExample />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Dynamic User Creation</h2>
        <CreateUserExample />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Test Scenarios</h2>
        <ScenarioExample />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Mock API Calls</h2>
        <APIExample />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <GameScenarioExample />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <StateTestingExample />
      </section>
    </div>
  );
}

export default MockServiceDemo;