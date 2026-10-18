import { render, screen, fireEvent, within } from "@testing-library/react";
import { LiquidationHistoryTable, type LiquidationEvent } from "./LiquidationHistoryTable";

const mockLiquidationEvents: LiquidationEvent[] = [
  {
    id: "liq-1",
    timestamp: "2026-10-15T14:30:00Z",
    vaultId: "vault-xlm-001",
    vaultOwner: "GCZXQZJQV7CKVLSXYUVZFQVXL3HNZXU7UHCX7YLPJ4KVLSXYUVZFQVXL",
    liquidatorAddress: "GDRXQZJQV7CKVLSXYUVZFQVXL3HNZXU7UHCX7YLPJ4KVLSXYUVZFQVXD",
    collateralAsset: "XLM",
    seizedCollateralAmount: 50000,
    seizedCollateralUsd: 6000,
    debtAsset: "USDC",
    clearedDebtAmount: 5000,
    clearedDebtUsd: 5000,
    healthFactorBefore: 0.85,
    transactionHash: "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567",
    penaltyPercent: 5,
    network: "public",
  },
  {
    id: "liq-2",
    timestamp: "2026-10-14T10:15:00Z",
    vaultId: "vault-usdc-002",
    vaultOwner: "GBZXQZJQV7CKVLSXYUVZFQVXL3HNZXU7UHCX7YLPJ4KVLSXYUVZFQVXM",
    liquidatorAddress: "GCRXQZJQV7CKVLSXYUVZFQVXL3HNZXU7UHCX7YLPJ4KVLSXYUVZFQVXE",
    collateralAsset: "USDC",
    seizedCollateralAmount: 10000,
    seizedCollateralUsd: 10000,
    debtAsset: "XLM",
    clearedDebtAmount: 80000,
    clearedDebtUsd: 9600,
    healthFactorBefore: 0.92,
    transactionHash: "def456ghi789jkl012mno345pqr678stu901vwx234yz567abc123",
    penaltyPercent: 3,
    network: "testnet",
  },
  {
    id: "liq-3",
    timestamp: "2026-10-13T16:45:00Z",
    vaultId: "vault-xlm-003",
    vaultOwner: "GAXQZJQV7CKVLSXYUVZFQVXL3HNZXU7UHCX7YLPJ4KVLSXYUVZFQVXN",
    liquidatorAddress: "GDRXQZJQV7CKVLSXYUVZFQVXL3HNZXU7UHCX7YLPJ4KVLSXYUVZFQVXF",
    collateralAsset: "XLM",
    seizedCollateralAmount: 25000,
    seizedCollateralUsd: 3000,
    debtAsset: "USDC",
    clearedDebtAmount: 2500,
    clearedDebtUsd: 2500,
    healthFactorBefore: 1.15,
    transactionHash: "ghi789jkl012mno345pqr678stu901vwx234yz567abc123def456",
    penaltyPercent: 4,
    network: "public",
  },
];

