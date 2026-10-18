import type { Meta, StoryObj } from "@storybook/react";
import { LiquidationHistoryTable, type LiquidationEvent } from "./LiquidationHistoryTable";

// Generate mock liquidation events
function generateMockEvents(count: number): LiquidationEvent[] {
  const events: LiquidationEvent[] = [];
  const collateralAssets = ["XLM", "USDC", "NGNC", "BTC"];
  const debtAssets = ["USDC", "XLM", "NGNC"];

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - i * 3600000 * 24).toISOString();
    const collateralAsset = collateralAssets[i % collateralAssets.length];
    const debtAsset = debtAssets[i % debtAssets.length];
    const seizedAmount = Math.random() * 100000 + 1000;
    const seizedUsd = seizedAmount * (Math.random() * 0.5 + 0.8);
    const clearedAmount = Math.random() * 50000 + 500;
    const clearedUsd = clearedAmount * (Math.random() * 0.3 + 0.9);
    const healthFactor = Math.random() * 0.5 + 0.7;
    const network = i % 2 === 0 ? "public" : "testnet";

    events.push({
      id: `liq-${i + 1}`,
      timestamp,
      vaultId: `vault-${collateralAsset.toLowerCase()}-${String(i + 1).padStart(3, "0")}`,
      vaultOwner: `G${Math.random().toString(36).substring(2, 58).toUpperCase()}`,
      liquidatorAddress: `G${Math.random().toString(36).substring(2, 58).toUpperCase()}`,
      collateralAsset,
      seizedCollateralAmount: seizedAmount,
      seizedCollateralUsd: seizedUsd,
      debtAsset,
      clearedDebtAmount: clearedAmount,
      clearedDebtUsd: clearedUsd,
      healthFactorBefore: healthFactor,
      transactionHash: `${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
      penaltyPercent: Math.random() * 5 + 3,
      network: network as "testnet" | "public",
    });
  }

  return events;
}

const meta = {
  title: "Vaults/LiquidationHistoryTable",
  component: LiquidationHistoryTable,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Comprehensive table view for displaying historical protocol vault liquidations with seized collateral amounts, cleared debt statistics, and direct block explorer links. Built with @tanstack/react-table for smooth sorting and pagination.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Table title displayed in header",
    },
    showExport: {
      control: "boolean",
      description: "Show/hide CSV export button",
    },
    initialPageSize: {
      control: { type: "select", options: [5, 10, 20, 50] },
      description: "Initial number of rows per page",
    },
  },
} satisfies Meta<typeof LiquidationHistoryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default table with 15 liquidation events
 */
export const Default: Story = {
  args: {
    data: generateMockEvents(15),
    title: "Liquidation History",
    showExport: true,
    initialPageSize: 10,
  },
};

/**
 * Small dataset (5 events)
 */
export const SmallDataset: Story = {
  args: {
    data: generateMockEvents(5),
    title: "Recent Liquidations",
    showExport: true,
    initialPageSize: 10,
  },
  parameters: {
    docs: {
      description: {
        story: "Table with a small number of liquidation events. All fit on a single page.",
      },
    },
  },
};

/**
 * Large dataset (100 events) for testing pagination
 */
export const LargeDataset: Story = {
  args: {
    data: generateMockEvents(100),
    title: "Protocol Liquidation History",
    showExport: true,
    initialPageSize: 20,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Table with 100 liquidation events to demonstrate smooth pagination and sorting with large datasets.",
      },
    },
  },
};

/**
 * Empty state with no liquidations
 */
export const Empty: Story = {
  args: {
    data: [],
    title: "Liquidation History",
    showExport: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state displayed when there are no liquidation events to show.",
      },
    },
  },
};

/**
 * Without export button
 */
export const NoExport: Story = {
  args: {
    data: generateMockEvents(15),
    title: "Liquidation History",
    showExport: false,
    initialPageSize: 10,
  },
  parameters: {
    docs: {
      description: {
        story: "Table without CSV export functionality.",
      },
    },
  },
};

/**
 * Custom page size (5 rows per page)
 */
export const SmallPageSize: Story = {
  args: {
    data: generateMockEvents(15),
    title: "Liquidation History",
    showExport: true,
    initialPageSize: 5,
  },
  parameters: {
    docs: {
      description: {
        story: "Table configured to show only 5 rows per page.",
      },
    },
  },
};

/**
 * Custom page size (50 rows per page)
 */
export const LargePageSize: Story = {
  args: {
    data: generateMockEvents(100),
    title: "Complete Liquidation History",
    showExport: true,
    initialPageSize: 50,
  },
  parameters: {
    docs: {
      description: {
        story: "Table configured to show 50 rows per page for comprehensive viewing.",
      },
    },
  },
};

/**
 * Critical liquidations (health factor < 1)
 */
export const CriticalLiquidations: Story = {
  args: {
    data: generateMockEvents(15).map((event) => ({
      ...event,
      healthFactorBefore: Math.random() * 0.3 + 0.7, // 0.7-1.0
    })),
    title: "Critical Liquidations",
    showExport: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Liquidations with health factors below 1.0, indicating critical undercollateralization.",
      },
    },
  },
};

/**
 * High-value liquidations
 */
export const HighValueLiquidations: Story = {
  args: {
    data: generateMockEvents(10).map((event) => ({
      ...event,
      seizedCollateralAmount: Math.random() * 500000 + 100000,
      seizedCollateralUsd: Math.random() * 600000 + 120000,
      clearedDebtAmount: Math.random() * 400000 + 80000,
      clearedDebtUsd: Math.random() * 480000 + 96000,
    })),
    title: "High-Value Liquidations",
    showExport: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Liquidations involving large amounts of collateral and debt (> $100k USD).",
      },
    },
  },
};

/**
 * With row click handler
 */
export const WithRowClick: Story = {
  args: {
    data: generateMockEvents(15),
    title: "Interactive Liquidation History",
    showExport: true,
    initialPageSize: 10,
    onRowClick: (event) => {
      alert(`Clicked liquidation ${event.id}\nVault: ${event.vaultId}\nSeized: $${event.seizedCollateralUsd.toFixed(2)}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Table with row click handler. Click any row to see event details.",
      },
    },
  },
};

