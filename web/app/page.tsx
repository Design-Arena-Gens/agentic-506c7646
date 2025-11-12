"use client";

import { useEffect, useMemo, useState } from "react";

type Expense = {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  note?: string;
};

const STORAGE_KEY = "expenses-v1";
const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Health",
  "Entertainment",
  "Shopping",
  "Travel",
  "Other",
];

function formatCurrency(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]!);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("all"); // e.g., 2025-11

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Expense[];
        setExpenses(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch {
      // ignore
    }
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (filterMonth === "all") return expenses;
    return expenses.filter((e) => e.date.slice(0, 7) === filterMonth);
  }, [expenses, filterMonth]);

  const total = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [
    filteredExpenses,
  ]);

  const months = useMemo(() => {
    const set = new Set(expenses.map((e) => e.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  function addExpense() {
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!date) return;
    const newExpense: Expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      category: category.trim() || "Other",
      amount: parseFloat(parsedAmount.toFixed(2)),
      note: note.trim() || undefined,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    setAmount("");
    setNote("");
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of filteredExpenses) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(totals.entries())
      .map(([cat, amt]) => ({ cat, amt }))
      .sort((a, b) => b.amt - a.amt);
  }, [filteredExpenses]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight">Expense Tracker</h1>
          <p className="text-sm text-zinc-600">Minimal dashboard to add, view, and summarize expenses.</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Summary */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="text-xs uppercase text-zinc-500">Total Spent</div>
            <div className="mt-2 text-2xl font-semibold">{formatCurrency(total)}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="text-xs uppercase text-zinc-500">Entries</div>
            <div className="mt-2 text-2xl font-semibold">{filteredExpenses.length}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="text-xs uppercase text-zinc-500">Categories</div>
            <div className="mt-2 text-2xl font-semibold">{categoryTotals.length}</div>
          </div>
        </section>

        {/* Controls */}
        <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs text-zinc-600">Amount</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-zinc-400"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs text-zinc-600">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs text-zinc-600">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-zinc-600">Note</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={addExpense}
                className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Add Expense
              </button>

              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-600">Filter</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="all">All time</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Category totals */}
        {categoryTotals.length > 0 && (
          <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {categoryTotals.map(({ cat, amt }) => (
              <div key={cat} className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="text-xs uppercase text-zinc-500">{cat}</div>
                <div className="mt-2 text-lg font-semibold">{formatCurrency(amt)}</div>
              </div>
            ))}
          </section>
        )}

        {/* Table */}
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses
                  .slice()
                  .sort((a, b) => (a.date < b.date ? 1 : -1))
                  .map((e) => (
                    <tr key={e.id} className="border-t border-zinc-100">
                      <td className="px-4 py-3 text-zinc-800">{e.date}</td>
                      <td className="px-4 py-3 text-zinc-800">{e.category}</td>
                      <td className="px-4 py-3 text-zinc-600">{e.note ?? "?"}</td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900">
                        {formatCurrency(e.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removeExpense(e.id)}
                          className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                      No expenses yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-zinc-500">
          Data is stored locally in your browser.
        </footer>
      </main>
    </div>
  );
}
