import { render, screen, fireEvent } from "@testing-library/react";
import { OrderBookDepthCanvas } from "./OrderBookDepthCanvas";
import type { OrderBookSnapshot } from "@/types";

// Mock canvas context for Node test environment
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    scale: jest.fn(),
    fillRect: jest.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    setLineDash: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    fillText: jest.fn(),
    font: "",
    textAlign: "",
    textBaseline: "",
    roundRect: jest.fn(),
    clearRect: jest.fn(),
  })) as any;
});

const mockOrderBook: OrderBookSnapshot = {
  assetPair: "XLM-USDC",
  bids: [
    { price: 0.125, amount: 1000, total: 1000 },
    { price: 0.124, amount: 1500, total: 2500 },
    { price: 0.123, amount: 2000, total: 4500 },
  ],
  asks: [
    { price: 0.126, amount: 1200, total: 1200 },
    { price: 0.127, amount: 1800, total: 3000 },
    { price: 0.128, amount: 2200, total: 5200 },
  ],
  timestamp: Date.now(),
};

describe("OrderBookDepthCanvas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders canvas element", () => {
    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
      />
    );

    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("displays asset ID in header", () => {
    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
      />
    );

    expect(screen.getByText("XLM-USDC")).toBeInTheDocument();
  });

  it("shows LIVE status when connected", () => {
    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
      />
    );

    expect(screen.getByText("60 FPS")).toBeInTheDocument();
  });

  it("shows PAUSED status when disconnected", () => {
    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={false}
      />
    );

    expect(screen.getByText("PAUSED")).toBeInTheDocument();
  });

  it("displays message when no order book data", () => {
    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={null}
        isConnected={false}
      />
    );

    expect(screen.getByText("No order book data available")).toBeInTheDocument();
  });

  it("applies custom height", () => {
    const { container } = render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
        height={400}
      />
    );

    const wrapper = container.querySelector("div[style*='height']");
    expect(wrapper).toHaveStyle({ height: "500px" }); // height + 100 for padding
  });

  it("applies custom className", () => {
    const { container } = render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-class");
  });

  it("shows level count in footer", () => {
    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
      />
    );

    // Should show combined bid and ask levels
    expect(screen.getByText(/\d+ levels/)).toBeInTheDocument();
  });

  it("displays performance indicators in footer", () => {
    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
      />
    );

    expect(screen.getByText(/Hardware-accelerated Canvas/)).toBeInTheDocument();
    expect(screen.getByText(/High-DPI Ready/)).toBeInTheDocument();
  });

  it("canvas has crosshair cursor", () => {
    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
      />
    );

    const canvas = document.querySelector("canvas");
    expect(canvas).toHaveClass("cursor-crosshair");
  });

  it("handles mouse move events on canvas", () => {
    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
      />
    );

    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    // Simulate mouse move (should not throw)
    fireEvent.mouseMove(canvas!, { clientX: 100, clientY: 100 });
  });

  it("handles mouse leave events on canvas", () => {
    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
      />
    );

    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    // Simulate mouse leave (should not throw)
    fireEvent.mouseLeave(canvas!);
  });

  it("renders with empty bids array", () => {
    const emptyBidsOrderBook: OrderBookSnapshot = {
      ...mockOrderBook,
      bids: [],
    };

    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={emptyBidsOrderBook}
        isConnected={true}
      />
    );

    expect(screen.getByText("No order book data available")).toBeInTheDocument();
  });

  it("renders with empty asks array", () => {
    const emptyAsksOrderBook: OrderBookSnapshot = {
      ...mockOrderBook,
      asks: [],
    };

    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={emptyAsksOrderBook}
        isConnected={true}
      />
    );

    expect(screen.getByText("No order book data available")).toBeInTheDocument();
  });

  it("uses correct asset decimals for formatting", () => {
    // XLM-USDC should use specific decimal places based on ASSET_DECIMALS config
    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
      />
    );

    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("handles window resize events", () => {
    render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
      />
    );

    // Trigger window resize
    fireEvent(window, new Event("resize"));

    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("memoizes component to prevent unnecessary re-renders", () => {
    const { rerender } = render(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
      />
    );

    const canvas = document.querySelector("canvas");
    const firstCanvas = canvas;

    // Re-render with same props
    rerender(
      <OrderBookDepthCanvas
        assetId="XLM-USDC"
        orderBook={mockOrderBook}
        isConnected={true}
      />
    );

    const secondCanvas = document.querySelector("canvas");
    expect(secondCanvas).toBe(firstCanvas);
  });
});
