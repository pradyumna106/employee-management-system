"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getEmployeeAttendance,
  getTodayAttendance,
  checkIn,
  checkOut,
} from "@/lib/store";
import type { AttendanceRecord } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, LogIn, LogOut, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function MyAttendancePage() {
  const { employee } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | undefined>();
  const [currentTime, setCurrentTime] = useState(new Date());

  // FIXED: Made loadData async and added await
  const loadData = async () => {
    if (employee) {
      try {
        const historyData = await getEmployeeAttendance(employee.id);
        const todayData = await getTodayAttendance(employee.id);
        
        setAttendance(Array.isArray(historyData) ? historyData : []);
        setTodayAttendance(todayData || undefined);
      } catch (error) {
        console.error("Failed to load attendance data:", error);
      }
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [employee]);

  // FIXED: Made check-in async
  const handleCheckIn = async () => {
    if (employee) {
      try {
        await checkIn(employee.id);
        await loadData();
      } catch (error) {
        console.error("Failed to check in:", error);
      }
    }
  };

  // FIXED: Made check-out async
  const handleCheckOut = async () => {
    if (employee) {
      try {
        await checkOut(employee.id);
        await loadData();
      } catch (error) {
        console.error("Failed to check out:", error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      present: {
        label: "Present",
        className: "bg-success/20 text-success",
      },
      late: {
        label: "Late",
        className: "bg-warning/20 text-warning",
      },
      absent: {
        label: "Absent",
        className: "bg-destructive/20 text-destructive",
      },
      "half-day": {
        label: "Half Day",
        className: "bg-chart-3/20 text-chart-3",
      },
    };

    const cfg = config[status];
    return (
      <Badge variant="secondary" className={cfg?.className}>
        {cfg?.label || status}
      </Badge>
    );
  };

  if (!employee) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground">
          Track your attendance and working hours
        </p>
      </div>

      {/* Today's Attendance Card */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today - {format(currentTime, "EEEE, MMMM d, yyyy")}
            </CardTitle>
            <p className="text-2xl font-mono font-bold">
              {format(currentTime, "HH:mm:ss")}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Check In</p>
                <p className="text-2xl font-semibold">
                  {todayAttendance?.checkIn || "--:--"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Check Out</p>
                <p className="text-2xl font-semibold">
                  {todayAttendance?.checkOut || "--:--"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Hours Worked</p>
                <p className="text-2xl font-semibold">
                  {todayAttendance?.hoursWorked
                    ? `${todayAttendance.hoursWorked}h`
                    : "--"}
                </p>
              </div>
              {todayAttendance && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(todayAttendance.status)}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!todayAttendance?.checkIn ? (
                <Button onClick={handleCheckIn} size="lg" className="gap-2">
                  <LogIn className="h-5 w-5" />
                  Check In
                </Button>
              ) : !todayAttendance?.checkOut ? (
                <Button
                  onClick={handleCheckOut}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <LogOut className="h-5 w-5" />
                  Check Out
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Day Completed</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No attendance records yet
                    </TableCell>
                  </TableRow>
                ) : (
                  attendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(parseISO(record.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{record.checkIn || "-"}</TableCell>
                      <TableCell>{record.checkOut || "-"}</TableCell>
                      <TableCell>
                        {record.hoursWorked ? `${record.hoursWorked}h` : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}