import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { dataService } from '../services/data.service';
import { emailService } from '../services/email.service';

interface AuthComponentProps {
  onAuthSuccess: (user: any) => void;
}

export const AuthComponent: React.FC<AuthComponentProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Check for pairing code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setPairingCode(code);
    }
  }, []);

  // Auto-login check
  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.waitForAuth();
      if (user) {
        const profile = await authService.getUserProfile(user.uid);
        if (profile) {
          onAuthSuccess(profile);
        }
      }
    };
    checkAuth();
  }, [onAuthSuccess]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userProfile = await authService.signUp(
        email,
        password,
        displayName,
        parseInt(age),
        gender
      );

      // If there's a pairing code, accept the invitation
      if (pairingCode) {
        try {
          await dataService.acceptInnermost(pairingCode, userProfile.uid);
          setSuccess('Account created and pairing accepted! Check your email to verify your account.');
        } catch (pairError) {
          setSuccess('Account created! Check your email to verify your account. Pairing code was invalid.');
        }
      } else {
        setSuccess('Account created! Check your email to verify your account.');
      }

      // Auto-login after signup
      setTimeout(() => {
        onAuthSuccess(userProfile);
      }, 2000);
    } catch (err: any) {
      // Handle specific Firebase auth errors
      if (err.code === 'auth/email-already-in-use' || err.message?.includes('already in use')) {
        setError('This email is already registered. Please log in instead.');
        // Automatically switch to login mode after 2 seconds
        setTimeout(() => {
          setMode('login');
          setError('');
          setSuccess('Please log in with your existing account.');
        }, 2000);
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userProfile = await authService.signIn(email, password);
      
      // If there's a pairing code, accept it
      if (pairingCode && userProfile) {
        try {
          await dataService.acceptInnermost(pairingCode, userProfile.uid);
          setSuccess('Logged in and pairing accepted!');
        } catch (pairError) {
          // console.log('Could not accept pairing:', pairError);
        }
      }

      onAuthSuccess(userProfile);
    } catch (err: any) {
      // Handle specific Firebase auth errors
      if (err.message.includes('multi-factor')) {
        setShow2FA(true);
        setError('Please complete 2FA verification');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again or reset your password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later or reset your password.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(email);
      setSuccess('Password reset email sent! Check your inbox.');
      setTimeout(() => setMode('login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASetup = async () => {
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.setupTwoFactor(phoneNumber);
      setSuccess('Verification code sent to your phone');
    } catch (err: any) {
      setError(err.message || '2FA setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerification = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.verifyTwoFactorCode(verificationCode);
      setSuccess('2FA enabled successfully!');
      setShow2FA(false);
      
      // Continue with login
      const user = authService.getCurrentUser();
      if (user) {
        const profile = await authService.getUserProfile(user.uid);
        if (profile) {
          onAuthSuccess(profile);
        }
      }
    } catch (err: any) {
      setError(err.message || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #4a8b4a 0%, #6B5B45 100%)'}}>
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">🌳 The Willing Tree</h1>
          <p className="text-gray-600">Grow your relationship through caring actions</p>
        </div>

        {pairingCode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm">
              <strong>Pairing Code Detected:</strong> {pairingCode}
              <br />
              {mode === 'signup' ? 'Sign up to accept the invitation' : 'Log in to accept the invitation'}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm font-medium">{error}</p>
            {error.includes('already registered') && (
              <button
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="mt-2 text-red-700 underline text-sm hover:text-red-900"
              >
                Go to Login →
              </button>
            )}
            {(error.includes('password') || error.includes('credentials')) && mode === 'login' && (
              <button
                onClick={() => {
                  setMode('reset');
                  setError('');
                }}
                className="mt-2 text-red-700 underline text-sm hover:text-red-900"
              >
                Forgot Password? →
              </button>
            )}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* 2FA Setup/Verification */}
        {show2FA ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Two-Factor Authentication</h2>
            
            {!sessionStorage.getItem('verificationId') ? (
              <form onSubmit={(e) => { e.preventDefault(); handle2FASetup(); }}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handle2FAVerification(); }}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            )}
            
            <div id="recaptcha-container"></div>
          </div>
        ) : (
          <>
            {/* Login Form */}
            {mode === 'login' && (
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Logging in...' : 'Log In'}
                </button>
                <div className="mt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Forgot Password?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            )}

            {/* Signup Form */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min="18"
                      max="120"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            )}

            {/* Password Reset Form */}
            {mode === 'reset' && (
              <form onSubmit={handlePasswordReset}>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Enter your email and we'll send you a password reset link.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </button>
              </form>
            )}

            {/* Mode Switch with Clear CTAs */}
            <div className="mt-6">
              {mode === 'login' ? (
                <div className="text-center border-t pt-6">
                  <p className="text-gray-600 mb-3">New to The Willing Tree?</p>
                  <button
                    onClick={() => {
                      setMode('signup');
                      setError('');
                      setSuccess('');
                    }}
                    className="w-full bg-gray-100 text-green-700 py-2 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Create Your Account
                  </button>
                </div>
              ) : mode === 'signup' ? (
                <div className="text-center border-t pt-6">
                  <p className="text-gray-600 mb-3">Already have an account?</p>
                  <button
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccess('');
                    }}
                    className="w-full bg-gray-100 text-green-700 py-2 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Log In to Your Account
                  </button>
                </div>
              ) : (
                <div className="text-center border-t pt-6">
                  <button
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    ← Back to Login
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};