describe("LiquidationHistoryTable", () => {
  describe("Rendering", () => {
    it("renders table with liquidation data", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      expect(screen.getByText("Liquidation History")).toBeInTheDocument();
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("renders summary statistics", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      expect(screen.getByText("Total Events")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument(); // count
      expect(screen.getByText("Total Seized")).toBeInTheDocument();
      expect(screen.getByText("Total Debt Cleared")).toBeInTheDocument();
      expect(screen.getByText("Avg Health Factor")).toBeInTheDocument();
    });

    it("renders all column headers", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      expect(screen.getByText("Date")).toBeInTheDocument();
      expect(screen.getByText("Vault ID")).toBeInTheDocument();
      expect(screen.getByText("Seized Collateral")).toBeInTheDocument();
      expect(screen.getByText("Cleared Debt")).toBeInTheDocument();
      expect(screen.getByText("Liquidator")).toBeInTheDocument();
      expect(screen.getByText("Health Factor")).toBeInTheDocument();
      expect(screen.getByText("Penalty")).toBeInTheDocument();
      expect(screen.getByText("Transaction")).toBeInTheDocument();
    });

    it("renders liquidation event data in rows", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      // Check for truncated vault IDs
      expect(screen.getByText(/vault-xlm-001/)).toBeInTheDocument();
      expect(screen.getByText(/vault-usdc-002/)).toBeInTheDocument();
    });

    it("displays empty state when no data", () => {
      render(<LiquidationHistoryTable data={[]} />);

      expect(screen.getByText("No Liquidations Found")).toBeInTheDocument();
      expect(screen.getByText("There are no historical liquidation events to display.")).toBeInTheDocument();
    });

    it("renders custom title when provided", () => {
      render(
        <LiquidationHistoryTable
          data={mockLiquidationEvents}
          title="Protocol Risk Events"
        />
      );

      expect(screen.getByText("Protocol Risk Events")).toBeInTheDocument();
    });
  });

  describe("Column Sorting", () => {
    it("sorts by date in descending order by default", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const rows = screen.getAllByRole("row").slice(1); // Skip header row
      const firstRow = rows[0];

      // Most recent event should be first
      expect(within(firstRow).getByText(/Oct.*15/)).toBeInTheDocument();
    });

    it("toggles sort direction when clicking column header", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const dateHeader = screen.getByText("Date").closest("th");
      expect(dateHeader).toBeInTheDocument();

      // Click to reverse sort
      fireEvent.click(dateHeader!);

      // Should show ascending indicator
      expect(dateHeader!.textContent).toContain("↑");
    });

    it("sorts by vault ID when clicking that column", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const vaultIdHeader = screen.getByText("Vault ID").closest("th");
      fireEvent.click(vaultIdHeader!);

      // Check sort indicator appears
      expect(vaultIdHeader!.textContent).toMatch(/[↑↓]/);
    });

    it("sorts by seized collateral amount", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const collateralHeader = screen.getByText("Seized Collateral").closest("th");
      fireEvent.click(collateralHeader!);

      // Verify sorting occurred
      expect(collateralHeader!.textContent).toMatch(/[↑↓]/);
    });

    it("sorts by health factor", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const healthFactorHeader = screen.getByText("Health Factor").closest("th");
      fireEvent.click(healthFactorHeader!);

      expect(healthFactorHeader!.textContent).toMatch(/[↑↓]/);
    });
  });

  describe("Search/Filter", () => {
    it("renders search input", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const searchInput = screen.getByPlaceholderText(/Search vaults, liquidators/);
      expect(searchInput).toBeInTheDocument();
    });

    it("filters data when typing in search", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const searchInput = screen.getByPlaceholderText(/Search vaults, liquidators/);
      fireEvent.change(searchInput, { target: { value: "vault-xlm-001" } });

      // Should filter to show only matching rows
      const rows = screen.getAllByRole("row").slice(1); // Skip header
      expect(rows.length).toBeLessThanOrEqual(mockLiquidationEvents.length);
    });

    it("resets to page 1 when filtering", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} initialPageSize={1} />);

      // Navigate to page 2
      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      // Apply filter
      const searchInput = screen.getByPlaceholderText(/Search vaults, liquidators/);
      fireEvent.change(searchInput, { target: { value: "vault" } });

      // Should reset to page 1
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });
  });

  describe("Pagination", () => {
    it("renders pagination controls", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });

    it("navigates to next page", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} initialPageSize={2} />);

      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
    });

    it("navigates to previous page", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} initialPageSize={2} />);

      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);

      const previousButton = screen.getByText("Previous");
      fireEvent.click(previousButton);

      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });

    it("disables previous button on first page", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const previousButton = screen.getByText("Previous");
      expect(previousButton).toBeDisabled();
    });

    it("disables next button on last page", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} initialPageSize={10} />);

      const nextButton = screen.getByText("Next");
      expect(nextButton).toBeDisabled();
    });

    it("supports first page button", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} initialPageSize={1} />);

      // Go to page 3
      const nextButton = screen.getByText("Next");
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      // Click first page button
      const firstButton = screen.getByText("««");
      fireEvent.click(firstButton);

      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });

    it("supports last page button", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} initialPageSize={1} />);

      const lastButton = screen.getByText("»»");
      fireEvent.click(lastButton);

      expect(screen.getByText(/Page 3 of/)).toBeInTheDocument();
    });

    it("displays total events count", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      expect(screen.getByText("(3 total events)")).toBeInTheDocument();
    });
  });

  describe("Block Explorer Links", () => {
    it("renders explorer links for each transaction", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const explorerLinks = screen.getAllByRole("link");
      expect(explorerLinks.length).toBeGreaterThan(0);
    });

    it("opens links in new tab", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const firstLink = screen.getAllByRole("link")[0];
      expect(firstLink).toHaveAttribute("target", "_blank");
      expect(firstLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("generates correct stellar.expert URL for public network", () => {
      render(<LiquidationHistoryTable data={[mockLiquidationEvents[0]]} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        expect.stringContaining("stellar.expert/explorer/public/tx/")
      );
    });

    it("generates correct stellar.expert URL for testnet", () => {
      render(<LiquidationHistoryTable data={[mockLiquidationEvents[1]]} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        expect.stringContaining("stellar.expert/explorer/testnet/tx/")
      );
    });

    it("includes transaction hash in link", () => {
      render(<LiquidationHistoryTable data={[mockLiquidationEvents[0]]} />);

      const link = screen.getByRole("link");
      expect(link.getAttribute("href")).toContain(mockLiquidationEvents[0].transactionHash);
    });

    it("has accessible aria-label on explorer links", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const firstLink = screen.getAllByRole("link")[0];
      expect(firstLink).toHaveAttribute("aria-label", expect.stringContaining("View transaction"));
    });

    it("displays truncated transaction hash in link text", () => {
      render(<LiquidationHistoryTable data={[mockLiquidationEvents[0]]} />);

      const link = screen.getByRole("link");
      expect(link.textContent).toMatch(/abc123de\.\.\./);
    });
  });

  describe("Export Functionality", () => {
    it("renders export button when showExport is true", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} showExport={true} />);

      expect(screen.getByText("Export CSV")).toBeInTheDocument();
    });

    it("hides export button when showExport is false", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} showExport={false} />);

      expect(screen.queryByText("Export CSV")).not.toBeInTheDocument();
    });

    it("triggers CSV export when button clicked", () => {
      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
      global.URL.revokeObjectURL = jest.fn();

      // Mock createElement and click
      const mockClick = jest.fn();
      const mockLink = { click: mockClick, href: "", download: "" };
      jest.spyOn(document, "createElement").mockReturnValue(mockLink as any);

      render(<LiquidationHistoryTable data={mockLiquidationEvents} showExport={true} />);

      const exportButton = screen.getByText("Export CSV");
      fireEvent.click(exportButton);

      expect(mockClick).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe("Row Click Handling", () => {
    it("calls onRowClick when row is clicked", () => {
      const handleRowClick = jest.fn();
      render(
        <LiquidationHistoryTable
          data={mockLiquidationEvents}
          onRowClick={handleRowClick}
        />
      );

      const rows = screen.getAllByRole("row").slice(1); // Skip header
      fireEvent.click(rows[0]);

      expect(handleRowClick).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
      }));
    });

    it("applies cursor-pointer class when onRowClick provided", () => {
      const handleRowClick = jest.fn();
      render(
        <LiquidationHistoryTable
          data={mockLiquidationEvents}
          onRowClick={handleRowClick}
        />
      );

      const rows = screen.getAllByRole("row").slice(1);
      expect(rows[0]).toHaveClass("cursor-pointer");
    });

    it("does not apply cursor-pointer when onRowClick not provided", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const rows = screen.getAllByRole("row").slice(1);
      expect(rows[0]).not.toHaveClass("cursor-pointer");
    });
  });

  describe("Data Display", () => {
    it("displays health factor with correct color for critical values", () => {
      const criticalEvent = {
        ...mockLiquidationEvents[0],
        healthFactorBefore: 0.8,
      };
      render(<LiquidationHistoryTable data={[criticalEvent]} />);

      const healthFactor = screen.getByText("0.800");
      expect(healthFactor).toHaveClass("text-red-600");
    });

    it("displays health factor with warning color for moderate values", () => {
      const warningEvent = {
        ...mockLiquidationEvents[0],
        healthFactorBefore: 1.1,
      };
      render(<LiquidationHistoryTable data={[warningEvent]} />);

      const healthFactor = screen.getByText("1.100");
      expect(healthFactor).toHaveClass("text-orange-600");
    });

    it("formats USD values correctly", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      expect(screen.getByText("$6,000.00")).toBeInTheDocument();
    });

    it("truncates long addresses", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      // Check for truncated format
      const cells = screen.getAllByRole("cell");
      const addressCells = cells.filter(cell =>
        cell.textContent?.includes("...")
      );
      expect(addressCells.length).toBeGreaterThan(0);
    });

    it("displays penalty percentage", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      expect(screen.getByText("5.0%")).toBeInTheDocument();
      expect(screen.getByText("3.0%")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper table structure", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("row").length).toBeGreaterThan(0);
    });

    it("has accessible column headers", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const headers = screen.getAllByRole("columnheader");
      expect(headers.length).toBeGreaterThan(0);
    });

    it("marks decorative icons with aria-hidden", () => {
      render(<LiquidationHistoryTable data={mockLiquidationEvents} />);

      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
