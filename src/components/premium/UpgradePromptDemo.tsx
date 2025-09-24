import { useState } from 'react';
import { UpgradePrompt } from './UpgradePrompt';
import { Button } from '../Button';

/**
 * Demo component to showcase the UpgradePrompt in different modes
 * This component is for development/testing purposes
 */
export const UpgradePromptDemo = () => {
  const [showModal, setShowModal] = useState(false);
  const [showInline, setShowInline] = useState(false);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">UpgradePrompt Component Demo</h1>
        <p className="text-gray-600 mb-8">
          This component can be used in two modes: inline or modal. Try both below.
        </p>
      </div>

      {/* Demo Controls */}
      <div className="bg-gray-100 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Try the Component</h2>

        <div className="flex gap-4">
          <Button
            onClick={() => setShowModal(true)}
            variant="primary"
          >
            Show Modal Version
          </Button>

          <Button
            onClick={() => setShowInline(!showInline)}
            variant="secondary"
          >
            {showInline ? 'Hide' : 'Show'} Inline Version
          </Button>
        </div>
      </div>

      {/* Inline Version Demo */}
      {showInline && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Inline Version (embedded in page):</h3>
          <UpgradePrompt
            feature="Advanced Analytics"
            description="Get deeper insights into your relationships with detailed analytics and trends."
            showModal={false}
          />
        </div>
      )}

      {/* Modal Version Demo */}
      {showModal && (
        <UpgradePrompt
          feature="Multiple Innermosts"
          description="Create up to 3 Innermosts to nurture multiple meaningful relationships simultaneously."
          benefits={[
            'Up to 3 Active Innermosts',
            'Advanced Analytics & Insights',
            'Priority Support',
            'Export Your Data',
            'Custom Want Categories',
            'Extended Score History'
          ]}
          showModal={true}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Usage Examples */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Usage Examples:</h3>

        <div className="space-y-3">
          <div className="bg-white rounded-md p-4">
            <p className="font-mono text-sm mb-2">1. Basic inline usage:</p>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`<UpgradePrompt
  feature="Advanced Analytics"
  description="Get deeper insights..."
/>`}
            </pre>
          </div>

          <div className="bg-white rounded-md p-4">
            <p className="font-mono text-sm mb-2">2. Modal with custom benefits:</p>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`<UpgradePrompt
  feature="Multiple Innermosts"
  description="Create up to 3..."
  benefits={customBenefits}
  showModal={true}
  onClose={() => setShow(false)}
/>`}
            </pre>
          </div>

          <div className="bg-white rounded-md p-4">
            <p className="font-mono text-sm mb-2">3. Integration with premium hooks:</p>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const { isPremium, showUpgrade } = usePremiumFeature();

if (!isPremium && needsPremium) {
  return <UpgradePrompt
    feature={featureName}
    showModal={true}
    onClose={() => showUpgrade(false)}
  />;
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Feature List */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Component Features:</h3>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Smooth Framer Motion animations</li>
          <li>Responsive design that works on all screen sizes</li>
          <li>Two display modes: inline or modal</li>
          <li>Customizable feature name and description</li>
          <li>Optional custom benefits list</li>
          <li>Escape key support for modal dismissal</li>
          <li>Animated crown icon with glow effect</li>
          <li>Staggered entrance animations for benefits</li>
          <li>Direct link to subscription page</li>
          <li>Trust badges for user confidence</li>
        </ul>
      </div>
    </div>
  );
};