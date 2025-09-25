import { FC } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const TermsPage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link
          to="/auth/signup"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Signup
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">1. Acceptance of Terms</h2>
            <p className="text-gray-600">
              By accessing and using The WillingTree application, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">2. Use License</h2>
            <p className="text-gray-600">
              Permission is granted to temporarily use The WillingTree for personal, non-commercial transitory viewing only.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">3. Privacy</h2>
            <p className="text-gray-600">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your visit to our application.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">4. User Account</h2>
            <p className="text-gray-600">
              You are responsible for maintaining the confidentiality of your account and password and for restricting access to your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">5. Contact Information</h2>
            <p className="text-gray-600">
              If you have any questions about these Terms, please contact us at support@willingtree.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};