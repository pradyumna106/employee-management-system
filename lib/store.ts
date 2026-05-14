import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  Payslip,
} from "./types";

// ==========================================
// DATA MAPPERS (CamelCase <-> Snake_Case)
// ==========================================

const mapEmpToFrontend = (db: any): Employee => ({
  id: db.id,
  firstName: db.first_name,
  lastName: db.last_name,
  email: db.email,
  phone: db.phone,
  department: db.department,
  position: db.position,
  salary: db.salary,
  dateOfJoining: db.date_of_joining,
  status: db.status,
  avatar: db.avatar,
});

const mapEmpToDB = (emp: Partial<Employee>) => {
  const db: any = {};
  if (emp.firstName) db.first_name = emp.firstName;
  if (emp.lastName) db.last_name = emp.lastName;
  if (emp.email) db.email = emp.email;
  if (emp.phone) db.phone = emp.phone;
  if (emp.department) db.department = emp.department;
  if (emp.position) db.position = emp.position;
  if (emp.salary !== undefined) db.salary = emp.salary;
  if (emp.dateOfJoining) db.date_of_joining = emp.dateOfJoining;
  if (emp.status) db.status = emp.status;
  return db;
};

const mapAttToFrontend = (db: any): AttendanceRecord => ({
  id: db.id,
  employeeId: db.employee_id,
  date: db.date,
  checkIn: db.check_in,
  checkOut: db.check_out,
  status: db.status,
  hoursWorked: db.hours_worked,
});

const mapLeaveToFrontend = (db: any): LeaveRequest => ({
  id: db.id,
  employeeId: db.employee_id,
  type: db.type,
  startDate: db.start_date,
  endDate: db.end_date,
  reason: db.reason,
  status: db.status,
  appliedOn: db.applied_on,
  reviewedBy: db.reviewed_by,
  reviewedOn: db.reviewed_on,
  reviewNotes: db.review_notes,
});

const mapPayslipToFrontend = (db: any): Payslip => ({
  id: db.id,
  employeeId: db.employee_id,
  month: db.month,
  year: db.year,
  basicSalary: db.basic_salary,
  allowances: db.allowances,
  deductions: db.deductions,
  tax: db.tax,
  netSalary: db.net_salary,
  generatedOn: db.generated_on,
  status: db.status,
});

// ==========================================
// --- Employee Operations ---
// ==========================================

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) throw error;
  return (data || []).map(mapEmpToFrontend);
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapEmpToFrontend(data);
}

export async function addEmployee(employee: Omit<Employee, "id">): Promise<Employee> {
  // 1. Insert into the employees table
  const dbData = mapEmpToDB(employee);
  const { data: newEmployee, error: empError } = await supabase
    .from("employees")
    .insert([dbData])
    .select()
    .single();

  if (empError) throw empError;

  // 2. Create the Auth User WITHOUT logging out the Admin
  // We create a temporary Supabase client that doesn't save the login session
  const tempSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: authData, error: authError } = await tempSupabase.auth.signUp({
    email: employee.email,
    password: "employee123", // Set the default preset password
  });

  // 🚨 STRICT CHECK: If Auth fails, we delete the employee we just made and throw the error.
  if (authError) {
    await supabase.from("employees").delete().eq("id", newEmployee.id);
    throw new Error("Auth Creation Failed: " + authError.message);
  }

  if (authData.user) {
    // 3. Link the Auth User to the Employee in the Profiles table
    await supabase.from("profiles").insert([{
      id: authData.user.id,
      role: "employee",
      employee_id: newEmployee.id
    }]);
  }

  return mapEmpToFrontend(newEmployee);
}

export async function updateEmployee(id: string, employeeData: Partial<Employee>): Promise<Employee | null> {
  const dbData = mapEmpToDB(employeeData);
  const { data, error } = await supabase
    .from("employees")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapEmpToFrontend(data);
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const { error } = await supabase.from("employees").delete().eq("id", id);
  return !error;
}

// ==========================================
// --- Attendance Operations ---
// ==========================================

export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase.from("attendance").select("*");
  if (error) throw error;
  return (data || []).map(mapAttToFrontend);
}

export async function getTodayAttendance(employeeId: string): Promise<AttendanceRecord | null> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .maybeSingle();

  if (error || !data) return null;
  return mapAttToFrontend(data);
}

export async function checkIn(employeeId: string): Promise<AttendanceRecord> {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().slice(0, 5);
  
  const { data, error } = await supabase
    .from("attendance")
    .upsert({
      employee_id: employeeId,
      date: today,
      check_in: now,
      status: now > "09:15" ? "late" : "present",
    })
    .select()
    .single();

  if (error) throw error;
  return mapAttToFrontend(data);
}

