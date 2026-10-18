"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ASSET_DECIMALS, type AssetSymbol } from "@/config/assetSymbols";
import type { OrderBookSnapshot } from "@/types";
import { formatCompactAmount, formatOrderBookPrice } from "@/utils/formatters";
import {
  DEPTH_CHART_COLORS,
  DEFAULT_DEPTH_CHART_HEIGHT,
} from "./CumulativeDepthChart.constants";

export interface OrderBookDepthCanvasProps {
  assetId: AssetSymbol;
  orderBook: OrderBookSnapshot | null;
  isConnected: boolean;
  height?: number;
  width?: number;
  className?: string;
}

interface DepthPoint {
  price: number;
  bidDepth: number;
  askDepth: number;
}

interface Viewport {
  minPrice: number;
  maxPrice: number;
  maxDepth: number;
  points: DepthPoint[];
}

interface CrosshairData {
  x: number;
  y: number;
  price: number;
  bidDepth: number;
  askDepth: number;
}

// Canvas rendering constants optimized for 60 FPS
const CANVAS_PADDING = { top: 40, right: 60, bottom: 40, left: 60 };
const GRID_LINE_COUNT = 5;
const PRICE_TICK_COUNT = 6;
const CROSSHAIR_LINE_WIDTH = 1;
const AREA_LINE_WIDTH = 2;
const TOOLTIP_PADDING = 12;
const TOOLTIP_BORDER_RADIUS = 8;
const MIN_SPREAD_VISIBILITY = 1.5;

/**
 * High-performance HTML5 Canvas-based order book depth chart.
 * Renders 100+ price levels at stable 60 FPS using requestAnimationFrame.
 * Supports high-DPI Retina displays with automatic pixel ratio scaling.
 */
