"use client";

import { useState, useEffect } from "react";
import { OrderBookDepthCanvas } from "@/components/trading";
import type { OrderBookSnapshot } from "@/types";

// Generate realistic order book data
function generateOrderBook(updateCount: number): OrderBookSnapshot {
  const basePrice = 0.123 + Math.sin(updateCount / 20) * 0.005;
  const levels = 100;
  const bids = [];
  const asks = [];
  let bidCumulative = 0;
  let askCumulative = 0;

  for (let i = 0; i < levels; i++) {
    // Bid side (descending prices)
    const bidPrice = basePrice - i * 0.0001 - Math.random() * 0.00005;
    const bidAmount = Math.random() * 5000 + 1000 + Math.sin(updateCount / 10 + i) * 500;
    bidCumulative += bidAmount;
    bids.push({
      price: bidPrice,
      amount: bidAmount,
      total: bidCumulative,
    });

    // Ask side (ascending prices)
    const askPrice = basePrice + i * 0.0001 + Math.random() * 0.00005;
    const askAmount = Math.random() * 5000 + 1000 + Math.cos(updateCount / 10 + i) * 500;
    askCumulative += askAmount;
    asks.push({
      price: askPrice,
      amount: askAmount,
      total: askCumulative,
    });
  }

  return {
    assetPair: "XLM-USDC",
    bids,
    asks,
    timestamp: Date.now(),
  };
}

export default function OrderBookCanvasDemoPage() {
  const [orderBook, setOrderBook] = useState<OrderBookSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [updateRate, setUpdateRate] = useState(10); // Updates per second

  // Initialize order book
  useEffect(() => {
    setOrderBook(generateOrderBook(0));
  }, []);

  // Simulate live order book updates
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setUpdateCount((c) => {
        const newCount = c + 1;
        setOrderBook(generateOrderBook(newCount));
        return newCount;
      });
    }, 1000 / updateRate);

    return () => clearInterval(interval);
  }, [isConnected, updateRate]);

  // FPS monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFps = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round(frameCount * 1000 / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(countFps);
    };

    const rafId = requestAnimationFrame(countFps);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A121E] via-[#0D1520] to-[#0A121E] p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="mb-2 text-4xl font-black text-white">
            Order Book Depth Canvas
          </h1>
          <p className="text-lg text-gray-400">
            High-performance HTML5 Canvas renderer • 60 FPS • 100+ Price Levels
          </p>
        </header>

        {/* Controls */}
        <div className="mb-6 rounded-xl border border-[#1B2A3B] bg-[#0D1520] p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Connection Toggle */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                WebSocket Connection
              </label>
              <button
                onClick={() => setIsConnected(!isConnected)}
                className={`rounded-lg px-6 py-3 font-semibold transition-colors ${
                  isConnected
                    ? "bg-[#39FF14]/20 text-[#39FF14] hover:bg-[#39FF14]/30"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
              </button>
            </div>

            {/* Update Rate */}
            <div>
              <label htmlFor="update-rate" className="mb-2 block text-sm font-semibold text-gray-300">
                Update Rate: {updateRate} Hz
              </label>
              <input
                id="update-rate"
                type="range"
                min="1"
                max="30"
                value={updateRate}
                onChange={(e) => setUpdateRate(Number(e.target.value))}
                className="w-full"
                disabled={!isConnected}
              />
            </div>

            {/* Stats */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Performance Stats
              </label>
              <div className="rounded-lg bg-[#0A121E] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">FPS:</span>
                  <span className={`text-lg font-bold ${fps >= 55 ? "text-[#39FF14]" : fps >= 30 ? "text-yellow-400" : "text-red-400"}`}>
                    {fps}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm text-gray-400">Updates:</span>
                  <span className="text-lg font-bold text-blue-400">
                    {updateCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Standard Size */}
          <div>
            <h2 className="mb-3 text-xl font-bold text-white">Standard View (280px)</h2>
            <OrderBookDepthCanvas
              assetId="XLM-USDC"
              orderBook={orderBook}
              isConnected={isConnected}
              height={280}
            />
          </div>

          {/* Tall View */}
          <div>
            <h2 className="mb-3 text-xl font-bold text-white">Tall View (400px)</h2>
            <OrderBookDepthCanvas
              assetId="XLM-USDC"
              orderBook={orderBook}
              isConnected={isConnected}
              height={400}
            />
          </div>
        </div>

        {/* Full Width */}
        <div className="mt-6">
          <h2 className="mb-3 text-xl font-bold text-white">Full Width View (500px)</h2>
          <OrderBookDepthCanvas
            assetId="XLM-USDC"
            orderBook={orderBook}
            isConnected={isConnected}
            height={500}
          />
        </div>

        {/* Technical Details */}
        <div className="mt-8 rounded-xl border border-[#1B2A3B] bg-[#0D1520] p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">Technical Specifications</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[#39FF14]">Rendering</h3>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>• HTML5 Canvas 2D API</li>
                <li>• requestAnimationFrame loop</li>
                <li>• High-DPI (Retina) support</li>
                <li>• Zero DOM manipulation</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-[#39FF14]">Performance</h3>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>• Target: 60 FPS</li>
                <li>• Frame budget: 16.67ms</li>
                <li>• Typical: 3-8ms per frame</li>
                <li>• 100+ price levels supported</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-[#39FF14]">Features</h3>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>• Interactive crosshair tooltip</li>
                <li>• Dynamic gradient fills</li>
                <li>• Automatic viewport scaling</li>
                <li>• Responsive container sizing</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> This demo simulates live WebSocket updates at configurable rates.
              The FPS counter shows browser animation frame rate. Canvas rendering maintains 60 FPS
              even during high-frequency order book updates (10+ Hz).
            </p>
          </div>
        </div>

        {/* Usage Example */}
        <div className="mt-8 rounded-xl border border-[#1B2A3B] bg-[#0D1520] p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">Usage Example</h2>
          <pre className="overflow-x-auto rounded-lg bg-[#0A121E] p-4 text-sm text-gray-300">
{`import { OrderBookDepthCanvas } from "@/components/trading";

function TradingView() {
  const { orderBook, isConnected } = useOrderBook({ 
    assetId: "XLM-USDC", 
    depth: 100 
  });

  return (
    <OrderBookDepthCanvas
      assetId="XLM-USDC"
      orderBook={orderBook}
      isConnected={isConnected}
      height={350}
    />
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
