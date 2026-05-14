"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmployees, getAttendanceRecords } from "@/lib/store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function DashboardCharts() {
  const [departmentData, setDepartmentData] = useState<
    { name: string; count: number }[]
  >([]);
  const [attendanceData, setAttendanceData] = useState<
    { name: string; value: number }[]
  >([]);

  useEffect(() => {
    // 1. Create an async function inside useEffect
    const loadChartData = async () => {
      try {
        // 2. Add 'await' to fetch data from Supabase
        const employees = await getEmployees();
        const attendance = await getAttendanceRecords();

        // Department distribution
        const deptCounts: Record<string, number> = {};
        // Ensure employees is an array before calling forEach
        if (Array.isArray(employees)) {
          employees.forEach((emp) => {
            deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
          });
        }
        
        setDepartmentData(
          Object.entries(deptCounts).map(([name, count]) => ({ name, count }))
        );

        // Attendance status distribution
        const today = new Date().toISOString().split("T")[0];
        const todayAttendance = Array.isArray(attendance) 
          ? attendance.filter((a) => a.date === today) 
          : [];
          
        const totalEmployees = Array.isArray(employees) ? employees.length : 0;
        
        const statusCounts = {
          Present: todayAttendance.filter((a) => a.status === "present").length,
          Late: todayAttendance.filter((a) => a.status === "late").length,
          Absent: totalEmployees - todayAttendance.length,
        };
        
        setAttendanceData(
          Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
        );
      } catch (error) {
        console.error("Error loading chart data:", error);
      }
    };

    // 3. Call the async function
    loadChartData();
  }, []);

  const COLORS = [
    "oklch(0.6 0.18 250)",
    "oklch(0.65 0.15 170)",
    "oklch(0.55 0.22 25)",
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Employees by Department
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "oklch(0.65 0 0)", fontSize: 12 }}
                  axisLine={{ stroke: "oklch(0.25 0.01 250)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "oklch(0.65 0 0)", fontSize: 12 }}
                  axisLine={{ stroke: "oklch(0.25 0.01 250)" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.16 0.01 250)",
                    border: "1px solid oklch(0.25 0.01 250)",
                    borderRadius: "8px",
                    color: "oklch(0.95 0 0)",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="oklch(0.6 0.18 250)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Today&apos;s Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {attendanceData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.16 0.01 250)",
                    border: "1px solid oklch(0.25 0.01 250)",
                    borderRadius: "8px",
                    color: "oklch(0.95 0 0)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {attendanceData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-sm text-muted-foreground">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}