# Liquidity Shortage Banner Component

Sticky warning banner that alerts traders when their order size exceeds a configurable percentage threshold (default: 10%) of total pool liquidity depth.

## Overview

The `LiquidityShortageBanner` component provides critical trade safety warnings by automatically detecting when a trade size represents a significant portion of available pool liquidity. It displays dynamic warnings with contextual price impact and slippage information, helping traders make informed decisions about executing large orders.

## Features

### Core Functionality
- **Automatic Detection**: Monitors trade-to-pool ratio in real-time
- **Configurable Threshold**: Default 10%, customizable per use case
- **Severity Levels**: Three-tier warning system (warning, high, critical)
- **Session Dismissal**: Persists dismissal state for active browser session
- **Price Impact Display**: Shows estimated market impact percentage
- **Slippage Warning**: Displays expected slippage for the trade
- **Quick Action**: One-click access to split order functionality

### Visual Design
- **Sticky Positioning**: Remains visible at top of viewport during scroll
- **Color-Coded Severity**: Amber (10-15%), Orange (15-25%), Red (25%+)
- **Responsive Layout**: Adapts to mobile, tablet, and desktop viewports
- **Smooth Animations**: Subtle transitions for show/hide states
- **Accessible**: ARIA labels, keyboard navigation, screen reader support

## Usage

### Basic Implementation

```tsx
import { LiquidityShortageBanner } from "@/components/swap";

function SwapInterface() {
  const tradeAmount = 500000; // XLM units
  const poolDepth = 4250000; // Total XLM in pool

  return (
    <>
      <LiquidityShortageBanner
        tradeAmount={tradeAmount}
        tradeAsset="XLM"
        poolDepth={poolDepth}
        poolPair="XLM / USDC"
      />
      {/* Rest of swap interface */}
    </>
  );
}
```

### With Price Impact & Slippage

```tsx
<LiquidityShortageBanner
  tradeAmount={500000}
  tradeAsset="XLM"
  poolDepth={4250000}
  poolPair="XLM / USDC"
  priceImpact={2.4}
  slippage={1.8}
/>
```

### With Split Order Action

```tsx
import { BatchSwapWizard } from "@/components/trading";

function SwapWithBatching() {
  const [showBatchWizard, setShowBatchWizard] = useState(false);

  return (
    <>
      <LiquidityShortageBanner
        tradeAmount={1200000}
        tradeAsset="XLM"
        poolDepth={4250000}
        poolPair="XLM / USDC"
        priceImpact={15.8}
        slippage={12.4}
        onSplitOrder={() => setShowBatchWizard(true)}
      />
      {showBatchWizard && <BatchSwapWizard {...} />}
    </>
  );
}
```

### With Session Dismissal

```tsx
<LiquidityShortageBanner
  tradeAmount={500000}
  tradeAsset="XLM"
  poolDepth={4250000}
  poolPair="XLM / USDC"
  dismissKey="xlm-usdc-500k"
  onSplitOrder={handleSplitOrder}
/>
```

### Custom Threshold

```tsx
// Show warning at 5% instead of default 10%
<LiquidityShortageBanner
  tradeAmount={250000}
  tradeAsset="XLM"
  poolDepth={4250000}
  poolPair="XLM / USDC"
  thresholdPercent={5}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tradeAmount` | `number` | **required** | Trade input amount in base units |
| `tradeAsset` | `string` | **required** | Asset symbol being traded (e.g., "XLM") |
| `poolDepth` | `number` | **required** | Total pool liquidity depth in base units |
| `poolPair` | `string` | **required** | Asset pair being traded (e.g., "XLM / USDC") |
| `priceImpact` | `number` | `undefined` | Estimated price impact percentage (0-100) |
| `slippage` | `number` | `undefined` | Estimated slippage percentage (0-100) |
| `onSplitOrder` | `() => void` | `undefined` | Callback when "Split Order" is clicked |
| `thresholdPercent` | `number` | `10` | Percentage threshold for showing warning |
| `dismissKey` | `string` | `undefined` | Unique key for session storage dismissal |

## Severity Levels

The component automatically applies different visual styles based on the trade-to-pool ratio:

