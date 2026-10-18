"use client";

import { useState, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from "@tanstack/react-table";
import { ExternalLink, Download, TrendingDown } from "lucide-react";

export interface LiquidationEvent {
  /** Unique liquidation event ID */
  id: string;
  /** Timestamp when liquidation occurred */
  timestamp: string;
  /** Vault identifier being liquidated */
  vaultId: string;
  /** Address of the vault owner */
  vaultOwner: string;
  /** Liquidator address who executed the liquidation */
  liquidatorAddress: string;
  /** Collateral asset type */
  collateralAsset: string;
  /** Amount of collateral seized */
  seizedCollateralAmount: number;
  /** USD value of seized collateral at liquidation */
  seizedCollateralUsd: number;
  /** Debt asset type */
  debtAsset: string;
  /** Amount of debt cleared */
  clearedDebtAmount: number;
  /** USD value of cleared debt */
  clearedDebtUsd: number;
  /** Health factor before liquidation */
  healthFactorBefore: number;
  /** Transaction hash on blockchain */
  transactionHash: string;
  /** Liquidation penalty percentage applied */
  penaltyPercent: number;
  /** Network (testnet or public) */
  network?: "testnet" | "public";
}

export interface LiquidationHistoryTableProps {
  /** Array of liquidation events to display */
  data: LiquidationEvent[];
  /** Optional title for the table */
  title?: string;
  /** Show export button */
  showExport?: boolean;
  /** Initial page size */
  initialPageSize?: number;
  /** Callback when a row is clicked */
  onRowClick?: (event: LiquidationEvent) => void;
}

type LiquidationHistoryTableState = {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  pagination: PaginationState;
};

type StateUpdater<T> = T | ((previous: T) => T);

function resolveStateUpdate<T>(updater: StateUpdater<T>, previous: T): T {
  return typeof updater === "function"
    ? (updater as (previous: T) => T)(previous)
    : updater;
}

/**
 * Format date for display
 */
function formatDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return timestamp;
  }
}

/**
 * Format USD value
 */
function formatUsd(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format token amount with asset
 */
function formatAmount(amount: number, asset: string): string {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })} ${asset}`;
}

/**
 * Truncate address for display
 */
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
}

/**
 * Get Stellar Explorer URL
 */
function getExplorerUrl(txHash: string, network: "testnet" | "public" = "public"): string {
  const networkPath = network === "public" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${networkPath}/tx/${txHash}`;
}

// Column definitions
const columnHelper = createColumnHelper<LiquidationEvent>();

