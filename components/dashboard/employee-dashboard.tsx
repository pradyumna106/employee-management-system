"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getTodayAttendance,
  checkIn,
  checkOut,
  getEmployeeLeaves,
  getEmployeePayslips,
} from "@/lib/store";
import type { AttendanceRecord, LeaveRequest, Payslip } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Calendar,
  DollarSign,
  LogIn,
  LogOut,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export function EmployeeDashboard() {
  const { employee } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | undefined>();
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [recentPayslips, setRecentPayslips] = useState<Payslip[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // FIXED: Made loadData async and added await for Supabase calls
  const loadData = async () => {
    if (employee) {
      try {
        const attendance = await getTodayAttendance(employee.id);
        setTodayAttendance(attendance || undefined);

        const leaves = await getEmployeeLeaves(employee.id);
        setRecentLeaves(Array.isArray(leaves) ? leaves.slice(-3).reverse() : []);

        const payslips = await getEmployeePayslips(employee.id);
        setRecentPayslips(Array.isArray(payslips) ? payslips.slice(-3).reverse() : []);
      } catch (error) {
        console.error("Failed to load employee dashboard data:", error);
      }
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [employee]);

  // FIXED: Made handleCheckIn async
  const handleCheckIn = async () => {
    if (employee) {
      try {
        await checkIn(employee.id);
        await loadData();
      } catch (error) {
        console.error("Check-in failed:", error);
      }
    }
  };

  // FIXED: Made handleCheckOut async
  const handleCheckOut = async () => {
    if (employee) {
      try {
        await checkOut(employee.id);
        await loadData();
      } catch (error) {
        console.error("Check-out failed:", error);
      }
    }
  };

  if (!employee) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {employee.firstName}!
          </h1>
          <p className="text-muted-foreground">
            {format(currentTime, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-bold">
            {format(currentTime, "HH:mm:ss")}
          </p>
        </div>
      </div>

      {/* Attendance Card */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Today&apos;s Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Check In</p>
                <p className="text-xl font-semibold">
                  {todayAttendance?.checkIn || "--:--"}
                </p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Check Out</p>
                <p className="text-xl font-semibold">
                  {todayAttendance?.checkOut || "--:--"}
                </p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Hours</p>
                <p className="text-xl font-semibold">
                  {todayAttendance?.hoursWorked
                    ? `${todayAttendance.hoursWorked}h`
                    : "--"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {!todayAttendance?.checkIn ? (
                <Button onClick={handleCheckIn} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Check In
                </Button>
              ) : !todayAttendance?.checkOut ? (
                <Button onClick={handleCheckOut} variant="outline" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Check Out
                </Button>
              ) : (
                <Badge className="bg-success/20 text-success hover:bg-success/20">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {recentLeaves.filter((l) => l.status === "approved").length}
                </p>
                <p className="text-sm text-muted-foreground">Leaves Taken</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {recentLeaves.filter((l) => l.status === "pending").length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${(employee.salary / 12).toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-sm text-muted-foreground">Monthly Salary</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Leaves */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeaves.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No leave requests yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium capitalize">{leave.type} Leave</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(leave.startDate), "MMM d")} -{" "}
                        {format(parseISO(leave.endDate), "MMM d")}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        leave.status === "approved"
                          ? "bg-success/20 text-success"
                          : leave.status === "rejected"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-warning/20 text-warning"
                      }
                    >
                      {leave.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payslips */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Recent Payslips</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayslips.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No payslips available yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentPayslips.map((payslip) => (
                  <div
                    key={payslip.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">
                        {payslip.month} {payslip.year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Generated {format(parseISO(payslip.generatedOn), "MMM d")}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ${payslip.netSalary.toLocaleString("en-US")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}