### Warning Level (10-15%)
- **Background**: Amber (#fbbf24)
- **Text**: Dark slate
- **Use Case**: Moderate liquidity impact, caution advised

### High Level (15-25%)
- **Background**: Orange (#f97316)
- **Text**: White
- **Use Case**: Significant liquidity impact, consider splitting

### Critical Level (25%+)
- **Background**: Rose red (#e11d48)
- **Text**: White
- **Use Case**: Severe liquidity impact, strongly recommend splitting

## Behavior

### Visibility Logic

The banner appears when:
1. `tradeAmount / poolDepth * 100 >= thresholdPercent`
2. Not previously dismissed (if `dismissKey` provided)

The banner hides when:
1. Trade amount falls below threshold
2. User clicks dismiss button
3. Component unmounts

### Dismissal Behavior

**Without `dismissKey`:**
- Dismissal only persists for current render cycle
- Banner reappears if component remounts

**With `dismissKey`:**
- Dismissal persists for browser session (sessionStorage)
- Banner won't reappear until session ends or storage cleared
- Unique keys allow per-trade dismissal tracking

### Calculation Formula

```typescript
depthPercentage = (tradeAmount / poolDepth) * 100

if (depthPercentage >= thresholdPercent) {
  // Show banner
}
```

## Integration Examples

### Swap Form Integration

```tsx
import { useState, useEffect } from "react";
import { LiquidityShortageBanner } from "@/components/swap";
import { getPoolById } from "@/lib/pools";

function SwapForm() {
  const [inputAmount, setInputAmount] = useState(0);
  const [inputAsset, setInputAsset] = useState("XLM");
  const [pool, setPool] = useState(null);
  const [priceImpact, setPriceImpact] = useState(0);

  useEffect(() => {
    // Load pool data
    const loadPool = async () => {
      const poolData = await getPoolById("xlm-usdc");
      setPool(poolData);
    };
    loadPool();
  }, []);

  useEffect(() => {
    // Calculate price impact based on input amount
    if (pool && inputAmount > 0) {
      const impact = calculatePriceImpact(inputAmount, pool.reserveA);
      setPriceImpact(impact);
    }
  }, [inputAmount, pool]);

  if (!pool) return <LoadingSpinner />;

  return (
    <div>
      <LiquidityShortageBanner
        tradeAmount={inputAmount}
        tradeAsset={inputAsset}
        poolDepth={pool.reserveA}
        poolPair={pool.pair}
        priceImpact={priceImpact}
        dismissKey={`${pool.id}-${inputAmount}`}
        onSplitOrder={() => openBatchSwizard()}
      />
      
      {/* Swap form fields */}
    </div>
  );
}
```

### With Real-Time Pool Data

```tsx
import { usePoolDepth } from "@/hooks/usePoolDepth";

function LiveSwapInterface() {
  const [amount, setAmount] = useState(0);
  const { poolDepth, priceImpact, slippage } = usePoolDepth({
    poolId: "xlm-usdc",
    tradeAmount: amount,
  });

  return (
    <LiquidityShortageBanner
      tradeAmount={amount}
      tradeAsset="XLM"
      poolDepth={poolDepth}
      poolPair="XLM / USDC"
      priceImpact={priceImpact}
      slippage={slippage}
      onSplitOrder={handleBatchSplit}
    />
  );
}
```

### Multi-Pool Support

```tsx
function MultiPoolSwap() {
  const pools = ["xlm-usdc", "xlm-ngnc", "usdc-ngnc"];
  const [activePool, setActivePool] = useState("xlm-usdc");
  const [amount, setAmount] = useState(0);

  const poolData = usePool(activePool);

  return (
    <>
      {pools.map((poolId) => {
        const pool = usePool(poolId);
        return (
          <LiquidityShortageBanner
            key={poolId}
            tradeAmount={amount}
            tradeAsset={pool.assetA}
            poolDepth={pool.reserveA}
            poolPair={pool.pair}
            dismissKey={`${poolId}-${amount}`}
          />
        );
      })}
    </>
  );
}
```

## Styling

### CSS Classes

The component uses Tailwind CSS utility classes for styling. Key classes:

```tsx
// Container
"sticky top-0 z-50 w-full px-4 py-3 shadow-lg transition-all duration-300"

// Warning Level
"bg-amber-500 text-slate-950 border-amber-600"

// High Level
"bg-orange-500 text-white border-orange-600"

// Critical Level
"bg-rose-600 text-white border-rose-700"
```

### Custom Styling

To customize styling, wrap in a parent container:

```tsx
<div className="custom-banner-container">
  <LiquidityShortageBanner {...props} />
</div>

<style>
.custom-banner-container aside {
  /* Custom styles here */
}
</style>
```

## Accessibility

### ARIA Attributes
- `role="alert"` - Identifies banner as an alert
- `aria-live="assertive"` - Ensures immediate screen reader announcement
- `aria-hidden="true"` - Hides decorative icons from screen readers
- `aria-label` - Descriptive labels on interactive elements

### Keyboard Navigation
- Dismiss button is keyboard accessible
- Split Order button is keyboard accessible
- Focus visible on interactive elements
- Tab order follows logical flow

### Screen Reader Support
- Alert announced immediately when shown
- Dismiss action clearly labeled
- Percentage and metrics properly announced
- Icon meanings conveyed through text

## Performance

### Optimization Strategies
1. **Memoized Calculations**: `useMemo` for percentage calculations
2. **Conditional Rendering**: Early return when below threshold
3. **Session Storage**: Cached dismissal state
4. **Minimal Re-renders**: Component only updates when props change

### Bundle Impact
- **Component Size**: ~4KB (minified)
- **Dependencies**: lucide-react icons only
- **CSS**: Tailwind utilities (no additional CSS)

## Testing

### Unit Tests

Run the test suite:
```bash
npm test LiquidityShortageBanner.test.tsx
```

Coverage includes:
- Visibility logic for various thresholds
- Severity level styling
- Dismissal behavior (with and without session storage)
- Split order action callbacks
- Edge cases (zero/negative values)
- Accessibility attributes
- Formatting functions

### Manual Testing Checklist

- [ ] Banner appears at 10% threshold
- [ ] Severity colors match percentage ranges
- [ ] Dismiss button hides banner
- [ ] Split Order button calls callback
- [ ] Session dismissal persists across re-renders
- [ ] Responsive on mobile viewports
- [ ] Accessible via keyboard
- [ ] Screen reader announces correctly
- [ ] Metrics display when provided
- [ ] Large numbers format with commas

### Storybook Stories

View all variants:
```bash
npm run storybook
# Navigate to: Swap > LiquidityShortageBanner
```

Available stories:
- Default (11.76% warning)
- Warning Level (10-15%)
- High Level (15-25%)
- Critical Level (25%+)
- Without Metrics
- Without Split Action
- Custom Thresholds (5%, 20%)
- Large Numbers
- Mobile Viewport

## Troubleshooting

### Banner Not Appearing

**Check:**
1. Is `tradeAmount / poolDepth * 100 >= thresholdPercent`?
2. Has banner been dismissed with `dismissKey`? (Check sessionStorage)
3. Are `poolDepth` and `tradeAmount` valid numbers?

**Solution:**
```tsx
// Debug visibility
console.log('Depth %:', (tradeAmount / poolDepth) * 100);
console.log('Threshold:', thresholdPercent);
console.log('Dismissed:', sessionStorage.getItem(`stellarflow_liquidity_warning_dismissed_${dismissKey}`));
```

### Dismissal Not Persisting

**Check:**
1. Is `dismissKey` prop provided?
2. Is sessionStorage available in browser?
3. Is sessionStorage quota exceeded?

**Solution:**
```tsx
// Clear all dismissals
Object.keys(sessionStorage)
  .filter(key => key.startsWith('stellarflow_liquidity_warning_dismissed_'))
  .forEach(key => sessionStorage.removeItem(key));
```

### Wrong Severity Level

**Check:**
1. Calculate percentage manually: `(tradeAmount / poolDepth) * 100`
2. Verify threshold ranges:
   - Warning: 10-15%
   - High: 15-25%
   - Critical: 25%+

### Split Order Not Working

**Check:**
1. Is `onSplitOrder` callback provided?
2. Is callback function defined in parent scope?
3. Are any errors logged in console?

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full Support |
| Firefox | 88+ | ✅ Full Support |
| Safari | 14+ | ✅ Full Support |
| Edge | 90+ | ✅ Full Support |
| Mobile Safari | 14+ | ✅ Full Support |
| Mobile Chrome | 90+ | ✅ Full Support |

**Required APIs:**
- sessionStorage (gracefully degrades if unavailable)
- CSS sticky positioning
- Flexbox layout

## Related Components

- `BatchSwapWizard` - Tool for splitting large orders
- `SlippageVisualizer` - Visual trade impact display
- `HighPriceImpactModal` - Modal for extreme impact scenarios
- `AlertBanner` - System-wide alert banner

## Best Practices

### Do's ✅
- Provide accurate pool depth data
- Calculate price impact dynamically
- Use unique `dismissKey` for different trades
- Provide `onSplitOrder` callback when batching available
- Test with various pool sizes and trade amounts

### Don'ts ❌
- Don't hardcode threshold unless required
- Don't skip `dismissKey` for production use
- Don't show without price impact data when available
- Don't block UI with banner (sticky positioning)
- Don't use same `dismissKey` for different trades

## Future Enhancements

### Planned Features
- [ ] Multi-language support
- [ ] Customizable color schemes
- [ ] Animation preferences (respect `prefers-reduced-motion`)
- [ ] Historical dismissal analytics
- [ ] Suggested batch split sizes
- [ ] Real-time pool depth updates
- [ ] Integration with order routing
- [ ] Export dismissal logs

## License

MIT License - StellarFlow Protocol

## Maintainers

- **Primary**: StellarFlow Swap Team
- **Code Review**: Safety & Risk Team
- **Design**: UI/UX Team

---

**Last Updated**: 2026-10-18  
**Component Version**: 1.0.0  
**Minimum React Version**: 18.0.0