const columns = [
  columnHelper.accessor("timestamp", {
    header: "Date",
    cell: (info) => (
      <span className="whitespace-nowrap text-sm">{formatDate(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor("vaultId", {
    header: "Vault ID",
    cell: (info) => (
      <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
        {truncateAddress(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor("seizedCollateralAmount", {
    header: "Seized Collateral",
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="space-y-0.5">
          <div className="font-semibold text-sm">
            {formatAmount(info.getValue(), row.collateralAsset)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatUsd(row.seizedCollateralUsd)}
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("clearedDebtAmount", {
    header: "Cleared Debt",
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="space-y-0.5">
          <div className="font-semibold text-sm">
            {formatAmount(info.getValue(), row.debtAsset)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatUsd(row.clearedDebtUsd)}
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("liquidatorAddress", {
    header: "Liquidator",
    cell: (info) => (
      <span className="font-mono text-xs">{truncateAddress(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor("healthFactorBefore", {
    header: "Health Factor",
    cell: (info) => {
      const value = info.getValue();
      const colorClass =
        value < 1
          ? "text-red-600 dark:text-red-400"
          : value < 1.2
          ? "text-orange-600 dark:text-orange-400"
          : "text-gray-600 dark:text-gray-400";
      return (
        <span className={`font-semibold text-sm ${colorClass}`}>
          {value.toFixed(3)}
        </span>
      );
    },
  }),
  columnHelper.accessor("penaltyPercent", {
    header: "Penalty",
    cell: (info) => (
      <span className="text-sm">{info.getValue().toFixed(1)}%</span>
    ),
  }),
  columnHelper.accessor("transactionHash", {
    header: "Transaction",
    cell: (info) => {
      const row = info.row.original;
      const explorerUrl = getExplorerUrl(info.getValue(), row.network);
      return (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
          aria-label={`View transaction ${info.getValue()} on Stellar Expert`}
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs">{truncateAddress(info.getValue())}</span>
        </a>
      );
    },
  }),
];

/**
 * LiquidationHistoryTable
 *
 * Comprehensive table view for displaying historical protocol vault liquidations
 * with seized collateral amounts, cleared debt statistics, and block explorer links.
 *
 * Features:
 * - Column sorting on all fields
 * - Global search/filter
 * - Smooth pagination
 * - Direct block explorer links for each transaction
 * - Export to CSV functionality
 * - Responsive design
 * - Accessible with ARIA labels and keyboard navigation
 *
 * @example
 * ```tsx
 * <LiquidationHistoryTable
 *   data={liquidationEvents}
 *   title="Protocol Liquidation History"
 *   showExport={true}
 *   initialPageSize={20}
 *   onRowClick={(event) => console.log('Liquidation:', event)}
 * />
 * ```
 */
export function LiquidationHistoryTable({
  data,
  title = "Liquidation History",
  showExport = true,
  initialPageSize = 10,
  onRowClick,
}: LiquidationHistoryTableProps) {
  const [tableState, setTableState] = useState<LiquidationHistoryTableState>({
    sorting: [{ id: "timestamp", desc: true }], // Default sort by newest first
    columnFilters: [],
    globalFilter: "",
    pagination: {
      pageIndex: 0,
      pageSize: initialPageSize,
    },
  });

  const updateTableState = useCallback(
    <K extends keyof LiquidationHistoryTableState>(
      key: K,
      updater: StateUpdater<LiquidationHistoryTableState[K]>
    ) => {
      setTableState((previous) => {
        const nextValue = resolveStateUpdate(updater, previous[key]);

        if (Object.is(nextValue, previous[key])) {
          return previous;
        }

        return {
          ...previous,
          [key]: nextValue,
        };
      });
    },
    []
  );

  const handleSortingChange = useCallback(
    (updater: StateUpdater<SortingState>) => updateTableState("sorting", updater),
    [updateTableState]
  );

  const handlePaginationChange = useCallback(
    (updater: StateUpdater<PaginationState>) => updateTableState("pagination", updater),
    [updateTableState]
  );

  const handleColumnFiltersChange = useCallback(
    (updater: StateUpdater<ColumnFiltersState>) => {
      setTableState((previous) => {
        const nextColumnFilters = resolveStateUpdate(updater, previous.columnFilters);
        const nextPagination =
          previous.pagination.pageIndex === 0
            ? previous.pagination
            : { ...previous.pagination, pageIndex: 0 };

        if (
          Object.is(nextColumnFilters, previous.columnFilters) &&
          Object.is(nextPagination, previous.pagination)
        ) {
          return previous;
        }

        return {
          ...previous,
          columnFilters: nextColumnFilters,
          pagination: nextPagination,
        };
      });
    },
    []
  );

  const handleGlobalFilterInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextGlobalFilter = event.target.value;

      setTableState((previous) => {
        const nextPagination =
          previous.pagination.pageIndex === 0
            ? previous.pagination
            : { ...previous.pagination, pageIndex: 0 };

        if (
          previous.globalFilter === nextGlobalFilter &&
          Object.is(nextPagination, previous.pagination)
        ) {
          return previous;
        }

        return {
          ...previous,
          globalFilter: nextGlobalFilter,
          pagination: nextPagination,
        };
      });
    },
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: tableState,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onPaginationChange: handlePaginationChange,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
  });

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalSeized = data.reduce((sum, event) => sum + event.seizedCollateralUsd, 0);
    const totalDebt = data.reduce((sum, event) => sum + event.clearedDebtUsd, 0);
    const avgHealthFactor =
      data.reduce((sum, event) => sum + event.healthFactorBefore, 0) / (data.length || 1);

    return {
      totalSeized,
      totalDebt,
      avgHealthFactor,
      count: data.length,
    };
  }, [data]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = [
      "Date",
      "Vault ID",
      "Vault Owner",
      "Seized Collateral",
      "Seized Value (USD)",
      "Cleared Debt",
      "Cleared Debt (USD)",
      "Liquidator",
      "Health Factor",
      "Penalty %",
      "Transaction Hash",
    ].join(",");

    const rows = data
      .map((event) =>
        [
          event.timestamp,
          event.vaultId,
          event.vaultOwner,
          `${event.seizedCollateralAmount} ${event.collateralAsset}`,
          event.seizedCollateralUsd,
          `${event.clearedDebtAmount} ${event.debtAsset}`,
          event.clearedDebtUsd,
          event.liquidatorAddress,
          event.healthFactorBefore,
          event.penaltyPercent,
          event.transactionHash,
        ].join(",")
      )
      .join("\n");

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `liquidation-history-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1B2A3B] bg-[#0D1520] p-8 text-center">
        <TrendingDown className="mx-auto mb-4 h-12 w-12 text-gray-500" aria-hidden="true" />
        <h3 className="mb-2 text-lg font-semibold text-white">No Liquidations Found</h3>
        <p className="text-sm text-gray-400">
          There are no historical liquidation events to display.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary Stats */}
      <div className="rounded-2xl border border-[#1B2A3B] bg-[#0D1520] p-6">
        <h2 className="mb-4 text-2xl font-bold text-white">{title}</h2>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-[#0A121E] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Total Events
            </div>
            <div className="mt-1 text-2xl font-bold text-white">{stats.count}</div>
          </div>
          <div className="rounded-lg bg-[#0A121E] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Total Seized
            </div>
            <div className="mt-1 text-2xl font-bold text-white">{formatUsd(stats.totalSeized)}</div>
          </div>
          <div className="rounded-lg bg-[#0A121E] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Total Debt Cleared
            </div>
            <div className="mt-1 text-2xl font-bold text-white">{formatUsd(stats.totalDebt)}</div>
          </div>
          <div className="rounded-lg bg-[#0A121E] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Avg Health Factor
            </div>
            <div className="mt-1 text-2xl font-bold text-red-400">
              {stats.avgHealthFactor.toFixed(3)}
            </div>
          </div>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search vaults, liquidators, transactions..."
          value={tableState.globalFilter}
          onChange={handleGlobalFilterInputChange}
          className="w-full rounded-lg border border-[#1B2A3B] bg-[#0A121E] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none sm:w-96"
        />
        {showExport && (
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0D1520]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#1B2A3B] bg-[#0D1520]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#1B2A3B] bg-[#0A121E]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="cursor-pointer px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 transition-colors hover:bg-[#0D1520] hover:text-gray-300"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className="text-gray-500">
                          {{
                            asc: "↑",
                            desc: "↓",
                          }[header.column.getIsSorted() as string] ?? "⇅"}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[#1B2A3B]">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={`transition-colors hover:bg-[#0A121E] ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 text-white">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between rounded-lg border border-[#1B2A3B] bg-[#0D1520] px-6 py-4 text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <span>
            Page <strong className="font-semibold text-white">{table.getState().pagination.pageIndex + 1}</strong> of{" "}
            <strong className="font-semibold text-white">{table.getPageCount()}</strong>
          </span>
          <span className="hidden sm:inline">
            ({data.length} total events)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="rounded border border-[#1B2A3B] px-3 py-1.5 transition-colors hover:bg-[#0A121E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            ««
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded border border-[#1B2A3B] px-3 py-1.5 transition-colors hover:bg-[#0A121E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded border border-[#1B2A3B] px-3 py-1.5 transition-colors hover:bg-[#0A121E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="rounded border border-[#1B2A3B] px-3 py-1.5 transition-colors hover:bg-[#0A121E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            »»
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiquidationHistoryTable;
