export type UserRole = "admin" | "employee";

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  employeeId?: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  salary: number;
  dateOfJoining: string;
  status: "active" | "inactive";
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "present" | "absent" | "late" | "half-day";
  hoursWorked?: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: "sick" | "casual" | "annual" | "unpaid";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedOn: string;
  reviewedBy?: string;
  reviewedOn?: string;
  reviewNotes?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netSalary: number;
  generatedOn: string;
  status: "draft" | "finalized";
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  totalPayroll: number;
}
