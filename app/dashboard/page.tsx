"use client";

import { useAuth } from "@/lib/auth-context";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "employee") {
    return <EmployeeDashboard />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your organization.
        </p>
      </div>

      <StatsCards />
      <DashboardCharts />
    </div>
  );
}
