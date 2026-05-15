"use client";

import { useEffect, useState } from "react";
import type { Employee } from "@/lib/types";
import { getEmployees } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeTable } from "@/components/dashboard/employee-table";
import { EmployeeForm } from "@/components/dashboard/employee-form";
import { Plus, Search } from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // 1. THIS is the part that changed. It is now async.
  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      // Ensure it's an array before saving to state
      const employeeArray = Array.isArray(data) ? data : [];
      setEmployees(employeeArray);
      setFilteredEmployees(employeeArray);
    } catch (error) {
      console.error("Failed to load employees:", error);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = employees.filter(
        (emp) =>
          emp.firstName.toLowerCase().includes(search.toLowerCase()) ||
          emp.lastName.toLowerCase().includes(search.toLowerCase()) ||
          emp.email.toLowerCase().includes(search.toLowerCase()) ||
          emp.department.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [search, employees]);

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s employees
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <EmployeeTable
        employees={filteredEmployees}
        onEdit={handleEdit}
        onRefresh={loadEmployees}
      />

      <EmployeeForm
        employee={editingEmployee}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={loadEmployees}
      />
    </div>
  );
}