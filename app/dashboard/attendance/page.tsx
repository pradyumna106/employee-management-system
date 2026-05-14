"use client";

import { useEffect, useState } from "react";
import type { AttendanceRecord, Employee } from "@/lib/types";
import { getAttendanceRecords, getEmployees } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Clock, UserCheck, UserX, AlertCircle } from "lucide-react";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  useEffect(() => {
    // FIX: Make this an async function
    const loadData = async () => {
      try {
        const attData = await getAttendanceRecords();
        const empData = await getEmployees();
        setAttendance(Array.isArray(attData) ? attData : []);
        setEmployees(Array.isArray(empData) ? empData : []);
      } catch (error) {
        console.error("Failed to load attendance data", error);
      }
    };
    
    loadData();
  }, []);

  // Ensure employees is an array before mapping
  const departments = [...new Set((employees || []).map((e) => e.department))];

  const filteredEmployees =
    departmentFilter === "all"
      ? employees
      : employees.filter((e) => e.department === departmentFilter);

  const getEmployeeAttendance = (employeeId: string) => {
    return attendance.find(
      (a) => a.employeeId === employeeId && a.date === selectedDate
    );
  };

  const getStatusBadge = (record: AttendanceRecord | undefined) => {
    if (!record) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          No Record
        </Badge>
      );
    }

    const statusConfig = {
      present: {
        label: "Present",
        className: "bg-success/20 text-success hover:bg-success/20",
      },
      late: {
        label: "Late",
        className: "bg-warning/20 text-warning hover:bg-warning/20",
      },
      absent: {
        label: "Absent",
        className: "bg-destructive/20 text-destructive hover:bg-destructive/20",
      },
      "half-day": {
        label: "Half Day",
        className: "bg-chart-3/20 text-chart-3 hover:bg-chart-3/20",
      },
    };

    const config = statusConfig[record.status];
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const todayStats = {
    present: attendance.filter(
      (a) => a.date === selectedDate && a.status === "present"
    ).length,
    late: attendance.filter(
      (a) => a.date === selectedDate && a.status === "late"
    ).length,
    absent:
      employees.length -
      attendance.filter(
        (a) =>
          a.date === selectedDate &&
          (a.status === "present" || a.status === "late")
      ).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance Overview</h1>
        <p className="text-muted-foreground">
          Track and monitor employee attendance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayStats.present}</p>
                <p className="text-sm text-muted-foreground">Present</p>
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
                <p className="text-2xl font-bold">{todayStats.late}</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayStats.absent}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>

            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const record = getEmployeeAttendance(employee.id);
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                            {employee.firstName[0]}
                            {employee.lastName[0]}
                          </div>
                          <span className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{record?.checkIn || "-"}</TableCell>
                      <TableCell>{record?.checkOut || "-"}</TableCell>
                      <TableCell>
                        {record?.hoursWorked
                          ? `${record.hoursWorked}h`
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(record)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
