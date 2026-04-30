"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition
} from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  FileSpreadsheet,
  Landmark,
  Loader2,
  Newspaper,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  WalletCards
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { MessageResponse } from "@/components/ai-elements/message";
import { AuthControls } from "@/components/auth-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { sampleHoldings } from "@/lib/sample-holdings";
import {
  loadLocalChat,
  loadLocalHoldings,
  saveLocalChat,
  saveLocalHoldings,
  type LocalChatMessage
} from "@/lib/storage/local-store";
import {
  parsePortfolioWorkbook,
  rowsToHoldings,
  type ColumnMapping,
  type ImportField,
  type ParsedWorkbook
} from "@/lib/portfolio/excel";
import type {
  EnrichedHolding,
  HoldingInput,
  NewsItem,
  PlannerSuggestion,
  PortfolioSnapshot
} from "@/lib/types";
import { formatInr, formatPercent } from "@/lib/utils";

type TabId =
  | "dashboard"
  | "import"
  | "holdings"
  | "advisor"
  | "planner"
  | "news"
  | "settings";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Portfolio", icon: Landmark },
  { id: "import", label: "Import", icon: FileSpreadsheet },
  { id: "holdings", label: "Holdings", icon: WalletCards },
  { id: "advisor", label: "Advisor", icon: Bot },
  { id: "planner", label: "Planner", icon: CalendarClock },
  { id: "news", label: "News", icon: Newspaper },
  { id: "settings", label: "Settings", icon: Settings }
];

const importFields: { key: ImportField; label: string; required?: boolean }[] = [
  { key: "symbol", label: "Symbol", required: true },
  { key: "exchange", label: "Exchange" },
  { key: "quantity", label: "Quantity", required: true },
  { key: "averagePrice", label: "Average price", required: true },
  { key: "buyDate", label: "Buy date" },
  { key: "sector", label: "Sector" },
  { key: "notes", label: "Notes" }
];

const chartColors = ["#0066cc", "#1d1d1f", "#7a7a7a", "#2997ff", "#333333", "#d2d2d7"];