/**
 * Custom title
 */
export const CustomTitle: Story = {
  args: {
    data: generateMockEvents(15),
    title: "Protocol Risk Events - Liquidations",
    showExport: true,
    initialPageSize: 10,
  },
  parameters: {
    docs: {
      description: {
        story: "Table with a custom title for specific use cases.",
      },
    },
  },
};

/**
 * Testnet liquidations
 */
export const TestnetOnly: Story = {
  args: {
    data: generateMockEvents(15).map((event) => ({
      ...event,
      network: "testnet" as const,
    })),
    title: "Testnet Liquidation History",
    showExport: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Liquidations from testnet environment. Explorer links point to testnet.",
      },
    },
  },
};

/**
 * Mainnet liquidations
 */
export const MainnetOnly: Story = {
  args: {
    data: generateMockEvents(15).map((event) => ({
      ...event,
      network: "public" as const,
    })),
    title: "Mainnet Liquidation History",
    showExport: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Liquidations from mainnet (public) environment. Explorer links point to public network.",
      },
    },
  },
};

/**
 * Single liquidation event
 */
export const SingleEvent: Story = {
  args: {
    data: generateMockEvents(1),
    title: "Latest Liquidation",
    showExport: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Table displaying a single liquidation event.",
      },
    },
  },
};

/**
 * Mixed asset types
 */
export const MixedAssets: Story = {
  args: {
    data: [
      ...generateMockEvents(5).map((e) => ({ ...e, collateralAsset: "XLM", debtAsset: "USDC" })),
      ...generateMockEvents(5).map((e) => ({ ...e, collateralAsset: "USDC", debtAsset: "XLM" })),
      ...generateMockEvents(5).map((e) => ({ ...e, collateralAsset: "NGNC", debtAsset: "USDC" })),
    ],
    title: "Multi-Asset Liquidations",
    showExport: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Liquidations across different asset pairs: XLM/USDC, USDC/XLM, NGNC/USDC.",
      },
    },
  },
};

/**
 * Recent liquidations (last 24 hours)
 */
export const Recent24Hours: Story = {
  args: {
    data: generateMockEvents(10).map((event, i) => ({
      ...event,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(), // Hourly intervals
    })),
    title: "Recent Liquidations (24h)",
    showExport: true,
    initialPageSize: 10,
  },
  parameters: {
    docs: {
      description: {
        story: "Liquidations from the last 24 hours with hourly timestamps.",
      },
    },
  },
};

/**
 * Loading state simulation
 */
export const LoadingSimulation: Story = {
  args: {
    data: [],
    title: "Loading Liquidation History...",
    showExport: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Simulates the loading state before data arrives.",
      },
    },
  },
};
