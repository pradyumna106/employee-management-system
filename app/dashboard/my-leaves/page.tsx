"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { getEmployeeLeaves, applyLeave } from "@/lib/store";
import type { LeaveRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  Calendar,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";

const leaveSchema = z.object({
  type: z.enum(["sick", "casual", "annual", "unpaid"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(10, "Please provide a detailed reason (min 10 chars)"),
});

type LeaveFormData = z.infer<typeof leaveSchema>;

export default function MyLeavesPage() {
  const { employee } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [applyOpen, setApplyOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      type: "casual",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  // FIXED: Made loadData async and added await
  const loadData = async () => {
    if (employee) {
      try {
        const leavesData = await getEmployeeLeaves(employee.id);
        // Ensure it's an array before calling reverse()
        setLeaves(Array.isArray(leavesData) ? leavesData.reverse() : []);
      } catch (error) {
        console.error("Failed to load leaves:", error);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [employee]);

  // FIXED: Made onSubmit async and added await
  const onSubmit = async (data: LeaveFormData) => {
    if (employee) {
      try {
        await applyLeave({
          employeeId: employee.id,
          ...data,
        });
        await loadData();
        setApplyOpen(false);
        reset();
      } catch (error) {
        console.error("Failed to apply for leave:", error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { label: string; className: string; icon: typeof CheckCircle }
    > = {
      pending: {
        label: "Pending",
        className: "bg-warning/20 text-warning",
        icon: AlertCircle,
      },
      approved: {
        label: "Approved",
        className: "bg-success/20 text-success",
        icon: CheckCircle,
      },
      rejected: {
        label: "Rejected",
        className: "bg-destructive/20 text-destructive",
        icon: XCircle,
      },
    };

    const cfg = config[status];
    if (!cfg) return null;

    return (
      <Badge variant="secondary" className={cfg.className}>
        <cfg.icon className="h-3 w-3 mr-1" />
        {cfg.label}
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

  const stats = {
    total: leaves.length,
    approved: leaves.filter((l) => l.status === "approved").length,
    pending: leaves.filter((l) => l.status === "pending").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  if (!employee) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Leaves</h1>
          <p className="text-muted-foreground">
            Apply for leave and track your requests
          </p>
        </div>
        <Button onClick={() => setApplyOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Apply for Leave
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-success">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-destructive">
              {stats.rejected}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leaves.length === 0 ? (
          <Card className="col-span-full bg-card/50 border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground">
              No leave requests yet. Click &quot;Apply for Leave&quot; to submit your
              first request.
            </CardContent>
          </Card>
        ) : (
          leaves.map((leave) => {
            const days =
              differenceInDays(
                parseISO(leave.endDate),
                parseISO(leave.startDate)
              ) + 1;

            return (
              <Card key={leave.id} className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    {getTypeBadge(leave.type)}
                    {getStatusBadge(leave.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(parseISO(leave.startDate), "MMM d")} -{" "}
                      {format(parseISO(leave.endDate), "MMM d, yyyy")}
                    </span>
                    <Badge variant="outline" className="ml-auto">
                      {days} day{days > 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">{leave.reason}</p>

                  <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                    Applied: {format(parseISO(leave.appliedOn), "MMM d, yyyy")}
                    {leave.reviewedOn && (
                      <span className="block">
                        Reviewed: {format(parseISO(leave.reviewedOn), "MMM d, yyyy")}
                      </span>
                    )}
                    {leave.reviewNotes && (
                      <span className="block mt-1 text-foreground">
                        Note: {leave.reviewNotes}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel>Leave Type</FieldLabel>
                <Select
                  value={watch("type")}
                  onValueChange={(value: LeaveFormData["type"]) =>
                    setValue("type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
                  <Input
                    id="startDate"
                    type="date"
                    {...register("startDate")}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.startDate && (
                    <FieldError>{errors.startDate.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="endDate">End Date</FieldLabel>
                  <Input
                    id="endDate"
                    type="date"
                    {...register("endDate")}
                    min={watch("startDate") || new Date().toISOString().split("T")[0]}
                  />
                  {errors.endDate && (
                    <FieldError>{errors.endDate.message}</FieldError>
                  )}
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="reason">Reason</FieldLabel>
                <Textarea
                  id="reason"
                  {...register("reason")}
                  placeholder="Please provide a reason for your leave request..."
                  rows={4}
                />
                {errors.reason && (
                  <FieldError>{errors.reason.message}</FieldError>
                )}
              </Field>
            </FieldGroup>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setApplyOpen(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}