function subscribeClientMount() {
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function emptySnapshot(holdings: HoldingInput[] = []): PortfolioSnapshot {
  const enriched: EnrichedHolding[] = holdings.map((holding) => {
    const marketValue = holding.quantity * holding.averagePrice;
    return {
      ...holding,
      costBasis: marketValue,
      marketValue,
      gainLoss: 0,
      gainLossPercent: 0,
      allocation: holdings.length ? 100 / holdings.length : 0,
      longTermSignal: "watch",
      riskNotes: ["Awaiting market refresh"]
    };
  });
  return {
    holdings: enriched,
    summary: {
      totalValue: enriched.reduce((sum, holding) => sum + holding.marketValue, 0),
      totalCost: enriched.reduce((sum, holding) => sum + holding.costBasis, 0),
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      holdingsCount: holdings.length,
      concentrationScore: holdings.length ? 70 : 0,
      qualityScore: holdings.length ? 68 : 0,
      topHolding: enriched[0]?.symbol
    },
    refreshedAt: "",
    dataWarnings: holdings.length ? ["Market data not refreshed yet"] : []
  };
}

function signalTone(signal: EnrichedHolding["longTermSignal"]) {
  if (signal === "trim") return "amber";
  if (signal === "accumulate") return "blue";
  if (signal === "hold") return "green";
  return "neutral";
}

function DataFreshness({ snapshot }: { snapshot: PortfolioSnapshot }) {
  const warning = snapshot.dataWarnings[0];
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-[#7a7a7a]">
      <span>
        {snapshot.refreshedAt
          ? `Refreshed ${new Date(snapshot.refreshedAt).toLocaleString("en-IN")}`
          : "Not refreshed yet"}
      </span>
      {warning ? <Badge tone="amber">{warning}</Badge> : <Badge tone="green">Clean feed</Badge>}
    </div>
  );
}

function GlobalNav({
  activeTab,
  setActiveTab
}: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}) {
  return (
    <header className="sticky top-0 z-50 bg-black text-white">
      <nav className="mx-auto flex h-11 max-w-[1440px] items-center justify-between px-4 md:px-8">
        <button
          className="flex min-h-11 items-center gap-2 text-xs"
          onClick={() => setActiveTab("dashboard")}
        >
          <CircleDollarSign className="size-4" />
          Stock Specifier
        </button>
        <div className="hidden items-center gap-5 md:flex">
          {tabs.slice(0, 6).map((tab) => (
            <button
              key={tab.id}
              className={`min-h-11 text-xs ${
                activeTab === tab.id ? "text-white" : "text-[#cccccc]"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <AuthControls />
      </nav>
    </header>
  );
}

function SubNav({
  activeTab,
  setActiveTab,
  onRefresh,
  refreshing
}: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const ActiveIcon = active.icon;
  return (
    <div className="frosted sticky top-11 z-40 border-b border-[rgba(0,0,0,0.08)]">
      <div className="mx-auto flex min-h-[52px] max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-2 text-[21px] font-semibold">
          <ActiveIcon className="size-5 text-[var(--action-blue)]" />
          {active.label}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto apple-scrollbar">
          <div className="hidden gap-1 md:flex">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "primary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <Select
            className="md:hidden"
            value={activeTab}
            onChange={(event) => setActiveTab(event.target.value as TabId)}
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </Select>
          <Button variant="primary" size="sm" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

function HeroSummary({
  snapshot,
  holdings,
  loading,
  onImport,
  onSample
}: {
  snapshot: PortfolioSnapshot;
  holdings: HoldingInput[];
  loading: boolean;
  onImport: () => void;
  onSample: () => void;
}) {
  const positive = snapshot.summary.totalGainLoss >= 0;
  return (
    <section className="bg-white px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_520px] lg:items-center">
        <div className="mx-auto max-w-[760px] text-center lg:mx-0 lg:text-left">
          <p className="text-[21px] font-semibold text-[var(--action-blue)]">
            NSE/BSE long-term portfolio
          </p>
          <h1 className="metric-figure mt-3 text-[40px] md:text-[56px]">
            Quiet signals for patient capital.
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[24px] font-light leading-normal text-[#333333] lg:mx-0">
            {holdings.length
              ? `${holdings.length} holdings tracked with best-effort Indian market data.`
              : "Import holdings or load the sample portfolio."}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button onClick={onImport}>
              <Upload />
              Import Excel
            </Button>
            <Button variant="secondary" onClick={onSample}>
              <Sparkles />
              Sample
            </Button>
          </div>
        </div>

        <div className="product-shadow rounded-[18px] bg-[var(--parchment)] p-6">
          <div className="rounded-[18px] bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#7a7a7a]">Portfolio value</p>
                {loading ? (
                  <Skeleton className="mt-3 h-12 w-56" />
                ) : (
                  <p className="metric-figure mt-2 text-[40px]">
                    {formatInr(snapshot.summary.totalValue)}
                  </p>
                )}
              </div>
              <Badge tone={positive ? "green" : "red"}>
                {positive ? <ArrowUpRight /> : <ArrowDownRight />}
                {formatPercent(snapshot.summary.totalGainLossPercent)}
              </Badge>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <MetricTile label="Gain/Loss" value={formatInr(snapshot.summary.totalGainLoss)} />
              <MetricTile label="Holdings" value={String(snapshot.summary.holdingsCount)} />
              <MetricTile
                label="Quality"
                value={`${snapshot.summary.qualityScore}/100`}
              />
              <MetricTile
                label="Concentration"
                value={`${snapshot.summary.concentrationScore}/100`}
              />
            </div>
            <div className="mt-6">
              <DataFreshness snapshot={snapshot} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--hairline)] bg-white p-4">
      <p className="text-sm text-[#7a7a7a]">{label}</p>
      <p className="mt-1 text-[21px] font-semibold">{value}</p>
    </div>
  );
}

function DashboardSection({ snapshot }: { snapshot: PortfolioSnapshot }) {
  const mounted = useSyncExternalStore(
    subscribeClientMount,
    getClientSnapshot,
    getServerSnapshot
  );

  const allocationData = snapshot.holdings
    .toSorted((a, b) => b.marketValue - a.marketValue)
    .slice(0, 8)
    .map((holding) => ({
      name: holding.symbol,
      value: Number(holding.marketValue.toFixed(2)),
      allocation: Number(holding.allocation.toFixed(2))
    }));

  const history = snapshot.holdings[0]?.quote?.history ?? [];

  return (
    <section className="bg-[var(--parchment)] px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
            <CardDescription>Position weight across the current portfolio.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] min-h-[320px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={78}
                      outerRadius={118}
                      paddingAngle={2}
                    >
                      {allocationData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatInr(Number(value ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-full w-full rounded-[18px]" />
              )}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {allocationData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: chartColors[index % chartColors.length] }}
                    />
                    {item.name}
                  </span>
                  <span>{formatPercent(item.allocation)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Primary chart</CardTitle>
            <CardDescription>
              Latest available history for {snapshot.holdings[0]?.symbol ?? "top holding"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] min-h-[320px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <AreaChart data={history}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Tooltip formatter={(value) => formatInr(Number(value ?? 0))} />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke="#0066cc"
                      fill="rgba(0,102,204,0.12)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-full w-full rounded-[18px]" />
              )}
            </div>
            {!history.length ? (
              <div className="mt-4 grid gap-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-4/5" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ImportSection({
  workbook,
  mapping,
  setMapping,
  rejectedRows,
  onFile,
  onCommit
}: {
  workbook: ParsedWorkbook | null;
  mapping: ColumnMapping;
  setMapping: (mapping: ColumnMapping) => void;
  rejectedRows: { row: number; reason: string }[];
  onFile: (file: File) => void;
  onCommit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="bg-[var(--tile-dark-1)] px-4 py-16 text-white md:px-8 md:py-20">
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 className="metric-figure text-[40px]">Portfolio import</h2>
          <p className="mt-4 text-[24px] font-light leading-normal text-[#cccccc]">
            Broker exports, mapped into a clean holding book.
          </p>
          <div className="mt-7">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onFile(file);
              }}
            />
            <Button onClick={() => inputRef.current?.click()}>
              <Upload />
              Choose sheet
            </Button>
          </div>
        </div>

        {workbook ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[380px_1fr]">
            <Card className="bg-white text-[var(--ink)]">
              <CardHeader>
                <CardTitle>Column map</CardTitle>
                <CardDescription>{workbook.rows.length} rows detected.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {importFields.map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-1 block text-sm text-[#7a7a7a]">
                      {field.label}
                      {field.required ? " *" : ""}
                    </span>
                    <Select
                      value={mapping[field.key] ?? ""}
                      onChange={(event) =>
                        setMapping({ ...mapping, [field.key]: event.target.value || undefined })
                      }
                      className="w-full"
                    >
                      <option value="">Not mapped</option>
                      {workbook.headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </Select>
                  </label>
                ))}
                <Button
                  className="w-full"
                  onClick={onCommit}
                  disabled={!mapping.symbol || !mapping.quantity || !mapping.averagePrice}
                >
                  <CheckCircle2 />
                  Import holdings
                </Button>
                {rejectedRows.length ? (
                  <p className="text-sm text-[#8a5300]">
                    {rejectedRows.length} rows need review.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <div className="overflow-hidden rounded-[18px] bg-white text-[var(--ink)]">
              <div className="overflow-auto apple-scrollbar">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[var(--parchment)]">
                    <tr>
                      {workbook.headers.slice(0, 8).map((header) => (
                        <th key={header} className="px-4 py-3 font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {workbook.rows.slice(0, 8).map((row, index) => (
                      <tr key={index} className="border-t border-[var(--hairline)]">
                        {workbook.headers.slice(0, 8).map((header) => (
                          <td key={header} className="px-4 py-3">
                            {String(row[header] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function HoldingsSection({ snapshot }: { snapshot: PortfolioSnapshot }) {
  const [query, setQuery] = useState("");
  const filtered = snapshot.holdings.filter((holding) =>
    `${holding.symbol} ${holding.exchange} ${holding.sector ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <section className="bg-white px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="metric-figure text-[40px]">Holdings</h2>
            <p className="mt-2 text-[#7a7a7a]">Signals, allocation, and data state.</p>
          </div>
          <div className="relative w-full md:w-[360px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7a7a7a]" />
            <Input
              className="pl-11"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
            />
          </div>
        </div>
        <div className="mt-8 overflow-hidden rounded-[18px] border border-[var(--hairline)]">
          <div className="overflow-auto apple-scrollbar">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-[var(--parchment)]">
                <tr>
                  {[
                    "Stock",
                    "Qty",
                    "Avg",
                    "Price",
                    "Value",
                    "P/L",
                    "Alloc",
                    "Signal"
                  ].map((header) => (
                    <th key={header} className="px-5 py-4 font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {filtered.map((holding) => (
                  <tr key={holding.id} className="border-t border-[var(--hairline)]">
                    <td className="px-5 py-4">
                      <div className="font-semibold">{holding.symbol}</div>
                      <div className="text-xs text-[#7a7a7a]">{holding.exchange}</div>
                    </td>
                    <td className="px-5 py-4">{holding.quantity}</td>
                    <td className="px-5 py-4">{formatInr(holding.averagePrice)}</td>
                    <td className="px-5 py-4">
                      {holding.quote ? formatInr(holding.quote.price) : "-"}
                    </td>
                    <td className="px-5 py-4">{formatInr(holding.marketValue)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          holding.gainLoss >= 0 ? "text-[#006d3c]" : "text-[#b42318]"
                        }
                      >
                        {formatPercent(holding.gainLossPercent)}
                      </span>
                    </td>
                    <td className="px-5 py-4">{formatPercent(holding.allocation)}</td>
                    <td className="px-5 py-4">
                      <Badge tone={signalTone(holding.longTermSignal)}>
                        {holding.longTermSignal}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdvisorSection({
  snapshot,
  messages,
  setMessages
}: {
  snapshot: PortfolioSnapshot;
  messages: LocalChatMessage[];
  setMessages: (messages: LocalChatMessage[]) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);

  async function askAdvisor() {
    const userText = prompt.trim();
    if (!userText || streaming) return;

    const userMessage: LocalChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
      createdAt: new Date().toISOString()
    };
    const assistantMessage: LocalChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString()
    };
    const next = [...messages, userMessage, assistantMessage];
    setMessages(next);
    setPrompt("");
    setStreaming(true);

    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userText, snapshot })
      });
      if (!response.ok || !response.body) {
        throw new Error("Advisor failed");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setMessages(
          next.map((message) =>
            message.id === assistantMessage.id ? { ...message, content } : message
          )
        );
      }
    } catch {
      setMessages(
        next.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content:
                  "Advisor service is unavailable. Refresh market data and try again."
              }
            : message
        )
      );
    } finally {
      setStreaming(false);
    }
  }

  return (
    <section className="bg-[var(--tile-dark-2)] px-4 py-16 text-white md:px-8 md:py-20">
      <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[420px_1fr]">
        <div>
          <h2 className="metric-figure text-[40px]">Advisor</h2>
          <p className="mt-4 text-[24px] font-light leading-normal text-[#cccccc]">
            Balanced, long-term portfolio reasoning with memory.
          </p>
          <div className="mt-6 grid gap-3">
            <Badge tone="dark">
              <ShieldCheck />
              Advice only
            </Badge>
            <Badge tone="dark">
              <Activity />
              Best-effort data
            </Badge>
          </div>
        </div>
        <div className="rounded-[18px] bg-white p-4 text-[var(--ink)]">
          <div className="h-[480px] overflow-auto rounded-[18px] bg-[var(--parchment)] p-4 apple-scrollbar">
            {messages.length ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-[18px] p-4 ${
                      message.role === "user"
                        ? "ml-auto max-w-[78%] bg-[var(--action-blue)] text-white"
                        : "mr-auto max-w-[88%] bg-white"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      message.content ? (
                        <MessageResponse>{message.content}</MessageResponse>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-[#7a7a7a]">
                          <Loader2 className="size-4 animate-spin" />
                          Thinking
                        </div>
                      )
                    ) : (
                      <p className="text-[15px] leading-7">{message.content}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid h-full place-items-center text-center text-[#7a7a7a]">
                <div>
                  <Bot className="mx-auto size-10 text-[var(--action-blue)]" />
                  <p className="mt-3">No advisor notes yet.</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-3">
            <Textarea
              className="min-h-20"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask about holding, trimming, risk, or long-term buys"
            />
            <Button className="self-end" onClick={askAdvisor} disabled={streaming}>
              {streaming ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Ask
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlannerSection({ snapshot }: { snapshot: PortfolioSnapshot }) {
  const [amount, setAmount] = useState(25000);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [suggestions, setSuggestions] = useState<PlannerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  async function plan() {
    setLoading(true);
    try {
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, month, snapshot })
      });
      const data = (await response.json()) as { suggestions: PlannerSuggestion[] };
      setSuggestions(data.suggestions);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative bg-[var(--parchment)] px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 className="metric-figure text-[40px]">Monthly plan</h2>
          <p className="mt-4 text-[24px] font-light leading-normal text-[#333333]">
            INR allocation shaped by concentration and long-term signals.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-[980px] gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label>
            <span className="mb-2 block text-sm text-[#7a7a7a]">Amount</span>
            <Input
              type="number"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>
          <label>
            <span className="mb-2 block text-sm text-[#7a7a7a]">Month</span>
            <Input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </label>
          <Button className="self-end" onClick={plan} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <BarChart3 />}
            Plan
          </Button>
        </div>
        <div className="mx-auto mt-8 grid max-w-[980px] gap-4">
          {suggestions.map((suggestion) => (
            <Card key={`${suggestion.exchange}:${suggestion.symbol}`}>
              <CardContent className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{suggestion.symbol}</CardTitle>
                    <Badge tone={suggestion.action === "add" ? "blue" : "neutral"}>
                      {suggestion.action}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-[#7a7a7a]">{suggestion.rationale}</p>
                </div>
                <p className="metric-figure text-[28px]">{formatInr(suggestion.amount)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="frosted sticky bottom-0 mt-12 border-t border-[rgba(0,0,0,0.08)] px-4 py-3">
        <div className="mx-auto flex max-w-[980px] items-center justify-between gap-4">
          <span className="text-sm text-[#333333]">
            {month} allocation: {formatInr(amount)}
          </span>
          <Button size="sm" onClick={plan} disabled={loading}>
            Update plan
          </Button>
        </div>
      </div>
    </section>
  );
}

function NewsSection({
  snapshot,
  news,
  loading
}: {
  snapshot: PortfolioSnapshot;
  news: NewsItem[];
  loading: boolean;
}) {
  return (
    <section className="bg-[var(--tile-dark-3)] px-4 py-16 text-white md:px-8 md:py-20">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="metric-figure text-[40px]">News and events</h2>
            <p className="mt-2 text-[#cccccc]">
              Coverage for {snapshot.holdings.length} tracked symbols.
            </p>
          </div>
          {loading ? <Loader2 className="size-5 animate-spin" /> : null}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(loading
            ? Array.from({ length: 6 }, (_, index) => ({ skeleton: index }))
            : news
          ).map((item, index) =>
            "title" in item ? (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-[18px] border border-[rgba(255,255,255,0.14)] bg-white p-5 text-[var(--ink)] transition-transform active:scale-[0.99]"
              >
                <p className="text-sm text-[var(--action-blue)]">{item.source}</p>
                <h3 className="mt-3 text-[21px] font-semibold leading-tight">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm text-[#7a7a7a]">
                  {item.publishedAt
                    ? new Date(item.publishedAt).toLocaleString("en-IN")
                    : "Latest"}
                </p>
              </a>
            ) : (
              <div key={index} className="rounded-[18px] bg-white p-5">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-5 h-7 w-full" />
                <Skeleton className="mt-3 h-7 w-4/5" />
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

function SettingsSection({
  snapshot,
  holdings
}: {
  snapshot: PortfolioSnapshot;
  holdings: HoldingInput[];
}) {
  const env = [
    ["Clerk", Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)],
    ["Groq", false],
    ["Neon", false],
    ["Upstash", false],
    ["Blob", false],
    ["Alpha Vantage", false]
  ] as const;

  return (
    <section className="bg-white px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Personal account, advice-only mode.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <MetricTile label="Holdings" value={String(holdings.length)} />
            <MetricTile
              label="Last refresh"
              value={
                snapshot.refreshedAt
                  ? new Date(snapshot.refreshedAt).toLocaleDateString("en-IN")
                  : "Pending"
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Provider state</CardTitle>
            <CardDescription>Client-visible status only.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {env.map(([name, enabled]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-[18px] bg-[var(--parchment)] p-4"
              >
                <span>{name}</span>
                <Badge tone={enabled ? "green" : "neutral"}>
                  {enabled ? "Enabled" : "Server"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function PortfolioApp() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [holdings, setHoldings] = useState<HoldingInput[]>([]);
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot>(() => emptySnapshot());
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [rejectedRows, setRejectedRows] = useState<{ row: number; reason: string }[]>([]);
  const [messages, setMessagesState] = useState<LocalChatMessage[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  const currentHoldings = useMemo(() => holdings, [holdings]);

  function setMessages(messagesNext: LocalChatMessage[]) {
    setMessagesState(messagesNext);
    void saveLocalChat(messagesNext);
  }

  async function persistHoldings(nextHoldings: HoldingInput[]) {
    setHoldings(nextHoldings);
    setSnapshot(emptySnapshot(nextHoldings));
    await saveLocalHoldings(nextHoldings);
    void fetch("/api/portfolio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings: nextHoldings })
    }).catch(() => undefined);
  }

  async function refreshMarket(sourceHoldings = currentHoldings) {
    if (!sourceHoldings.length) {
      setSnapshot(emptySnapshot());
      return;
    }
    const response = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings: sourceHoldings })
    });
    if (!response.ok) {
      throw new Error("Market refresh failed");
    }
    const nextSnapshot = (await response.json()) as PortfolioSnapshot;
    setSnapshot(nextSnapshot);
    void refreshNews(nextSnapshot);
  }

  async function refreshNews(nextSnapshot = snapshot) {
    const symbols = nextSnapshot.holdings.map((holding) => holding.symbol).join(",");
    if (!symbols) return;
    setNewsLoading(true);
    try {
      const response = await fetch(`/api/news?symbols=${encodeURIComponent(symbols)}`);
      const data = (await response.json()) as { news: NewsItem[] };
      setNews(data.news);
    } finally {
      setNewsLoading(false);
    }
  }

  const refreshStoredHoldings = useEffectEvent((storedHoldings: HoldingInput[]) => {
    startRefresh(() => {
      void refreshMarket(storedHoldings);
    });
  });

  useEffect(() => {
    void Promise.all([loadLocalHoldings(), loadLocalChat()]).then(
      ([storedHoldings, storedMessages]) => {
        setMessagesState(storedMessages);
        if (storedHoldings.length) {
          setHoldings(storedHoldings);
          setSnapshot(emptySnapshot(storedHoldings));
          refreshStoredHoldings(storedHoldings);
        }
      }
    );
  }, []);

  async function handleFile(file: File) {
    const parsed = await parsePortfolioWorkbook(file);
    setWorkbook(parsed);
    setMapping(parsed.mapping);
    setRejectedRows([]);
  }

  async function commitImport() {
    if (!workbook) return;
    const result = rowsToHoldings(workbook.rows, mapping);
    setRejectedRows(result.rejected);
    if (result.holdings.length) {
      await persistHoldings(result.holdings);
      setActiveTab("dashboard");
      startRefresh(() => {
        void refreshMarket(result.holdings);
      });
    }
  }

  async function loadSample() {
    await persistHoldings(sampleHoldings);
    startRefresh(() => {
      void refreshMarket(sampleHoldings);
    });
  }

  const activeContent = {
    dashboard: <DashboardSection snapshot={snapshot} />,
    import: (
      <ImportSection
        workbook={workbook}
        mapping={mapping}
        setMapping={setMapping}
        rejectedRows={rejectedRows}
        onFile={handleFile}
        onCommit={commitImport}
      />
    ),
    holdings: <HoldingsSection snapshot={snapshot} />,
    advisor: (
      <AdvisorSection
        snapshot={snapshot}
        messages={messages}
        setMessages={setMessages}
      />
    ),
    planner: <PlannerSection snapshot={snapshot} />,
    news: <NewsSection snapshot={snapshot} news={news} loading={newsLoading} />,
    settings: <SettingsSection snapshot={snapshot} holdings={holdings} />
  } satisfies Record<TabId, React.ReactNode>;

  return (
    <div className="min-h-screen bg-white text-[var(--ink)]">
      <GlobalNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <SubNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        refreshing={refreshing}
        onRefresh={() =>
          startRefresh(() => {
            void refreshMarket();
          })
        }
      />
      <HeroSummary
        snapshot={snapshot}
        holdings={holdings}
        loading={refreshing}
        onImport={() => setActiveTab("import")}
        onSample={loadSample}
      />
      {activeContent[activeTab]}
      <footer className="bg-[var(--parchment)] px-4 py-12 text-xs leading-6 text-[#7a7a7a] md:px-8">
        <div className="mx-auto max-w-[980px]">
          <p>
            Market data is best-effort, may be delayed, and can contain gaps.
            Stock Specifier is advice-only and does not place trades.
          </p>
        </div>
      </footer>
    </div>
  );
}
