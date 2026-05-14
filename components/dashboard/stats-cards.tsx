"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/store";
import { Users, UserCheck, Calendar, DollarSign } from "lucide-react";

export function StatsCards() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    totalPayroll: 0,
  });

  useEffect(() => {
    // 1. Create an async function inside useEffect
    const loadStats = async () => {
      try {
        // 2. Add 'await' when calling getDashboardStats
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      }
    };
    
    // 3. Call the async function
    loadStats();
  }, []);

  const cards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      title: "Present Today",
      value: stats.presentToday,
      icon: UserCheck,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      title: "Pending Leaves",
      value: stats.pendingLeaves,
      icon: Calendar,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      title: "Monthly Payroll",
      value: `$${(stats.totalPayroll / 12).toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })}`,
      icon: DollarSign,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}