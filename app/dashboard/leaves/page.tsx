"use client";

import { useEffect, useState } from "react";
import type { LeaveRequest, Employee } from "@/lib/types";
import { getLeaveRequests, getEmployees, updateLeaveStatus } from "@/lib/store";
import { useAuth } from "@/lib/auth-context"; // <-- NEW: Added useAuth
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

export default function LeavesPage() {
  const { user } = useAuth(); // <-- NEW: Grab the logged-in admin's data
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const loadData = async () => {
    try {
      const leavesData = await getLeaveRequests();
      const empData = await getEmployees();
      setLeaves(Array.isArray(leavesData) ? leavesData : []);
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch (error) {
      console.error("Failed to load leave data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getEmployee = (employeeId: string) =>
    employees.find((e) => e.id === employeeId);

  const filteredLeaves =
    statusFilter === "all"
      ? leaves
      : leaves.filter((l) => l.status === statusFilter);

  // FIXED: Now passes user.id instead of "admin", and extracts the error message properly
  const handleApprove = async () => {
    if (selectedLeave && user) {
      try {
        await updateLeaveStatus(
          selectedLeave.id,
          "approved",
          user.id, // <-- Passes real UUID
          reviewNotes
        );
        await loadData();
        setSelectedLeave(null);
        setReviewNotes("");
      } catch (error: any) {
        console.error("Failed to approve leave:", error.message || error);
        alert("Database Error: " + (error.message || "Failed to approve leave."));
      }
    }
  };

  // FIXED: Same fixes for rejecting
  const handleReject = async () => {
    if (selectedLeave && user) {
      try {
        await updateLeaveStatus(
          selectedLeave.id,
          "rejected",
          user.id, // <-- Passes real UUID
          reviewNotes
        );
        await loadData();
        setSelectedLeave(null);
        setReviewNotes("");
      } catch (error: any) {
        console.error("Failed to reject leave:", error.message || error);
        alert("Database Error: " + (error.message || "Failed to reject leave."));
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: {
        label: "Pending",
        className: "bg-warning/20 text-warning hover:bg-warning/20",
        icon: AlertCircle,
      },
      approved: {
        label: "Approved",
        className: "bg-success/20 text-success hover:bg-success/20",
        icon: CheckCircle,
      },
      rejected: {
        label: "Rejected",
        className: "bg-destructive/20 text-destructive hover:bg-destructive/20",
        icon: XCircle,
      },
    }[status];

    if (!config) return null;

    return (
      <Badge variant="secondary" className={config.className}>
        <config.icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      sick: "bg-destructive/10 text-destructive",
      casual: "bg-chart-2/10 text-chart-2",
      annual: "bg-primary/10 text-primary",
      unpaid: "bg-muted text-muted-foreground",
    };

    return (
      <Badge variant="outline" className={config[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const pendingCount = leaves.filter((l) => l.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leave Requests</h1>
          <p className="text-muted-foreground">
            Review and manage employee leave applications
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-warning/20 text-warning hover:bg-warning/20 w-fit">
            {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leave Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLeaves.length === 0 ? (
          <Card className="col-span-full bg-card/50 border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground">
              No leave requests found
            </CardContent>
          </Card>
        ) : (
          filteredLeaves.map((leave) => {
            const employee = getEmployee(leave.employeeId);
            const days =
              differenceInDays(
                parseISO(leave.endDate),
                parseISO(leave.startDate)
              ) + 1;

            return (
              <Card
                key={leave.id}
                className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setSelectedLeave(leave)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                        {employee?.firstName?.[0] || "?"}
                        {employee?.lastName?.[0] || "?"}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {employee?.firstName} {employee?.lastName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {employee?.department}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(leave.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getTypeBadge(leave.type)}
                    <span className="text-sm text-muted-foreground">
                      {days} day{days > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(parseISO(leave.startDate), "MMM d")} -{" "}
                      {format(parseISO(leave.endDate), "MMM d, yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Applied: {format(parseISO(leave.appliedOn), "MMM d, yyyy")}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {leave.reason}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedLeave}
        onOpenChange={() => {
          setSelectedLeave(null);
          setReviewNotes("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
          </DialogHeader>

          {selectedLeave && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Employee
                  </span>
                  <span className="font-medium">
                    {getEmployee(selectedLeave.employeeId)?.firstName}{" "}
                    {getEmployee(selectedLeave.employeeId)?.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  {getTypeBadge(selectedLeave.type)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dates</span>
                  <span className="font-medium">
                    {format(parseISO(selectedLeave.startDate), "MMM d")} -{" "}
                    {format(parseISO(selectedLeave.endDate), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Duration
                  </span>
                  <span className="font-medium">
                    {differenceInDays(
                      parseISO(selectedLeave.endDate),
                      parseISO(selectedLeave.startDate)
                    ) + 1}{" "}
                    days
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Reason</span>
                  <p className="mt-1">{selectedLeave.reason}</p>
                </div>
              </div>

              {selectedLeave.status === "pending" && (
                <Field>
                  <FieldLabel>Review Notes (Optional)</FieldLabel>
                  <Textarea
                    placeholder="Add any notes for this decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </Field>
              )}

              {selectedLeave.status !== "pending" && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">
                    Reviewed on{" "}
                    {selectedLeave.reviewedOn
                      ? format(parseISO(selectedLeave.reviewedOn), "MMM d, yyyy")
                      : "N/A"}
                  </p>
                  {selectedLeave.reviewNotes && (
                    <p className="text-sm">{selectedLeave.reviewNotes}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedLeave?.status === "pending" && (
              <>
                <Button variant="outline" onClick={handleReject}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={handleApprove}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}