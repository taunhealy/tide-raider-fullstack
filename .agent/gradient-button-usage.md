# GradientButton Component

A versatile, reusable button component with gradient styles, multiple variants, and built-in state management.

## Location
`app/components/ui/GradientButton.tsx`

## Features

- ✨ Multiple gradient variants (purple-pink, blue-purple, green-blue, orange-red)
- 📏 Three sizes (sm, md, lg)
- 🎨 Active/inactive states with smooth transitions
- 🔔 Optional badge support
- 🖼️ Optional icon support
- 🌙 Dark mode support
- ♿ Accessibility features (disabled states, proper ARIA)

## Basic Usage

### Import

```tsx
import GradientButton, { HiddenGemsButton } from "@/app/components/ui/GradientButton";
```

### Simple Button

```tsx
<GradientButton variant="purple-pink" active={true}>
  Click Me
</GradientButton>
```

### With Icon

```tsx
<GradientButton 
  variant="blue-purple" 
  icon={
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  }
>
  Success
</GradientButton>
```

### With Badge

```tsx
<GradientButton 
  variant="purple-pink" 
  active={true}
  badge="New"
>
  Features
</GradientButton>
```

### Different Sizes

```tsx
<GradientButton size="sm">Small</GradientButton>
<GradientButton size="md">Medium</GradientButton>
<GradientButton size="lg">Large</GradientButton>
```

## Variants

### purple-pink (Default)
Perfect for special features, hidden gems, premium content
```tsx
<GradientButton variant="purple-pink" active={true}>
  Hidden Gems
</GradientButton>
```

### blue-purple
Great for primary actions, navigation
```tsx
<GradientButton variant="blue-purple" active={true}>
  Explore
</GradientButton>
```

### green-blue
Ideal for success states, confirmations
```tsx
<GradientButton variant="green-blue" active={true}>
  Confirm
</GradientButton>
```

### orange-red
Best for warnings, important actions
```tsx
<GradientButton variant="orange-red" active={true}>
  Delete
</GradientButton>
```

### gray
Neutral, secondary actions
```tsx
<GradientButton variant="gray" active={true}>
  Cancel
</GradientButton>
```

### outline
Outlined style for subtle emphasis
```tsx
<GradientButton variant="outline" active={true}>
  Learn More
</GradientButton>
```

## Specialized Buttons

### HiddenGemsButton

Pre-configured button for Hidden Gems feature with sparkle icon:

```tsx
import { HiddenGemsButton } from "@/app/components/ui/GradientButton";

<HiddenGemsButton
  active={isActive}
  onClick={() => setIsActive(!isActive)}
/>
```

You can also customize the text:

```tsx
<HiddenGemsButton active={true}>
  Secret Spots
</HiddenGemsButton>
```

## Props

### GradientButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `GradientButtonVariant` | `"purple-pink"` | Button style variant |
| `size` | `GradientButtonSize` | `"md"` | Button size |
| `active` | `boolean` | `false` | Active/selected state |
| `icon` | `ReactNode` | - | Optional icon (left side) |
| `badge` | `string \| number` | - | Optional badge (right side) |
| `fullWidth` | `boolean` | `false` | Make button full width |
| `children` | `ReactNode` | **required** | Button content |
| `disabled` | `boolean` | `false` | Disabled state |
| `className` | `string` | `""` | Additional CSS classes |

Plus all standard HTML button attributes (`onClick`, `type`, etc.)

## Real-World Examples

### Filter Toggle

```tsx
const [showHiddenGems, setShowHiddenGems] = useState(false);

<GradientButton
  variant="purple-pink"
  active={showHiddenGems}
  onClick={() => setShowHiddenGems(!showHiddenGems)}
  badge={showHiddenGems ? "Active" : undefined}
  icon={<SparkleIcon />}
>
  Hidden Gems
</GradientButton>
```

### Action Button with Loading State

```tsx
const [isLoading, setIsLoading] = useState(false);

<GradientButton
  variant="blue-purple"
  active={true}
  disabled={isLoading}
  onClick={handleSubmit}
  icon={isLoading ? <Spinner /> : <CheckIcon />}
>
  {isLoading ? "Saving..." : "Save Changes"}
</GradientButton>
```

### Navigation Tabs

```tsx
const [activeTab, setActiveTab] = useState("beaches");

<div className="flex gap-2">
  <GradientButton
    variant="purple-pink"
    active={activeTab === "beaches"}
    onClick={() => setActiveTab("beaches")}
  >
    Beaches
  </GradientButton>
  <GradientButton
    variant="blue-purple"
    active={activeTab === "hidden-gems"}
    onClick={() => setActiveTab("hidden-gems")}
  >
    Hidden Gems
  </GradientButton>
</div>
```

### Full Width Button

```tsx
<GradientButton
  variant="green-blue"
  active={true}
  fullWidth={true}
  size="lg"
>
  Get Started
</GradientButton>
```

## Styling Notes

- The component uses Tailwind CSS classes
- Gradients are applied using `bg-gradient-to-r`
- Shadows are color-matched to the gradient
- Transitions are smooth (200ms duration)
- Dark mode is automatically supported
- Disabled state reduces opacity to 50%

## Creating Custom Variants

To add a new variant, edit the `variantStyles` object in `GradientButton.tsx`:

```typescript
const variantStyles: Record<GradientButtonVariant, { active: string; inactive: string }> = {
  // ... existing variants
  "custom-variant": {
    active: "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30",
    inactive: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
  },
};
```

Then update the type:

```typescript
export type GradientButtonVariant = 
  | "purple-pink"
  | "blue-purple"
  // ... other variants
  | "custom-variant";
```

## Best Practices

1. **Use active state for toggles**: When the button represents a toggle/filter
2. **Use badges sparingly**: Only for important status indicators
3. **Match variant to context**: 
   - Purple-pink for special/premium features
   - Blue-purple for primary actions
   - Green-blue for success/positive actions
   - Orange-red for warnings/destructive actions
4. **Consistent sizing**: Use the same size for buttons in the same group
5. **Accessibility**: Always provide meaningful button text (not just icons)

## Migration Guide

### Before (Inline Styles)

```tsx
<button
  className={`
    px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
    ${active 
      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
      : "bg-gray-100 text-gray-700"
    }
  `}
>
  Hidden Gems
</button>
```

### After (GradientButton)

```tsx
<GradientButton variant="purple-pink" active={active}>
  Hidden Gems
</GradientButton>
```

Or even simpler with the specialized component:

```tsx
<HiddenGemsButton active={active} />
```

## Benefits of This Approach

✅ **Consistency**: All gradient buttons look and behave the same  
✅ **Maintainability**: Update styles in one place  
✅ **Type Safety**: TypeScript ensures correct prop usage  
✅ **Flexibility**: Easy to add new variants without code duplication  
✅ **Reusability**: Use across the entire application  
✅ **Accessibility**: Built-in disabled states and proper HTML semantics  
✅ **Developer Experience**: Autocomplete for variants and props
