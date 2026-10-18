"use client";

import { memo } from "react";
import { useOrderBook } from "@/app/hooks/useOrderBook";
import type { AssetSymbol } from "@/config/assetSymbols";
import { OrderBookDepthCanvas, type OrderBookDepthCanvasProps } from "./OrderBookDepthCanvas";

/**
 * LiveOrderBookDepthCanvas
 * 
 * Convenience wrapper that connects OrderBookDepthCanvas to live WebSocket
 * order book data via the useOrderBook hook. This is the recommended way to
 * use the canvas component in production.
 * 
 * @example
 * ```tsx
 * <LiveOrderBookDepthCanvas 
 *   assetId="XLM-USDC" 
 *   depth={100}
 *   height={350} 
 * />
 * ```
 */

export interface LiveOrderBookDepthCanvasProps
  extends Omit<OrderBookDepthCanvasProps, "orderBook" | "isConnected"> {
  /** Number of price levels to subscribe to (default: 100) */
  depth?: number;
}

function LiveOrderBookDepthCanvasComponent({
  assetId,
  depth = 100,
  ...canvasProps
}: LiveOrderBookDepthCanvasProps) {
  const { orderBook, isConnected } = useOrderBook({ assetId, depth });

  return (
    <OrderBookDepthCanvas
      assetId={assetId}
      orderBook={orderBook}
      isConnected={isConnected}
      {...canvasProps}
    />
  );
}

export const LiveOrderBookDepthCanvas = memo(LiveOrderBookDepthCanvasComponent);

export default LiveOrderBookDepthCanvas;
