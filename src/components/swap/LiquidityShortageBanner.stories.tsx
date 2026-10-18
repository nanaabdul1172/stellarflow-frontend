import type { Meta, StoryObj } from "@storybook/react";
import { LiquidityShortageBanner } from "./LiquidityShortageBanner";

const meta = {
  title: "Swap/LiquidityShortageBanner",
  component: LiquidityShortageBanner,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sticky warning banner that alerts traders when their order size exceeds a configurable threshold (default: 10%) of total pool liquidity depth. Helps protect traders from executing large trades in thin liquidity pools with significant price impact.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    tradeAmount: {
      control: { type: "number", min: 0, step: 10000 },
      description: "Trade input amount in base units",
    },
    poolDepth: {
      control: { type: "number", min: 0, step: 100000 },
      description: "Total pool liquidity depth in base units",
    },
    thresholdPercent: {
      control: { type: "range", min: 5, max: 25, step: 1 },
      description: "Percentage threshold for showing warning",
    },
    priceImpact: {
      control: { type: "number", min: 0, max: 50, step: 0.1 },
      description: "Estimated price impact percentage",
    },
    slippage: {
      control: { type: "number", min: 0, max: 20, step: 0.1 },
      description: "Estimated slippage percentage",
    },
  },
} satisfies Meta<typeof LiquidityShortageBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Standard warning at 11.76% of pool depth (just above 10% threshold)
 */
export const Default: Story = {
  args: {
    tradeAmount: 500000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
    priceImpact: 2.4,
    slippage: 1.8,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
};

/**
 * Warning level (10-15% of pool depth) - amber background
 */
export const WarningLevel: Story = {
  args: {
    tradeAmount: 550000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
    priceImpact: 3.1,
    slippage: 2.2,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Warning level shown when trade is 10-15% of pool depth. Uses amber color scheme.",
      },
    },
  },
};

/**
 * High level (15-25% of pool depth) - orange background
 */
export const HighLevel: Story = {
  args: {
    tradeAmount: 850000,
    tradeAsset: "USDC",
    poolDepth: 4250000,
    poolPair: "USDC / NGNC",
    priceImpact: 8.5,
    slippage: 5.2,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    docs: {
      description: {
        story:
          "High severity level shown when trade is 15-25% of pool depth. Uses orange color scheme.",
      },
    },
  },
};

/**
 * Critical level (25%+ of pool depth) - red background
 */
export const CriticalLevel: Story = {
  args: {
    tradeAmount: 1200000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
    priceImpact: 15.8,
    slippage: 12.4,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Critical severity level shown when trade exceeds 25% of pool depth. Uses red color scheme with strong visual emphasis.",
      },
    },
  },
};

/**
 * Without price impact or slippage metrics
 */
export const WithoutMetrics: Story = {
  args: {
    tradeAmount: 500000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
    priceImpact: undefined,
    slippage: undefined,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Banner without price impact or slippage metrics displayed.",
      },
    },
  },
};

/**
 * Without split order action
 */
export const WithoutSplitAction: Story = {
  args: {
    tradeAmount: 500000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
    priceImpact: 2.4,
    slippage: 1.8,
    onSplitOrder: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Banner without the 'Split Order' action button. Use when batch splitting is not available.",
      },
    },
  },
};

/**
 * Small pool with high trade impact
 */
export const SmallPool: Story = {
  args: {
    tradeAmount: 300000,
    tradeAsset: "NGNC",
    poolDepth: 1500000,
    poolPair: "NGNC / USDC",
    priceImpact: 6.8,
    slippage: 4.1,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Example with smaller pool where a moderate trade causes significant impact (20%).",
      },
    },
  },
};

/**
 * Very large trade (50%+ of pool)
 */
export const ExtremelyLargeTrade: Story = {
  args: {
    tradeAmount: 2500000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
    priceImpact: 28.5,
    slippage: 22.8,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Extreme case where trade is ~59% of pool depth. Shows critical level styling with very high impact metrics.",
      },
    },
  },
};

/**
 * Custom threshold at 5%
 */
export const CustomThreshold5Percent: Story = {
  args: {
    tradeAmount: 250000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
    priceImpact: 1.2,
    slippage: 0.8,
    thresholdPercent: 5,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Warning shown with custom 5% threshold instead of default 10%.",
      },
    },
  },
};

/**
 * Custom threshold at 20%
 */
export const CustomThreshold20Percent: Story = {
  args: {
    tradeAmount: 900000,
    tradeAsset: "USDC",
    poolDepth: 4250000,
    poolPair: "USDC / XLM",
    priceImpact: 9.2,
    slippage: 6.5,
    thresholdPercent: 20,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Warning shown with custom 20% threshold. Trade is ~21.2% of pool, just above threshold.",
      },
    },
  },
};

/**
 * Large numbers formatting
 */
export const LargeNumbers: Story = {
  args: {
    tradeAmount: 5000000,
    tradeAsset: "USDC",
    poolDepth: 42500000,
    poolPair: "USDC / XLM",
    priceImpact: 3.8,
    slippage: 2.9,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates proper formatting of large numbers with thousands separators.",
      },
    },
  },
};

/**
 * Price impact only (no slippage)
 */
export const PriceImpactOnly: Story = {
  args: {
    tradeAmount: 500000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
    priceImpact: 2.4,
    slippage: undefined,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Shows only price impact metric without slippage.",
      },
    },
  },
};

/**
 * Slippage only (no price impact)
 */
export const SlippageOnly: Story = {
  args: {
    tradeAmount: 500000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
    priceImpact: undefined,
    slippage: 1.8,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Shows only slippage metric without price impact.",
      },
    },
  },
};

/**
 * With session dismissal key
 */
export const WithDismissKey: Story = {
  args: {
    tradeAmount: 500000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
    priceImpact: 2.4,
    slippage: 1.8,
    dismissKey: "xlm-usdc-500k",
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Banner with session-based dismissal. Once dismissed, it won't show again for this browser session.",
      },
    },
  },
};

/**
 * Minimal configuration
 */
export const Minimal: Story = {
  args: {
    tradeAmount: 500000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Minimal banner configuration with only required props. No metrics or actions displayed.",
      },
    },
  },
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: {
    tradeAmount: 500000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
    priceImpact: 2.4,
    slippage: 1.8,
    onSplitOrder: () => alert("Opening batch swap wizard..."),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
    docs: {
      description: {
        story: "Banner layout optimized for mobile viewports with responsive text sizing.",
      },
    },
  },
};
