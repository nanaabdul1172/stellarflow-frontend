"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AlertTriangle, X, ArrowRightLeft } from "lucide-react";

export interface LiquidityShortageBannerProps {
  /** Trade input amount in base units */
  tradeAmount: number;
  /** Asset symbol being traded */
  tradeAsset: string;
  /** Total pool liquidity depth for the trade asset side in base units */
  poolDepth: number;
  /** Asset pair being traded (e.g., "XLM / USDC") */
  poolPair: string;
  /** Estimated price impact percentage (0-100) */
  priceImpact?: number;
  /** Estimated slippage percentage (0-100) */
  slippage?: number;
  /** Callback when user clicks "Split Order" action */
  onSplitOrder?: () => void;
  /** Threshold percentage for showing warning (default: 10) */
  thresholdPercent?: number;
  /** Persistent dismiss key for session storage */
  dismissKey?: string;
}

const DEFAULT_THRESHOLD_PERCENT = 10;
const SESSION_STORAGE_PREFIX = "stellarflow_liquidity_warning_dismissed_";

/**
 * Calculates what percentage of total pool depth a trade represents
 */
function calculatePoolDepthPercentage(tradeAmount: number, poolDepth: number): number {
  if (!Number.isFinite(poolDepth) || poolDepth <= 0) {
    return 0;
  }
  if (!Number.isFinite(tradeAmount) || tradeAmount < 0) {
    return 0;
  }
  return (tradeAmount / poolDepth) * 100;
}

/**
 * Formats percentage for display with appropriate precision
 */
function formatPercent(value: number): string {
  if (value >= 10) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}

/**
 * LiquidityShortageBanner
 * 
 * Sticky warning banner that alerts traders when their order size exceeds
 * a percentage threshold (default: 10%) of total pool liquidity depth.
 * 
 * Features:
 * - Automatic threshold detection based on trade-to-pool ratio
 * - Price impact and slippage risk warnings
 * - Quick action to split large orders into smaller batches
 * - Session-based dismissal (persists until browser session ends)
 * - Responsive design with smooth animations
 * 
 * @example
 * ```tsx
 * <LiquidityShortageBanner
 *   tradeAmount={500000}
 *   tradeAsset="XLM"
 *   poolDepth={4250000}
 *   poolPair="XLM / USDC"
 *   priceImpact={2.4}
 *   slippage={1.8}
 *   onSplitOrder={() => openBatchSwapWizard()}
 * />
 * ```
 */
export function LiquidityShortageBanner({
  tradeAmount,
  tradeAsset,
  poolDepth,
  poolPair,
  priceImpact,
  slippage,
  onSplitOrder,
  thresholdPercent = DEFAULT_THRESHOLD_PERCENT,
  dismissKey,
}: LiquidityShortageBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Calculate pool depth percentage
  const depthPercentage = useMemo(
    () => calculatePoolDepthPercentage(tradeAmount, poolDepth),
    [tradeAmount, poolDepth]
  );

  // Determine if banner should be visible
  const shouldShow = useMemo(() => {
    return depthPercentage >= thresholdPercent && !isDismissed;
  }, [depthPercentage, thresholdPercent, isDismissed]);

  // Severity level based on depth percentage
  const severity = useMemo(() => {
    if (depthPercentage >= 25) return "critical"; // 25%+ is critical
    if (depthPercentage >= 15) return "high"; // 15-25% is high
    return "warning"; // 10-15% is warning
  }, [depthPercentage]);

  // Load dismissed state from session storage on mount
  useEffect(() => {
    if (!dismissKey) return;

    try {
      const storageKey = `${SESSION_STORAGE_PREFIX}${dismissKey}`;
      const dismissed = sessionStorage.getItem(storageKey);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    } catch {
      // Session storage may be unavailable, ignore
    }
  }, [dismissKey]);

  // Handle dismiss action
  const handleDismiss = useCallback(() => {
    setIsDismissed(true);

    // Persist dismissal to session storage
    if (dismissKey) {
      try {
        const storageKey = `${SESSION_STORAGE_PREFIX}${dismissKey}`;
        sessionStorage.setItem(storageKey, "true");
      } catch {
        // Session storage may be unavailable, ignore
      }
    }
  }, [dismissKey]);

  // Don't render if below threshold or dismissed
  if (!shouldShow) {
    return null;
  }

  // Color scheme based on severity
  const colorClasses = {
    critical: "bg-rose-600 text-white border-rose-700",
    high: "bg-orange-500 text-white border-orange-600",
    warning: "bg-amber-500 text-slate-950 border-amber-600",
  };

  const iconClasses = {
    critical: "text-rose-100",
    high: "text-orange-100",
    warning: "text-amber-900",
  };

  const buttonClasses = {
    critical: "bg-white/20 hover:bg-white/30 text-white",
    high: "bg-white/20 hover:bg-white/30 text-white",
    warning: "bg-slate-900/20 hover:bg-slate-900/30 text-slate-950",
  };

  return (
    <aside
      role="alert"
      aria-live="assertive"
      className={`sticky top-0 z-50 w-full px-4 py-3 shadow-lg transition-all duration-300 ${colorClasses[severity]}`}
      data-testid="liquidity-shortage-banner"
    >
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-4">
        {/* Icon and Content */}
        <div className="flex flex-1 items-start gap-3">
          {/* Warning Icon */}
          <AlertTriangle
            className={`mt-0.5 h-5 w-5 shrink-0 ${iconClasses[severity]}`}
            aria-hidden="true"
          />

          {/* Message Content */}
          <div className="flex-1 space-y-2">
            {/* Title */}
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <strong className="text-sm font-bold tracking-tight sm:text-base">
                Large Order Warning
              </strong>
              <span className="text-xs font-semibold opacity-90">
                {formatPercent(depthPercentage)}% of {poolPair} pool depth
              </span>
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed sm:text-sm">
              Your trade size of{" "}
              <strong className="font-semibold">
                {tradeAmount.toLocaleString()} {tradeAsset}
              </strong>{" "}
              exceeds {thresholdPercent}% of available pool liquidity. This may result in
              significant price impact and slippage.
            </p>

            {/* Risk Metrics */}
            {(priceImpact !== undefined || slippage !== undefined) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
                {priceImpact !== undefined && (
                  <span>
                    Price Impact:{" "}
                    <strong className="font-bold">{formatPercent(priceImpact)}%</strong>
                  </span>
                )}
                {slippage !== undefined && (
                  <span>
                    Expected Slippage:{" "}
                    <strong className="font-bold">{formatPercent(slippage)}%</strong>
                  </span>
                )}
              </div>
            )}

            {/* Action Link */}
            {onSplitOrder && (
              <button
                type="button"
                onClick={onSplitOrder}
                className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 ${buttonClasses[severity]}`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Split Order into Smaller Batches</span>
              </button>
            )}
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss liquidity warning for this session"
          className={`mt-0.5 shrink-0 rounded p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 ${buttonClasses[severity]}`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

export default LiquidityShortageBanner;
