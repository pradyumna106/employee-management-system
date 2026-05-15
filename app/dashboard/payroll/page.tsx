"use client";

import { useEffect, useState, useRef } from "react";
import type { Payslip, Employee } from "@/lib/types";
import {
  getPayslips,
  getEmployees,
  generatePayslip,
  finalizePayslip,
} from "@/lib/store";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import {
  DollarSign,
  FileText,
  Download,
  Plus,
  CheckCircle,
  Printer,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PayrollPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    MONTHS[new Date().getMonth()]
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const printRef = useRef<HTMLDivElement>(null);

  // FIXED: Made loadData async and added await for Supabase calls
  const loadData = async () => {
    try {
      const payslipsData = await getPayslips();
      const employeesData = await getEmployees();
      
      // Ensure we always set an array to state to prevent .filter() errors
      setPayslips(Array.isArray(payslipsData) ? payslipsData : []);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (error) {
      console.error("Failed to load payroll data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getEmployee = (employeeId: string) =>
    employees.find((e) => e.id === employeeId);

  // FIXED: Made handleGenerate async
  const handleGenerate = async () => {
    if (selectedEmployee && selectedMonth) {
      try {
        await generatePayslip(selectedEmployee, selectedMonth, selectedYear);
        await loadData();
        setGenerateOpen(false);
        setSelectedEmployee("");
      } catch (error) {
        console.error("Failed to generate payslip:", error);
      }
    }
  };

  // FIXED: Made handleFinalize async
  const handleFinalize = async (id: string) => {
    try {
      await finalizePayslip(id);
      await loadData();
      if (viewPayslip?.id === id) {
        setViewPayslip({ ...viewPayslip, status: "finalized" });
      }
    } catch (error) {
      console.error("Failed to finalize payslip:", error);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${getEmployee(viewPayslip?.employeeId || "")?.firstName} ${getEmployee(viewPayslip?.employeeId || "")?.lastName}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company { font-size: 24px; font-weight: bold; }
            .payslip-title { font-size: 18px; color: #666; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-section { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .info-label { font-size: 12px; color: #666; }
            .info-value { font-weight: 500; }
            .breakdown { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .breakdown th, .breakdown td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .breakdown th { background: #f5f5f5; }
            .total-row { font-weight: bold; background: #f0f9ff; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const totalPayroll = payslips
    .filter((p) => p.status === "finalized")
    .reduce((sum, p) => sum + p.netSalary, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">
            Generate and manage employee payslips
          </p>
        </div>
        <Button onClick={() => setGenerateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Payslip
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{payslips.length}</p>
                <p className="text-sm text-muted-foreground">Total Payslips</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {payslips.filter((p) => p.status === "finalized").length}
                </p>
                <p className="text-sm text-muted-foreground">Finalized</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <DollarSign className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${totalPayroll.toLocaleString("en-US")}
                </p>
                <p className="text-sm text-muted-foreground">Total Disbursed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslips Table */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Recent Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Basic</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No payslips generated yet
                    </TableCell>
                  </TableRow>
                ) : (
                  payslips.map((payslip) => {
                    const employee = getEmployee(payslip.employeeId);
                    return (
                      <TableRow key={payslip.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                              {employee?.firstName[0]}
                              {employee?.lastName[0]}
                            </div>
                            <span className="font-medium">
                              {employee?.firstName} {employee?.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {payslip.month} {payslip.year}
                        </TableCell>
                        <TableCell>
                          ${payslip.basicSalary.toLocaleString("en-US")}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${payslip.netSalary.toLocaleString("en-US")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payslip.status === "finalized"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              payslip.status === "finalized"
                                ? "bg-success/20 text-success hover:bg-success/20"
                                : "bg-warning/20 text-warning hover:bg-warning/20"
                            }
                          >
                            {payslip.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewPayslip(payslip)}
                            >
                              View
                            </Button>
                            {payslip.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFinalize(payslip.id)}
                              >
                                Finalize
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Generate Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payslip</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>Employee</FieldLabel>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.status === "active")
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Month</FieldLabel>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Year</FieldLabel>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={!selectedEmployee}>
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Payslip Dialog */}
      <Dialog open={!!viewPayslip} onOpenChange={() => setViewPayslip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip Details</DialogTitle>
          </DialogHeader>

          {viewPayslip && (
            <>
              <div ref={printRef}>
                <div className="header">
                  <div className="company">WorkFlow EMS</div>
                  <div className="payslip-title">
                    Payslip for {viewPayslip.month} {viewPayslip.year}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Employee</p>
                      <p className="font-medium">
                        {getEmployee(viewPayslip.employeeId)?.firstName}{" "}
                        {getEmployee(viewPayslip.employeeId)?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Department
                      </p>
                      <p className="font-medium">
                        {getEmployee(viewPayslip.employeeId)?.department}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Position</p>
                      <p className="font-medium">
                        {getEmployee(viewPayslip.employeeId)?.position}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Generated On
                      </p>
                      <p className="font-medium">
                        {format(parseISO(viewPayslip.generatedOn), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>

                <table className="breakdown w-full">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left p-3">Description</th>
                      <th className="text-right p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border-b border-border">
                        Basic Salary
                      </td>
                      <td className="p-3 border-b border-border text-right">
                        ${viewPayslip.basicSalary.toLocaleString("en-US")}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b border-border">Allowances</td>
                      <td className="p-3 border-b border-border text-right text-success">
                        +${viewPayslip.allowances.toLocaleString("en-US")}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b border-border">Deductions</td>
                      <td className="p-3 border-b border-border text-right text-destructive">
                        -${viewPayslip.deductions.toLocaleString("en-US")}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b border-border">Tax</td>
                      <td className="p-3 border-b border-border text-right text-destructive">
                        -${viewPayslip.tax.toLocaleString("en-US")}
                      </td>
                    </tr>
                    <tr className="total-row bg-primary/5">
                      <td className="p-3 font-bold">Net Salary</td>
                      <td className="p-3 text-right font-bold text-lg">
                        ${viewPayslip.netSalary.toLocaleString("en-US")}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="footer mt-6 text-center text-sm text-muted-foreground">
                  This is a computer-generated document. No signature required.
                </div>
              </div>

              <DialogFooter>
                {viewPayslip.status === "draft" && (
                  <Button
                    variant="outline"
                    onClick={() => handleFinalize(viewPayslip.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalize
                  </Button>
                )}
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={handlePrint}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}