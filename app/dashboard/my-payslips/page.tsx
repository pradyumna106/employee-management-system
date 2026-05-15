"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { getEmployeePayslips } from "@/lib/store";
import type { Payslip } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DollarSign, FileText, Download, Printer, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function MyPayslipsPage() {
  const { employee } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // FIXED: Made the fetch logic async and added await
  useEffect(() => {
    const loadPayslips = async () => {
      if (employee) {
        try {
          const data = await getEmployeePayslips(employee.id);
          setPayslips(Array.isArray(data) ? data.reverse() : []);
        } catch (error) {
          console.error("Failed to fetch payslips:", error);
        }
      }
    };

    loadPayslips();
  }, [employee]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent || !employee) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${employee.firstName} ${employee.lastName}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .company { font-size: 28px; font-weight: bold; }
            .payslip-title { font-size: 16px; color: #666; margin-top: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
            .info-section { padding: 15px; background: #f9f9f9; border-radius: 8px; }
            .info-label { font-size: 12px; color: #666; margin-bottom: 4px; }
            .info-value { font-weight: 600; }
            .breakdown { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .breakdown th, .breakdown td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .breakdown th { background: #f5f5f5; font-weight: 600; }
            .credit { color: #22c55e; }
            .debit { color: #ef4444; }
            .total-row { font-weight: bold; font-size: 18px; background: #f0f9ff; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
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

  const totalEarned = payslips
    .filter((p) => p.status === "finalized")
    .reduce((sum, p) => sum + p.netSalary, 0);

  if (!employee) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Payslips</h1>
        <p className="text-muted-foreground">
          View and download your salary slips
        </p>
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
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${totalEarned.toLocaleString("en-US")}
                </p>
                <p className="text-sm text-muted-foreground">Total Earned</p>
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

      {/* Payslips Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {payslips.length === 0 ? (
          <Card className="col-span-full bg-card/50 border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground">
              No payslips available yet. Your payslips will appear here once
              generated by the admin.
            </CardContent>
          </Card>
        ) : (
          payslips.map((payslip) => (
            <Card
              key={payslip.id}
              className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {payslip.month} {payslip.year}
                  </CardTitle>
                  <Badge
                    variant={
                      payslip.status === "finalized" ? "default" : "secondary"
                    }
                    className={
                      payslip.status === "finalized"
                        ? "bg-success/20 text-success hover:bg-success/20"
                        : "bg-warning/20 text-warning hover:bg-warning/20"
                    }
                  >
                    {payslip.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Basic</p>
                    <p className="font-medium">
                      ${payslip.basicSalary.toLocaleString("en-US")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Allowances</p>
                    <p className="font-medium text-success">
                      +${payslip.allowances.toLocaleString("en-US")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deductions</p>
                    <p className="font-medium text-destructive">
                      -${payslip.deductions.toLocaleString("en-US")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tax</p>
                    <p className="font-medium text-destructive">
                      -${payslip.tax.toLocaleString("en-US")}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Net Salary</p>
                    <p className="text-xl font-bold">
                      ${payslip.netSalary.toLocaleString("en-US")}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setViewPayslip(payslip)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Payslip Dialog */}
      <Dialog open={!!viewPayslip} onOpenChange={() => setViewPayslip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip Details</DialogTitle>
          </DialogHeader>

          {viewPayslip && (
            <>
              <div ref={printRef}>
                <div className="header text-center pb-4 border-b border-border mb-4">
                  <div className="company text-2xl font-bold">WorkFlow EMS</div>
                  <div className="payslip-title text-muted-foreground">
                    Payslip for {viewPayslip.month} {viewPayslip.year}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Employee</p>
                      <p className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{employee.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Position</p>
                      <p className="font-medium">{employee.position}</p>
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
                      <th className="text-left p-3 rounded-tl-lg">Description</th>
                      <th className="text-right p-3 rounded-tr-lg">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border-b border-border">Basic Salary</td>
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
                      <td className="p-3 font-bold rounded-bl-lg">Net Salary</td>
                      <td className="p-3 text-right font-bold text-lg rounded-br-lg">
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