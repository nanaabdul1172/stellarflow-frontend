import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { OrderBookDepthCanvas } from "./OrderBookDepthCanvas";
import type { OrderBookSnapshot } from "@/types";

const meta = {
  title: "Trading/OrderBookDepthCanvas",
  component: OrderBookDepthCanvas,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "High-performance HTML5 Canvas-based order book depth chart. Renders 100+ price levels at stable 60 FPS using requestAnimationFrame with support for high-DPI Retina displays.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    assetId: {
      control: "select",
      options: ["XLM-USDC", "NGN-XLM", "BTC-USDC"],
      description: "Asset pair symbol",
    },
    height: {
      control: { type: "range", min: 200, max: 600, step: 20 },
      description: "Chart height in pixels",
    },
    isConnected: {
      control: "boolean",
      description: "WebSocket connection status",
    },
  },
} satisfies Meta<typeof OrderBookDepthCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

// Generate realistic order book data
function generateOrderBook(levels = 50, basePrice = 100): OrderBookSnapshot {
  const bids = [];
  const asks = [];
  let bidCumulative = 0;
  let askCumulative = 0;

  for (let i = 0; i < levels; i++) {
    // Bid side (descending prices)
    const bidPrice = basePrice - i * 0.1 - Math.random() * 0.05;
    const bidAmount = Math.random() * 1000 + 500;
    bidCumulative += bidAmount;
    bids.push({
      price: bidPrice,
      amount: bidAmount,
      total: bidCumulative,
    });

    // Ask side (ascending prices)
    const askPrice = basePrice + i * 0.1 + Math.random() * 0.05;
    const askAmount = Math.random() * 1000 + 500;
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

// Generate order book with tight spread
function generateTightSpreadOrderBook(): OrderBookSnapshot {
  const basePrice = 0.12345;
  const bids = [];
  const asks = [];
  let bidCumulative = 0;
  let askCumulative = 0;

  for (let i = 0; i < 75; i++) {
    const bidPrice = basePrice - i * 0.00001 - Math.random() * 0.000005;
    const bidAmount = Math.random() * 5000 + 1000;
    bidCumulative += bidAmount;
    bids.push({ price: bidPrice, amount: bidAmount, total: bidCumulative });

    const askPrice = basePrice + i * 0.00001 + Math.random() * 0.000005;
    const askAmount = Math.random() * 5000 + 1000;
    askCumulative += askAmount;
    asks.push({ price: askPrice, amount: askAmount, total: askCumulative });
  }

  return {
    assetPair: "XLM-USDC",
    bids,
    asks,
    timestamp: Date.now(),
  };
}

// Generate order book with imbalanced liquidity
function generateImbalancedOrderBook(): OrderBookSnapshot {
  const basePrice = 42000;
  const bids = [];
  const asks = [];
  let bidCumulative = 0;
  let askCumulative = 0;

  for (let i = 0; i < 100; i++) {
    // Heavy bid side
    const bidPrice = basePrice - i * 10 - Math.random() * 5;
    const bidAmount = Math.random() * 2000 + 1500; // More liquidity
    bidCumulative += bidAmount;
    bids.push({ price: bidPrice, amount: bidAmount, total: bidCumulative });

    // Thin ask side
    const askPrice = basePrice + i * 10 + Math.random() * 5;
    const askAmount = Math.random() * 500 + 100; // Less liquidity
    askCumulative += askAmount;
    asks.push({ price: askPrice, amount: askAmount, total: askCumulative });
  }

  return {
    assetPair: "BTC-USDC",
    bids,
    asks,
    timestamp: Date.now(),
  };
}

// Live updating order book simulation
function generateLiveOrderBook(updateCount: number): OrderBookSnapshot {
  const basePrice = 50 + Math.sin(updateCount / 10) * 5;
  const levels = 60 + Math.floor(Math.random() * 20);
  return generateOrderBook(levels, basePrice);
}

/**
 * Standard order book with 50 price levels on each side
 */
export const Default: Story = {
  args: {
    assetId: "XLM-USDC",
    orderBook: generateOrderBook(50, 0.123),
    isConnected: true,
    height: 280,
  },
};

/**
 * Deep liquidity with 100+ price levels
 */
export const DeepLiquidity: Story = {
  args: {
    assetId: "BTC-USDC",
    orderBook: generateOrderBook(120, 42000),
    isConnected: true,
    height: 350,
  },
};

/**
 * Tight spread with concentrated liquidity
 */
export const TightSpread: Story = {
  args: {
    assetId: "XLM-USDC",
    orderBook: generateTightSpreadOrderBook(),
    isConnected: true,
    height: 280,
  },
};

/**
 * Imbalanced order book (heavy bid side)
 */
export const ImbalancedLiquidity: Story = {
  args: {
    assetId: "BTC-USDC",
    orderBook: generateImbalancedOrderBook(),
    isConnected: true,
    height: 320,
  },
};

/**
 * Tall canvas for detailed analysis
 */
export const TallChart: Story = {
  args: {
    assetId: "NGN-XLM",
    orderBook: generateOrderBook(80, 15.5),
    isConnected: true,
    height: 500,
  },
};

/**
 * Disconnected state (no live updates)
 */
export const Disconnected: Story = {
  args: {
    assetId: "XLM-USDC",
    orderBook: generateOrderBook(50, 0.123),
    isConnected: false,
    height: 280,
  },
};

/**
 * Empty order book
 */
export const NoData: Story = {
  args: {
    assetId: "XLM-USDC",
    orderBook: null,
    isConnected: false,
    height: 280,
  },
};

/**
 * Live updating order book with 60 FPS animation
 * Simulates high-frequency WebSocket updates
 */
export const LiveUpdating: Story = {
  args: {
    assetId: "XLM-USDC",
    orderBook: generateOrderBook(50, 0.123),
    isConnected: true,
    height: 280,
  },
  render: (args) => {
    const [updateCount, setUpdateCount] = React.useState(0);
    const [orderBook, setOrderBook] = React.useState(args.orderBook);

    React.useEffect(() => {
      const interval = setInterval(() => {
        setUpdateCount((c) => c + 1);
        setOrderBook(generateLiveOrderBook(updateCount));
      }, 100); // 10 updates per second

      return () => clearInterval(interval);
    }, [updateCount]);

    return <OrderBookDepthCanvas {...args} orderBook={orderBook} />;
  },
};

/**
 * Performance stress test with maximum data points
 */
export const StressTest: Story = {
  args: {
    assetId: "BTC-USDC",
    orderBook: generateOrderBook(200, 42000),
    isConnected: true,
    height: 400,
  },
  parameters: {
    docs: {
      description: {
        story: "Stress test with 200+ price levels to validate 60 FPS performance",
      },
    },
  },
};
