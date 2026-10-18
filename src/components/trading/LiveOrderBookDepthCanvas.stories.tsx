import type { Meta, StoryObj } from "@storybook/react";
import { LiveOrderBookDepthCanvas } from "./LiveOrderBookDepthCanvas";

const meta = {
  title: "Trading/LiveOrderBookDepthCanvas",
  component: LiveOrderBookDepthCanvas,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Live WebSocket-connected order book depth chart. Automatically subscribes to real-time market data via useOrderBook hook. This is the recommended way to use the canvas depth chart in production.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    assetId: {
      control: "select",
      options: ["XLM-USDC", "NGN-XLM", "BTC-USDC"],
      description: "Asset pair to subscribe to",
    },
    depth: {
      control: { type: "range", min: 10, max: 200, step: 10 },
      description: "Number of price levels per side",
    },
    height: {
      control: { type: "range", min: 200, max: 600, step: 20 },
      description: "Chart height in pixels",
    },
  },
} satisfies Meta<typeof LiveOrderBookDepthCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Standard live order book with 100 levels
 */
export const Default: Story = {
  args: {
    assetId: "XLM-USDC",
    depth: 100,
    height: 280,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Connects to live WebSocket feed and displays real-time order book depth. Updates automatically as market conditions change.",
      },
    },
  },
};

/**
 * Deep liquidity view with 150 levels
 */
export const DeepLiquidity: Story = {
  args: {
    assetId: "BTC-USDC",
    depth: 150,
    height: 350,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows deeper order book with 150 price levels per side for comprehensive market analysis.",
      },
    },
  },
};

/**
 * Shallow order book with only 25 levels
 */
export const ShallowDepth: Story = {
  args: {
    assetId: "NGN-XLM",
    depth: 25,
    height: 280,
  },
  parameters: {
    docs: {
      description: {
        story: "Displays only the top 25 levels, useful for focusing on immediate market depth.",
      },
    },
  },
};

/**
 * Tall chart for detailed analysis
 */
export const TallChart: Story = {
  args: {
    assetId: "XLM-USDC",
    depth: 100,
    height: 500,
  },
  parameters: {
    docs: {
      description: {
        story: "Increased height provides more vertical space for analyzing depth distribution.",
      },
    },
  },
};

/**
 * Compact view for dashboard widgets
 */
export const Compact: Story = {
  args: {
    assetId: "XLM-USDC",
    depth: 50,
    height: 220,
  },
  parameters: {
    docs: {
      description: {
        story: "Smaller height suitable for dashboard widgets or side panels.",
      },
    },
  },
};

/**
 * Maximum depth for professional traders
 */
export const MaximumDepth: Story = {
  args: {
    assetId: "BTC-USDC",
    depth: 200,
    height: 400,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Renders 200 price levels per side for professional traders needing comprehensive market visibility. Stress tests canvas performance.",
      },
    },
  },
};