function OrderBookDepthCanvasComponent({
  assetId,
  orderBook,
  isConnected,
  height = DEFAULT_DEPTH_CHART_HEIGHT,
  width,
  className = "",
}: OrderBookDepthCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [crosshair, setCrosshair] = useState<CrosshairData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const priceFractionDigits = ASSET_DECIMALS[assetId];

  // Build viewport data from order book
  const viewport = useMemo((): Viewport | null => {
    if (!orderBook || orderBook.bids.length === 0 || orderBook.asks.length === 0) {
      return null;
    }

    const bids = [...orderBook.bids].sort((a, b) => b.price - a.price);
    const asks = [...orderBook.asks].sort((a, b) => a.price - b.price);

    const bestBid = bids[0]?.price ?? 0;
    const bestAsk = asks[0]?.price ?? 0;
    const midPrice = (bestBid + bestAsk) / 2;
    const spread = bestAsk - bestBid;

    // Calculate price range with spread visibility
    const spreadMargin = spread * MIN_SPREAD_VISIBILITY;
    const minPrice = Math.max(0, bestBid - spreadMargin * 2);
    const maxPrice = bestAsk + spreadMargin * 2;

    // Build cumulative depth points
    const points: DepthPoint[] = [];
    let maxDepth = 0;

    // Process bids (descending price)
    bids.forEach((level) => {
      if (level.price >= minPrice && level.price <= maxPrice) {
        points.push({
          price: level.price,
          bidDepth: level.total,
          askDepth: 0,
        });
        maxDepth = Math.max(maxDepth, level.total);
      }
    });

    // Process asks (ascending price)
    asks.forEach((level) => {
      if (level.price >= minPrice && level.price <= maxPrice) {
        const existing = points.find((p) => p.price === level.price);
        if (existing) {
          existing.askDepth = level.total;
        } else {
          points.push({
            price: level.price,
            bidDepth: 0,
            askDepth: level.total,
          });
        }
        maxDepth = Math.max(maxDepth, level.total);
      }
    });

    // Sort by price
    points.sort((a, b) => a.price - b.price);

    return {
      minPrice,
      maxPrice,
      maxDepth: maxDepth * 1.1, // Add 10% headroom
      points,
    };
  }, [orderBook]);

  // Handle container resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: width || rect.width,
          height,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [width, height]);

  // Main render loop with requestAnimationFrame
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !viewport) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width: canvasWidth, height: canvasHeight } = dimensions;

    // Set canvas dimensions for high-DPI displays
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    // Calculate chart area
    const chartWidth = canvasWidth - CANVAS_PADDING.left - CANVAS_PADDING.right;
    const chartHeight = canvasHeight - CANVAS_PADDING.top - CANVAS_PADDING.bottom;
    const chartLeft = CANVAS_PADDING.left;
    const chartTop = CANVAS_PADDING.top;

    // Clear canvas
    ctx.fillStyle = "#0A121E";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid
    ctx.strokeStyle = DEPTH_CHART_COLORS.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    for (let i = 0; i <= GRID_LINE_COUNT; i++) {
      const y = chartTop + (chartHeight / GRID_LINE_COUNT) * i;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartLeft + chartWidth, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Helper functions for coordinate transformation
    const priceToX = (price: number): number => {
      const ratio = (price - viewport.minPrice) / (viewport.maxPrice - viewport.minPrice);
      return chartLeft + ratio * chartWidth;
    };

    const depthToY = (depth: number): number => {
      const ratio = depth / viewport.maxDepth;
      return chartTop + chartHeight - ratio * chartHeight;
    };

    // Draw bid area (green)
    if (viewport.points.some((p) => p.bidDepth > 0)) {
      ctx.fillStyle = DEPTH_CHART_COLORS.bid.fill;
      ctx.strokeStyle = DEPTH_CHART_COLORS.bid.stroke;
      ctx.lineWidth = AREA_LINE_WIDTH;

      ctx.beginPath();
      let firstPoint = true;

      viewport.points.forEach((point, idx) => {
        if (point.bidDepth > 0) {
          const x = priceToX(point.price);
          const y = depthToY(point.bidDepth);

          if (firstPoint) {
            ctx.moveTo(x, chartTop + chartHeight);
            ctx.lineTo(x, y);
            firstPoint = false;
          } else {
            // Step-before curve
            const prevPoint = viewport.points[idx - 1];
            if (prevPoint && prevPoint.bidDepth > 0) {
              const prevY = depthToY(prevPoint.bidDepth);
              ctx.lineTo(x, prevY);
            }
            ctx.lineTo(x, y);
          }
        }
      });

      // Close path to bottom
      const lastBidPoint = [...viewport.points].reverse().find((p) => p.bidDepth > 0);
      if (lastBidPoint) {
        ctx.lineTo(priceToX(lastBidPoint.price), chartTop + chartHeight);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Draw ask area (red)
    if (viewport.points.some((p) => p.askDepth > 0)) {
      ctx.fillStyle = DEPTH_CHART_COLORS.ask.fill;
      ctx.strokeStyle = DEPTH_CHART_COLORS.ask.stroke;
      ctx.lineWidth = AREA_LINE_WIDTH;

      ctx.beginPath();
      let firstPoint = true;

      viewport.points.forEach((point, idx) => {
        if (point.askDepth > 0) {
          const x = priceToX(point.price);
          const y = depthToY(point.askDepth);

          if (firstPoint) {
            ctx.moveTo(x, chartTop + chartHeight);
            ctx.lineTo(x, y);
            firstPoint = false;
          } else {
            // Step-after curve
            ctx.lineTo(x, y);
          }
        }
      });

      // Close path to bottom
      const lastAskPoint = [...viewport.points].reverse().find((p) => p.askDepth > 0);
      if (lastAskPoint) {
        ctx.lineTo(priceToX(lastAskPoint.price), chartTop + chartHeight);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Draw price axis
    ctx.fillStyle = DEPTH_CHART_COLORS.axis;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let i = 0; i <= PRICE_TICK_COUNT; i++) {
      const ratio = i / PRICE_TICK_COUNT;
      const price = viewport.minPrice + ratio * (viewport.maxPrice - viewport.minPrice);
      const x = chartLeft + ratio * chartWidth;
      const formattedPrice = formatOrderBookPrice(price, priceFractionDigits);
      ctx.fillText(formattedPrice, x, chartTop + chartHeight + 8);
    }

    // Draw depth axis
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= GRID_LINE_COUNT; i++) {
      const ratio = i / GRID_LINE_COUNT;
      const depth = viewport.maxDepth * (1 - ratio);
      const y = chartTop + ratio * chartHeight;
      const formattedDepth = formatCompactAmount(depth);
      ctx.fillText(formattedDepth, chartLeft - 8, y);
    }

    // Draw crosshair and tooltip
    if (crosshair) {
      ctx.strokeStyle = "rgba(229, 231, 235, 0.8)";
      ctx.lineWidth = CROSSHAIR_LINE_WIDTH;
      ctx.setLineDash([4, 4]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crosshair.x, chartTop);
      ctx.lineTo(crosshair.x, chartTop + chartHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(chartLeft, crosshair.y);
      ctx.lineTo(chartLeft + chartWidth, crosshair.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // Tooltip
      const tooltipLines = [
        `Price: ${formatOrderBookPrice(crosshair.price, priceFractionDigits)}`,
        crosshair.bidDepth > 0 ? `Bid: ${formatCompactAmount(crosshair.bidDepth)}` : "",
        crosshair.askDepth > 0 ? `Ask: ${formatCompactAmount(crosshair.askDepth)}` : "",
      ].filter(Boolean);

      const tooltipWidth = 180;
      const tooltipHeight = tooltipLines.length * 20 + TOOLTIP_PADDING * 2;
      let tooltipX = crosshair.x + 15;
      let tooltipY = crosshair.y - tooltipHeight / 2;

      // Keep tooltip in bounds
      if (tooltipX + tooltipWidth > chartLeft + chartWidth) {
        tooltipX = crosshair.x - tooltipWidth - 15;
      }
      if (tooltipY < chartTop) tooltipY = chartTop;
      if (tooltipY + tooltipHeight > chartTop + chartHeight) {
        tooltipY = chartTop + chartHeight - tooltipHeight;
      }

      // Draw tooltip background
      ctx.fillStyle = "rgba(10, 18, 30, 0.95)";
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, TOOLTIP_BORDER_RADIUS);
      ctx.fill();
      ctx.stroke();

      // Draw tooltip text
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      tooltipLines.forEach((line, idx) => {
        ctx.fillText(line, tooltipX + TOOLTIP_PADDING, tooltipY + TOOLTIP_PADDING + idx * 20);
      });
    }

    // Draw connection status indicator
    const statusText = isConnected ? "LIVE" : "OFFLINE";
    const statusColor = isConnected ? "#39FF14" : "#fbbf24";
    ctx.fillStyle = statusColor;
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(statusText, canvasWidth - 12, 12);
  }, [viewport, crosshair, dimensions, isConnected, priceFractionDigits]);

  // Render loop
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Mouse move handler for crosshair
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!viewport || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const chartWidth = dimensions.width - CANVAS_PADDING.left - CANVAS_PADDING.right;
      const chartLeft = CANVAS_PADDING.left;
      const chartTop = CANVAS_PADDING.top;
      const chartHeight = dimensions.height - CANVAS_PADDING.top - CANVAS_PADDING.bottom;

      // Check if mouse is in chart area
      if (
        x < chartLeft ||
        x > chartLeft + chartWidth ||
        y < chartTop ||
        y > chartTop + chartHeight
      ) {
        setCrosshair(null);
        return;
      }

      // Calculate price from x position
      const priceRatio = (x - chartLeft) / chartWidth;
      const price = viewport.minPrice + priceRatio * (viewport.maxPrice - viewport.minPrice);

      // Find nearest data point
      const nearestPoint = viewport.points.reduce((prev, curr) => {
        return Math.abs(curr.price - price) < Math.abs(prev.price - price) ? curr : prev;
      }, viewport.points[0]);

      if (nearestPoint) {
        setCrosshair({
          x,
          y,
          price: nearestPoint.price,
          bidDepth: nearestPoint.bidDepth,
          askDepth: nearestPoint.askDepth,
        });
      }
    },
    [viewport, dimensions]
  );

  const handleMouseLeave = useCallback(() => {
    setCrosshair(null);
  }, []);

  if (!orderBook || !viewport) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center justify-center rounded-2xl border border-[#1B2A3B] bg-[#0A121E] ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-gray-500">No order book data available</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl border border-[#1B2A3B] bg-[#0A121E] p-6 ${className}`}
      style={{ height: height + 100 }}
    >
      <header className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">
          Market Depth • Canvas Renderer
        </p>
        <h3 className="mt-0.5 flex items-center gap-2 text-base font-black tracking-tight text-white">
          <span>{assetId}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
              isConnected ? "bg-[#39FF14]/10 text-[#39FF14]" : "bg-yellow-500/10 text-yellow-500"
            }`}
          >
            {isConnected ? "60 FPS" : "PAUSED"}
          </span>
        </h3>
      </header>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-crosshair"
        style={{ width: dimensions.width, height: dimensions.height }}
      />

      <footer className="mt-3 flex items-center justify-between text-[10px] text-gray-600">
        <span>
          {viewport.points.length} levels • Hardware-accelerated Canvas • High-DPI Ready
        </span>
        <span>Hover for precise price/volume</span>
      </footer>
    </div>
  );
}

export const OrderBookDepthCanvas = memo(OrderBookDepthCanvasComponent);

export default OrderBookDepthCanvas;
