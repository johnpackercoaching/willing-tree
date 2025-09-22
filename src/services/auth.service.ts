import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  onAuthStateChanged,
  sendEmailVerification,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  createdAt: any;
  lastLogin: any;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  activeInnermosts: string[];
  subscriptionStatus: 'free' | 'premium' | 'expired';
  subscriptionEndDate?: Date;
}

class AuthService {
  private currentUser: FirebaseUser | null = null;
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        // Update last login
        this.updateLastLogin(user.uid);
      }
    });
  }

  // Sign up new user
  async signUp(email: string, password: string, displayName: string, age: number, gender: string): Promise<UserProfile> {
    try {
      // Create auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName });

      // Send email verification
      await sendEmailVerification(user);

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName,
        age,
        gender: gender as 'male' | 'female' | 'other',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        emailVerified: false,
        twoFactorEnabled: false,
        activeInnermosts: [],
        subscriptionStatus: 'free'
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      return userProfile;
    } catch (error: any) {
      // Preserve Firebase error codes for better error handling
      const err = {
        code: error.code,
        message: error.message
      };
      throw err;
    }
  }

  // Sign in existing user
  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Create profile for users who signed up before Firestore was integrated
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || user.email!.split('@')[0],
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          emailVerified: user.emailVerified,
          twoFactorEnabled: false,
          activeInnermosts: [],
          subscriptionStatus: 'free'
        };
        await setDoc(doc(db, 'users', user.uid), userProfile);
        return userProfile;
      }

      const userProfile = userDoc.data() as UserProfile;
      
      // Check if 2FA is enabled
      if (userProfile.twoFactorEnabled && multiFactor(user).enrolledFactors.length > 0) {
        // 2FA will be handled by Firebase UI automatically
        // 2FA verification would be required here
      }

      return userProfile;
    } catch (error: any) {
      // Preserve Firebase error codes for better error handling
      const err = {
        code: error.code,
        message: error.message
      };
      throw err;
    }
  }

  // Sign out
  async signOutUser(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error: any) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      // Preserve Firebase error codes
      const err = {
        code: error.code,
        message: error.message
      };
      throw err;
    }
  }

  // Get current user
  getCurrentUser(): FirebaseUser | null {
    return this.currentUser;
  }

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Update last login timestamp
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastLogin: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Setup 2FA with phone number
  async setupTwoFactor(phoneNumber: string): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');

    try {
      // Initialize recaptcha if not already done
      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }

      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        phoneNumber,
        this.recaptchaVerifier
      );

      // Store verification ID for later use
      sessionStorage.setItem('verificationId', verificationId);
      
      // Return verification ID to allow user to enter code
      return;
    } catch (error: any) {
      throw new Error(`2FA setup failed: ${error.message}`);
    }
  }

  // Verify 2FA code and enroll
  async verifyTwoFactorCode(verificationCode: string): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');

    try {
      const verificationId = sessionStorage.getItem('verificationId');
      if (!verificationId) throw new Error('No verification in progress');

      const phoneCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneCredential);
      
      // Enroll the phone number for 2FA
      await multiFactor(this.currentUser).enroll(multiFactorAssertion, 'Phone Number');

      // Update user profile to indicate 2FA is enabled
      await updateDoc(doc(db, 'users', this.currentUser.uid), {
        twoFactorEnabled: true
      });

      // Clean up
      sessionStorage.removeItem('verificationId');
    } catch (error: any) {
      throw new Error(`2FA verification failed: ${error.message}`);
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Wait for auth to be ready
  async waitForAuth(): Promise<FirebaseUser | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
}

export const authService = new AuthService();