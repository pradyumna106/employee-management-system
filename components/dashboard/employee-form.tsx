"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Employee } from "@/lib/types";
import { addEmployee, updateEmployee } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // <-- Added this import
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  salary: z.coerce.number().min(1, "Salary is required"),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  status: z.enum(["active", "inactive"]),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: Employee | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const departments = [
  "Engineering",
  "Design",
  "Marketing",
  "HR",
  "Finance",
  "Sales",
  "Operations",
];

export function EmployeeForm({
  employee,
  open,
  onClose,
  onSuccess,
}: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          position: employee.position,
          salary: employee.salary,
          dateOfJoining: employee.dateOfJoining,
          status: employee.status,
        }
      : {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          department: "",
          position: "",
          salary: 0,
          dateOfJoining: new Date().toISOString().split("T")[0],
          status: "active",
        },
  });

  // FIXED: Made this async to wait for Supabase
  const onSubmit = async (data: EmployeeFormData) => {
    try {
      if (employee) {
        await updateEmployee(employee.id, data);
      } else {
        await addEmployee(data);
      }
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save employee:", error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
          {/* FIXED: Added DialogDescription to resolve the console warning */}
          <DialogDescription>
            {employee
              ? "Update the details of the selected employee."
              : "Enter the details below to add a new employee to the system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && (
                  <FieldError>{errors.firstName.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && (
                  <FieldError>{errors.lastName.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled={!!employee}
              />
              {errors.email && (
                <FieldError>{errors.email.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Phone</FieldLabel>
              <Input id="phone" {...register("phone")} />
              {errors.phone && (
                <FieldError>{errors.phone.message}</FieldError>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Department</FieldLabel>
                <Select
                  value={watch("department")}
                  onValueChange={(value) => setValue("department", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && (
                  <FieldError>{errors.department.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="position">Position</FieldLabel>
                <Input id="position" {...register("position")} />
                {errors.position && (
                  <FieldError>{errors.position.message}</FieldError>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="salary">Annual Salary ($)</FieldLabel>
                <Input
                  id="salary"
                  type="number"
                  {...register("salary")}
                />
                {errors.salary && (
                  <FieldError>{errors.salary.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="dateOfJoining">Date of Joining</FieldLabel>
                <Input
                  id="dateOfJoining"
                  type="date"
                  {...register("dateOfJoining")}
                />
                {errors.dateOfJoining && (
                  <FieldError>{errors.dateOfJoining.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={watch("status")}
                onValueChange={(value: "active" | "inactive") =>
                  setValue("status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {employee ? "Update" : "Add"} Employee
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}