export async function checkOut(employeeId: string): Promise<AttendanceRecord | null> {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().slice(0, 5);

  const { data: current } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .single();

  if (!current?.check_in) return null;

  // Calculate hours worked
  const [inH, inM] = current.check_in.split(":").map(Number);
  const [outH, outM] = now.split(":").map(Number);
  const hours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 10) / 10;

  const { data, error } = await supabase
    .from("attendance")
    .update({
      check_out: now,
      hours_worked: hours,
      status: hours < 4 ? "half-day" : current.status
    })
    .eq("employee_id", employeeId)
    .eq("date", today)
    .select()
    .single();

  if (error) throw error;
  return mapAttToFrontend(data);
}

export async function getEmployeeAttendance(employeeId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeId)
    .order("date", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapAttToFrontend);
}

// ==========================================
// --- Leave Operations ---
// ==========================================

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const { data, error } = await supabase.from("leaves").select("*");
  if (error) throw error;
  return (data || []).map(mapLeaveToFrontend);
}

export async function getEmployeeLeaves(employeeId: string): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from("leaves")
    .select("*")
    .eq("employee_id", employeeId)
    .order("applied_on", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapLeaveToFrontend);
}

export async function applyLeave(leave: any): Promise<LeaveRequest> {
  const { data, error } = await supabase
    .from("leaves")
    .insert([{
      employee_id: leave.employeeId,
      type: leave.type,
      start_date: leave.startDate,
      end_date: leave.endDate,
      reason: leave.reason,
      status: "pending",
      applied_on: new Date().toISOString().split("T")[0],
    }])
    .select()
    .single();

  if (error) throw error;
  return mapLeaveToFrontend(data);
}

export async function updateLeaveStatus(
  id: string,
  status: "approved" | "rejected",
  reviewedBy: string,
  reviewNotes?: string
): Promise<LeaveRequest | null> {
  const { data, error } = await supabase
    .from("leaves")
    .update({
      status,
      reviewed_by: reviewedBy,
      reviewed_on: new Date().toISOString().split("T")[0],
      review_notes: reviewNotes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapLeaveToFrontend(data);
}

// ==========================================
// --- Payslip Operations ---
// ==========================================

export async function getPayslips(): Promise<Payslip[]> {
  const { data, error } = await supabase.from("payslips").select("*");
  if (error) throw error;
  return (data || []).map(mapPayslipToFrontend);
}

export async function getEmployeePayslips(employeeId: string): Promise<Payslip[]> {
  const { data, error } = await supabase
    .from("payslips")
    .select("*")
    .eq("employee_id", employeeId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapPayslipToFrontend);
}

export async function generatePayslip(
  employeeId: string,
  month: string,
  year: number
): Promise<Payslip> {
  const employee = await getEmployee(employeeId);
  
  if (!employee) throw new Error("Employee not found");
  
  const basicSalary = Math.round(employee.salary / 12 * 100) / 100;
  const allowances = Math.round(basicSalary * 0.1 * 100) / 100;
  const deductions = Math.round(basicSalary * 0.03 * 100) / 100;
  const tax = Math.round(basicSalary * 0.15 * 100) / 100;
  const netSalary = Math.round((basicSalary + allowances - deductions - tax) * 100) / 100;
  
  const { data, error } = await supabase
    .from("payslips")
    .insert([{
      employee_id: employeeId,
      month,
      year,
      basic_salary: basicSalary,
      allowances,
      deductions,
      tax,
      net_salary: netSalary,
      generated_on: new Date().toISOString().split("T")[0],
      status: "draft"
    }])
    .select()
    .single();

  if (error) throw error;
  return mapPayslipToFrontend(data);
}

export async function finalizePayslip(id: string): Promise<Payslip | null> {
  const { data, error } = await supabase
    .from("payslips")
    .update({ status: "finalized" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapPayslipToFrontend(data);
}

// ==========================================
// --- Dashboard Stats & Auth ---
// ==========================================

export async function getDashboardStats() {
  const today = new Date().toISOString().split("T")[0];

  const [empRes, attRes, leaveRes] = await Promise.all([
    supabase.from("employees").select("salary", { count: "exact" }).eq("status", "active"),
    supabase.from("attendance").select("id").eq("date", today).in("status", ["present", "late"]),
    supabase.from("leaves").select("id").eq("status", "pending")
  ]);

  const totalPayroll = empRes.data?.reduce((sum, e) => sum + (e.salary || 0), 0) || 0;

  return {
    totalEmployees: empRes.count || 0,
    presentToday: attRes.data?.length || 0,
    pendingLeaves: leaveRes.data?.length || 0,
    totalPayroll,
  };
}

export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters" };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { success: false, error: error.message };
  return { success: true };
}