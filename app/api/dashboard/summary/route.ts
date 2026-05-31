// app/api/dashboard/summary/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const now       = new Date();
  const thisYear  = now.getFullYear();
  const thisMonth = now.getMonth() + 1;

  try {
    // ── Bu ay gelir (income: year+month bazlı, total alanı) ──
    const [monthIncomeRaw, monthExpenseRaw] = await Promise.all([
      prisma.income.aggregate({
        _sum: { total: true },
        where: { year: thisYear, month: thisMonth },
      }),
      prisma.expenses.aggregate({
        _sum: { amount: true },
        where: {
          date: {
            gte: new Date(thisYear, thisMonth - 1, 1),
            lt:  new Date(thisYear, thisMonth, 1),
          },
        },
      }),
    ]);

    const startYear = thisYear - 4;

    const [yearIncomeRaw, yearExpenseRaw, allIncomeRaw, allExpenseRaw] = await Promise.all([
      // Bu yılın income kayıtları (year+month+total)
      prisma.income.findMany({
        where: { year: thisYear },
        select: { month: true, total: true },
      }),
      // Bu yılın expenses kayıtları (date+amount)
      prisma.expenses.findMany({
        where: {
          date: {
            gte: new Date(thisYear, 0, 1),
            lt:  new Date(thisYear + 1, 0, 1),
          },
        },
        select: { date: true, amount: true },
      }),
      // Son 5 yıl income
      prisma.income.findMany({
        where: { year: { gte: startYear } },
        select: { year: true, month: true, total: true },
      }),
      // Son 5 yıl expenses
      prisma.expenses.findMany({
        where: { date: { gte: new Date(startYear, 0, 1) } },
        select: { date: true, amount: true },
      }),
    ]);

    // ── Bu yıl aylık dizi ────────────────────────────────────
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      // income: month alanıyla eşleştir, total topla
      const income = yearIncomeRaw
        .filter(r => r.month === m)
        .reduce((s, r) => s + Number(r.total), 0);
      // expenses: date'ten ay çıkar
      const expense = yearExpenseRaw
        .filter(r => new Date(r.date).getMonth() + 1 === m)
        .reduce((s, r) => s + Number(r.amount), 0);
      return { month: m, income, expense, net: income - expense };
    });

    const yearIncome  = monthlyData.reduce((s, r) => s + r.income,  0);
    const yearExpense = monthlyData.reduce((s, r) => s + r.expense, 0);

    // ── Son 5 yıl yıllık kırılım ─────────────────────────────
    const yearlyData = Array.from({ length: thisYear - startYear + 1 }, (_, i) => {
      const y = startYear + i;
      const income = allIncomeRaw
        .filter(r => r.year === y)
        .reduce((s, r) => s + Number(r.total), 0);
      const expense = allExpenseRaw
        .filter(r => new Date(r.date).getFullYear() === y)
        .reduce((s, r) => s + Number(r.amount), 0);
      return { year: y, income, expense, net: income - expense };
    });

    // ── Kümülatif bakiye ─────────────────────────────────────
    let cumulative = 0;
    const balanceData = yearlyData.map(y => {
      cumulative += y.net;
      return { year: y.year, balance: cumulative };
    });

    // ── Aidat özeti (bu ay) ──────────────────────────────────
    const duesSummary = await prisma.dues.groupBy({
      by: ["status"],
      where: { month: thisMonth, year: thisYear },
      _count: { status: true },
      _sum:   { aidat: true },
    });

    return NextResponse.json({
      thisMonth: {
        income:  Number(monthIncomeRaw._sum.total   ?? 0),
        expense: Number(monthExpenseRaw._sum.amount ?? 0),
        net:     Number(monthIncomeRaw._sum.total   ?? 0) - Number(monthExpenseRaw._sum.amount ?? 0),
      },
      thisYear: {
        income:  yearIncome,
        expense: yearExpense,
        net:     yearIncome - yearExpense,
      },
      monthlyData,
      yearlyData,
      balanceData,
      duesSummary,
      currentYear:  thisYear,
      currentMonth: thisMonth,
    });
  } catch (err) {
    console.error("dashboard summary:", err);
    return NextResponse.json({ error: "Veriler alınamadı." }, { status: 500 });
  }
}