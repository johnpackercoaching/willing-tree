# UpgradePrompt Component

A beautiful, animated component for prompting users to upgrade to premium features in the Willing Tree application.

## Features

- **Two display modes**: Inline (embedded in page) or Modal (overlay)
- **Smooth animations**: Powered by Framer Motion with staggered entrance effects
- **Customizable content**: Feature name, description, and benefits list
- **Visual appeal**: Animated crown icon with glow effect, gradient backgrounds
- **User-friendly**: Escape key support for modal, clear CTAs
- **Responsive design**: Works perfectly on all screen sizes

## Installation

The component is already integrated into the project. Import it from:

```typescript
import { UpgradePrompt } from '@/components/premium/UpgradePrompt';
// or
import { UpgradePrompt } from '@/components/premium';
```

## Usage

### Basic Inline Usage

```tsx
<UpgradePrompt
  feature="Advanced Analytics"
  description="Get deeper insights into your relationships."
/>
```

### Modal with Custom Benefits

```tsx
const [showModal, setShowModal] = useState(false);

<UpgradePrompt
  feature="Multiple Innermosts"
  description="Create up to 3 Innermosts."
  benefits={[
    'Up to 3 Active Innermosts',
    'Priority Support',
    'Data Export'
  ]}
  showModal={true}
  onClose={() => setShowModal(false)}
/>
```

### Integration with Premium Hooks

```tsx
const analytics = usePremiumFeature(PremiumFeatures.ANALYTICS_DASHBOARD);

if (analytics.requiresUpgrade) {
  return (
    <UpgradePrompt
      feature="Analytics Dashboard"
      description="Unlock powerful insights about your relationships."
      showModal={false}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `feature` | `string` | Required | The name of the premium feature |
| `description` | `string` | Optional | Additional description of the feature |
| `benefits` | `string[]` | Optional | List of benefits (defaults to premium plan features) |
| `onClose` | `() => void` | Optional | Callback when modal is closed |
| `showModal` | `boolean` | `false` | Whether to show as modal or inline |

## Examples

### 1. Feature Gate

```tsx
export const PremiumFeature = () => {
  const feature = usePremiumFeature(PremiumFeatures.DATA_EXPORT);

  if (feature.requiresUpgrade) {
    return <UpgradePrompt feature="Data Export" />;
  }

  return <ActualFeatureComponent />;
};
```

### 2. Action Trigger

```tsx
const handlePremiumAction = () => {
  if (!isPremium) {
    setShowUpgrade(true);
    return;
  }
  // Perform action
};
```

### 3. Usage Limit

```tsx
<UpgradePrompt
  feature="Increased Limit"
  description={`You're using ${current} of ${limit} items.`}
  showModal={true}
  onClose={handleClose}
/>
```

## Styling

The component uses:
- Tailwind CSS classes for styling
- Custom color scheme from `tailwind.config.mjs` (primary, willing, bark colors)
- Framer Motion for animations
- Lucide React for icons

## Animation Details

- **Crown icon**: Rotates and scales with a glow effect
- **Benefits list**: Staggered entrance with check mark animations
- **Sparkles**: Continuous rotation and scale animation
- **Modal**: Smooth fade in/out with backdrop blur

## Best Practices

1. **Use inline mode** for feature previews and empty states
2. **Use modal mode** for action-triggered upgrades
3. **Customize benefits** to be specific to the feature
4. **Keep descriptions concise** and value-focused
5. **Integrate with existing hooks** for consistency

## Files

- `UpgradePrompt.tsx` - Main component
- `UpgradePromptDemo.tsx` - Demo page with examples
- `UpgradePromptIntegration.tsx` - Integration examples
- `index.ts` - Export file

## Dependencies

- `framer-motion` - Animation library
- `lucide-react` - Icon library
- `react-router-dom` - Routing for subscription link
- Existing Button component and subscription service

## Testing

Run the demo page to see all variations:

```tsx
import { UpgradePromptDemo } from '@/components/premium/UpgradePromptDemo';

// Add to your routes or render directly
<UpgradePromptDemo />
```

## Future Enhancements

- A/B testing different messages
- Analytics tracking for conversion
- Seasonal themes and promotions
- Animated progress indicators for usage limits
- Testimonials or social proof integration