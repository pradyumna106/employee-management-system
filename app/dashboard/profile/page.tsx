"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateUserPassword } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function ProfilePage() {
  const { employee, user } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const profileFields = employee
    ? [
        {
          icon: User,
          label: "Full Name",
          value: `${employee.firstName} ${employee.lastName}`,
        },
        {
          icon: Mail,
          label: "Email",
          value: employee.email,
        },
        {
          icon: Phone,
          label: "Phone",
          value: employee.phone,
        },
        {
          icon: Building2,
          label: "Department",
          value: employee.department,
        },
        {
          icon: Briefcase,
          label: "Position",
          value: employee.position,
        },
        {
          icon: DollarSign,
          label: "Annual Salary",
          value: `$${employee.salary.toLocaleString("en-US")}`,
        },
        {
          icon: Calendar,
          label: "Date of Joining",
          value: employee.dateOfJoining ? format(parseISO(employee.dateOfJoining), "MMMM d, yyyy") : "N/A",
        },
      ]
    : [];

  // FIXED: Made function async, removed fake setTimeout, and added await
  const handlePasswordChange = async () => {
    setMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }

    setIsLoading(true);

    try {
      // Actually wait for Supabase to update the password
      const result = await updateUserPassword(user.id, currentPassword, newPassword);

      if (result.success) {
        setMessage({ type: "success", text: "Password updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update password" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: "An unexpected error occurred." });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "View your account details" : "View your employment details"}
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-success/10 text-success border border-success/20"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {employee && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                {employee.firstName[0]}
                {employee.lastName[0]}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {employee.firstName} {employee.lastName}
                </CardTitle>
                <p className="text-muted-foreground">{employee.position}</p>
                <Badge
                  className={
                    employee.status === "active"
                      ? "bg-success/20 text-success hover:bg-success/20 mt-2"
                      : "bg-muted text-muted-foreground mt-2"
                  }
                >
                  {employee.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profileFields.map((field) => (
                <div
                  key={field.label}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <field.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{field.label}</p>
                    <p className="font-medium">{field.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Login Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password Settings
          </CardTitle>
          {!showPasswordForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordForm(true)}
            >
              Change Password
            </Button>
          )}
        </CardHeader>
        {showPasswordForm && (
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setMessage(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
        {!showPasswordForm && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              You can change your password at any time. Make sure to use a strong password with at least 6 characters.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}