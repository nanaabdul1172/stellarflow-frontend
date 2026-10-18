"use client";

/**
 * SwapWithLiquidityWarning - Example Integration
 * 
 * This file demonstrates how to integrate LiquidityShortageBanner
 * into a swap interface with real-time pool data and price impact
 * calculations.
 */

import { useState, useEffect, useMemo } from "react";
import { LiquidityShortageBanner } from "./LiquidityShortageBanner";
import { getPoolById, type LiquidityPool } from "@/lib/pools";

interface SwapWithLiquidityWarningProps {
  defaultPoolId?: string;
}

/**
 * Calculate estimated price impact for a constant product AMM (x * y = k)
 * This is a simplified calculation for demonstration purposes.
 */
function calculatePriceImpact(
  tradeAmount: number,
  poolReserve: number,
  fee: number = 0.003
): number {
  if (poolReserve <= 0 || tradeAmount <= 0) return 0;

  // Account for trading fee
  const amountAfterFee = tradeAmount * (1 - fee);

  // Price impact formula for constant product AMM
  // impact = (amountIn / (reserveIn + amountIn)) * 100
  const impact = (amountAfterFee / (poolReserve + amountAfterFee)) * 100;

  return Math.min(impact, 100); // Cap at 100%
}

/**
 * Calculate estimated slippage based on price impact and market volatility
 * In production, this would come from historical trade data
 */
function calculateSlippage(priceImpact: number): number {
  // Simple heuristic: slippage ≈ 70% of price impact
  // (accounting for arbitrage opportunities)
  return priceImpact * 0.7;
}

export function SwapWithLiquidityWarning({
  defaultPoolId = "xlm-usdc",
}: SwapWithLiquidityWarningProps) {
  const [pool, setPool] = useState<LiquidityPool | null>(null);
  const [inputAmount, setInputAmount] = useState<string>("");
  const [inputAsset, setInputAsset] = useState<"A" | "B">("A");
  const [showBatchWizard, setShowBatchWizard] = useState(false);

  // Load pool data
  useEffect(() => {
    const loadPool = async () => {
      const poolData = await getPoolById(defaultPoolId);
      setPool(poolData);
    };
    loadPool();
  }, [defaultPoolId]);

  // Calculate numeric input amount
  const numericAmount = useMemo(() => {
    const parsed = parseFloat(inputAmount);
    return isNaN(parsed) ? 0 : parsed;
  }, [inputAmount]);

  // Get pool depth for selected asset
  const poolDepth = useMemo(() => {
    if (!pool) return 0;
    return inputAsset === "A" ? pool.reserveA : pool.reserveB;
  }, [pool, inputAsset]);

  // Calculate price impact
  const priceImpact = useMemo(() => {
    if (!pool || numericAmount <= 0) return 0;
    return calculatePriceImpact(numericAmount, poolDepth, pool.feePercent / 100);
  }, [pool, numericAmount, poolDepth]);

  // Calculate slippage
  const slippage = useMemo(() => {
    return calculateSlippage(priceImpact);
  }, [priceImpact]);

  // Get selected asset symbol
  const selectedAsset = useMemo(() => {
    if (!pool) return "";
    return inputAsset === "A" ? pool.assetA : pool.assetB;
  }, [pool, inputAsset]);

  // Handle batch swap wizard
  const handleSplitOrder = () => {
    console.log("Opening batch swap wizard for:", {
      amount: numericAmount,
      asset: selectedAsset,
      pool: pool?.pair,
    });
    setShowBatchWizard(true);
  };

  if (!pool) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading pool data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A121E] via-[#0D1520] to-[#0A121E]">
      {/* Liquidity Warning Banner - Sticky at top */}
      <LiquidityShortageBanner
        tradeAmount={numericAmount}
        tradeAsset={selectedAsset}
        poolDepth={poolDepth}
        poolPair={pool.pair}
        priceImpact={priceImpact}
        slippage={slippage}
        onSplitOrder={handleSplitOrder}
        dismissKey={`${pool.id}-${numericAmount}-${inputAsset}`}
      />

      {/* Main Swap Interface */}
      <div className="container mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-[#1B2A3B] bg-[#0D1520] p-6 shadow-xl">
          <h2 className="mb-6 text-2xl font-bold text-white">Swap Example</h2>

          {/* Pool Info */}
          <div className="mb-6 rounded-lg bg-[#0A121E] p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Pool:</span>
                <span className="ml-2 font-semibold text-white">{pool.pair}</span>
              </div>
              <div>
                <span className="text-gray-400">TVL:</span>
                <span className="ml-2 font-semibold text-white">
                  ${pool.totalValueLocked.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">{pool.assetA} Reserve:</span>
                <span className="ml-2 font-semibold text-white">
                  {pool.reserveA.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">{pool.assetB} Reserve:</span>
                <span className="ml-2 font-semibold text-white">
                  {pool.reserveB.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                You Pay
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 rounded-lg border border-[#1B2A3B] bg-[#0A121E] px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <select
                  value={inputAsset}
                  onChange={(e) => setInputAsset(e.target.value as "A" | "B")}
                  className="rounded-lg border border-[#1B2A3B] bg-[#0A121E] px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="A">{pool.assetA}</option>
                  <option value="B">{pool.assetB}</option>
                </select>
              </div>
            </div>

            {/* Trade Metrics */}
            {numericAmount > 0 && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                <h3 className="mb-3 text-sm font-semibold text-blue-300">
                  Trade Metrics
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pool Depth %:</span>
                    <span className="font-semibold text-white">
                      {((numericAmount / poolDepth) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price Impact:</span>
                    <span
                      className={`font-semibold ${
                        priceImpact > 5
                          ? "text-red-400"
                          : priceImpact > 2
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {priceImpact.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Slippage:</span>
                    <span className="font-semibold text-white">
                      {slippage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trading Fee:</span>
                    <span className="font-semibold text-white">
                      {pool.feePercent}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <button
              type="button"
              disabled={numericAmount <= 0}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {numericAmount <= 0 ? "Enter Amount" : "Swap"}
            </button>
          </div>
        </div>

        {/* Batch Wizard Modal (Placeholder) */}
        {showBatchWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-w-lg rounded-2xl border border-[#1B2A3B] bg-[#0D1520] p-6">
              <h3 className="mb-4 text-xl font-bold text-white">
                Batch Swap Wizard
              </h3>
              <p className="mb-4 text-gray-300">
                Split your {numericAmount.toLocaleString()} {selectedAsset} trade into
                smaller batches to reduce price impact.
              </p>
              <button
                onClick={() => setShowBatchWizard(false)}
                className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SwapWithLiquidityWarning;
