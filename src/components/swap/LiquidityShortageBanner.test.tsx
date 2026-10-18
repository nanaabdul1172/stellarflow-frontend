import { render, screen, fireEvent } from "@testing-library/react";
import { LiquidityShortageBanner } from "./LiquidityShortageBanner";

describe("LiquidityShortageBanner", () => {
  const defaultProps = {
    tradeAmount: 500000,
    tradeAsset: "XLM",
    poolDepth: 4250000,
    poolPair: "XLM / USDC",
    priceImpact: 2.4,
    slippage: 1.8,
  };

  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("Visibility Logic", () => {
    it("renders when trade exceeds 10% threshold", () => {
      render(<LiquidityShortageBanner {...defaultProps} />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Large Order Warning")).toBeInTheDocument();
    });

    it("does not render when trade is below 10% threshold", () => {
      render(
        <LiquidityShortageBanner
          {...defaultProps}
          tradeAmount={400000} // ~9.4% of pool
        />
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("renders when trade equals exactly 10% threshold", () => {
      render(
        <LiquidityShortageBanner
          {...defaultProps}
          tradeAmount={425000} // exactly 10%
        />
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("respects custom threshold", () => {
      render(
        <LiquidityShortageBanner
          {...defaultProps}
          tradeAmount={200000} // ~4.7%
          thresholdPercent={5}
        />
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("renders with custom threshold when exceeded", () => {
      render(
        <LiquidityShortageBanner
          {...defaultProps}
          tradeAmount={250000} // ~5.9%
          thresholdPercent={5}
        />
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("Content Display", () => {
    it("displays pool depth percentage", () => {
      render(<LiquidityShortageBanner {...defaultProps} />);
      // 500000 / 4250000 = 11.76%
      expect(screen.getByText(/11\.76% of XLM \/ USDC pool depth/)).toBeInTheDocument();
    });

    it("displays trade amount and asset", () => {
      render(<LiquidityShortageBanner {...defaultProps} />);
      expect(screen.getByText(/500,000 XLM/)).toBeInTheDocument();
    });

    it("displays threshold in warning message", () => {
      render(<LiquidityShortageBanner {...defaultProps} />);
      expect(screen.getByText(/exceeds 10% of available pool liquidity/)).toBeInTheDocument();
    });

    it("displays price impact when provided", () => {
      render(<LiquidityShortageBanner {...defaultProps} priceImpact={2.4} />);
      expect(screen.getByText(/Price Impact:/)).toBeInTheDocument();
      expect(screen.getByText(/2\.40%/)).toBeInTheDocument();
    });

    it("displays slippage when provided", () => {
      render(<LiquidityShortageBanner {...defaultProps} slippage={1.8} />);
      expect(screen.getByText(/Expected Slippage:/)).toBeInTheDocument();
      expect(screen.getByText(/1\.80%/)).toBeInTheDocument();
    });

    it("does not display metrics section when none provided", () => {
      render(
        <LiquidityShortageBanner
          {...defaultProps}
          priceImpact={undefined}
          slippage={undefined}
        />
      );
      expect(screen.queryByText(/Price Impact:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Expected Slippage:/)).not.toBeInTheDocument();
    });
  });

  describe("Severity Levels", () => {
    it("applies warning styling for 10-15% range", () => {
      render(
        <LiquidityShortageBanner
          {...defaultProps}
          tradeAmount={500000} // ~11.76%
        />
      );
      const banner = screen.getByRole("alert");
      expect(banner).toHaveClass("bg-amber-500");
    });

    it("applies high severity styling for 15-25% range", () => {
      render(
        <LiquidityShortageBanner
          {...defaultProps}
          tradeAmount={850000} // 20%
        />
      );
      const banner = screen.getByRole("alert");
      expect(banner).toHaveClass("bg-orange-500");
    });

    it("applies critical styling for 25%+ range", () => {
      render(
        <LiquidityShortageBanner
          {...defaultProps}
          tradeAmount={1200000} // ~28.24%
        />
      );
      const banner = screen.getByRole("alert");
      expect(banner).toHaveClass("bg-rose-600");
    });
  });

  describe("Dismiss Functionality", () => {
    it("hides banner when dismiss button is clicked", () => {
      render(<LiquidityShortageBanner {...defaultProps} />);
      
      const dismissButton = screen.getByLabelText(/Dismiss liquidity warning/);
      fireEvent.click(dismissButton);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("persists dismissal to session storage when dismissKey provided", () => {
      const dismissKey = "xlm-usdc-500000";
      render(<LiquidityShortageBanner {...defaultProps} dismissKey={dismissKey} />);

      const dismissButton = screen.getByLabelText(/Dismiss liquidity warning/);
      fireEvent.click(dismissButton);

      expect(
        sessionStorage.getItem(`stellarflow_liquidity_warning_dismissed_${dismissKey}`)
      ).toBe("true");
    });

    it("loads dismissed state from session storage on mount", () => {
      const dismissKey = "xlm-usdc-500000";
      sessionStorage.setItem(
        `stellarflow_liquidity_warning_dismissed_${dismissKey}`,
        "true"
      );

      render(<LiquidityShortageBanner {...defaultProps} dismissKey={dismissKey} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("does not persist dismissal when dismissKey not provided", () => {
      render(<LiquidityShortageBanner {...defaultProps} />);

      const dismissButton = screen.getByLabelText(/Dismiss liquidity warning/);
      fireEvent.click(dismissButton);

      expect(sessionStorage.length).toBe(0);
    });
  });

  describe("Split Order Action", () => {
    it("renders split order button when callback provided", () => {
      const onSplitOrder = jest.fn();
      render(<LiquidityShortageBanner {...defaultProps} onSplitOrder={onSplitOrder} />);

      expect(
        screen.getByRole("button", { name: /Split Order into Smaller Batches/ })
      ).toBeInTheDocument();
    });

    it("does not render split order button when callback not provided", () => {
      render(<LiquidityShortageBanner {...defaultProps} onSplitOrder={undefined} />);

      expect(
        screen.queryByRole("button", { name: /Split Order into Smaller Batches/ })
      ).not.toBeInTheDocument();
    });

    it("calls onSplitOrder when button clicked", () => {
      const onSplitOrder = jest.fn();
      render(<LiquidityShortageBanner {...defaultProps} onSplitOrder={onSplitOrder} />);

      const splitButton = screen.getByRole("button", {
        name: /Split Order into Smaller Batches/,
      });
      fireEvent.click(splitButton);

      expect(onSplitOrder).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("handles zero pool depth gracefully", () => {
      render(<LiquidityShortageBanner {...defaultProps} poolDepth={0} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("handles negative pool depth gracefully", () => {
      render(<LiquidityShortageBanner {...defaultProps} poolDepth={-1000} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("handles zero trade amount", () => {
      render(<LiquidityShortageBanner {...defaultProps} tradeAmount={0} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("handles negative trade amount gracefully", () => {
      render(<LiquidityShortageBanner {...defaultProps} tradeAmount={-500000} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("handles non-finite pool depth", () => {
      render(<LiquidityShortageBanner {...defaultProps} poolDepth={NaN} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("handles very large percentages correctly", () => {
      render(
        <LiquidityShortageBanner
          {...defaultProps}
          tradeAmount={5000000} // ~117.6% of pool
        />
      );
      const banner = screen.getByRole("alert");
      expect(banner).toBeInTheDocument();
      expect(screen.getByText(/117\.6% of XLM \/ USDC pool depth/)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA role", () => {
      render(<LiquidityShortageBanner {...defaultProps} />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("has aria-live assertive for immediate announcement", () => {
      render(<LiquidityShortageBanner {...defaultProps} />);
      const banner = screen.getByRole("alert");
      expect(banner).toHaveAttribute("aria-live", "assertive");
    });

    it("dismiss button has accessible label", () => {
      render(<LiquidityShortageBanner {...defaultProps} />);
      const dismissButton = screen.getByLabelText(/Dismiss liquidity warning for this session/);
      expect(dismissButton).toBeInTheDocument();
    });

    it("icons are hidden from screen readers", () => {
      render(<LiquidityShortageBanner {...defaultProps} />);
      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("Formatting", () => {
    it("formats large numbers with thousands separators", () => {
      render(
        <LiquidityShortageBanner
          {...defaultProps}
          tradeAmount={5000000}
        />
      );
      expect(screen.getByText(/5,000,000 XLM/)).toBeInTheDocument();
    });

    it("formats percentages with appropriate precision", () => {
      // High percentage (>= 10) should show 1 decimal
      render(
        <LiquidityShortageBanner
          {...defaultProps}
          tradeAmount={500000} // 11.76%
        />
      );
      expect(screen.getByText(/11\.8% of/)).toBeInTheDocument();
    });

    it("formats small percentages with 2 decimals", () => {
      render(
        <LiquidityShortageBanner
          {...defaultProps}
          tradeAmount={400000} // 9.41%
          thresholdPercent={5}
        />
      );
      expect(screen.getByText(/9\.41% of/)).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("applies responsive text sizes", () => {
      render(<LiquidityShortageBanner {...defaultProps} />);
      const title = screen.getByText("Large Order Warning");
      expect(title.parentElement).toHaveClass("sm:text-base");
    });

    it("applies responsive gap spacing", () => {
      render(<LiquidityShortageBanner {...defaultProps} />);
      const banner = screen.getByRole("alert");
      expect(banner.querySelector(".gap-x-2")).toBeInTheDocument();
    });
  });
});
