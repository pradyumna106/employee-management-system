"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  Calendar,
  FileText,
  Zap,
  ArrowRight,
} from "lucide-react";

const quickLinks = [
  {
    icon: Clock,
    title: "Mark Attendance",
    description: "Check in/out for the day",
  },
  {
    icon: Calendar,
    title: "Apply Leave",
    description: "Request time off",
  },
  {
    icon: FileText,
    title: "View Payslip",
    description: "Access salary details",
  },
  {
    icon: Users,
    title: "Team Directory",
    description: "Find colleagues",
  },
];

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20" />
          <div className="h-6 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Subtle background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight block leading-tight">WorkforceTech</span>
              <span className="text-xs text-muted-foreground">Employee Portal</span>
            </div>
          </div>
          <Link href="/login">
            <Button className="bg-primary hover:bg-primary/90">
              Sign In
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-4xl">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Welcome to{" "}
              <span className="gradient-text">WorkforceTech</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Your employee management portal. Sign in to access attendance, leave requests, payslips, and more.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href="/login"
                className="group p-5 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/40 hover:bg-card/80 transition-all duration-300 text-center"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <link.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-sm mb-1">{link.title}</h3>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </Link>
            ))}
          </div>

          {/* Sign In Card */}
          <div className="max-w-md mx-auto">
            <div className="relative rounded-2xl bg-card border border-border/60 p-8 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl" />
              <div className="relative z-10">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Employee Portal Access</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Sign in with your company credentials to access your dashboard.
                </p>
                <Link href="/login" className="block">
                  <Button size="lg" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground">
                    Sign In to Your Account
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-4">
                  Contact IT support if you need help accessing your account
                </p>
              </div>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20 max-w-md mx-auto">
            <p className="text-xs font-medium text-primary mb-2 text-center">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-4 text-xs text-center">
              <div>
                <p className="text-muted-foreground">Admin</p>
                <p className="font-mono text-foreground">admin@company.com</p>
                <p className="font-mono text-muted-foreground">admin123</p>
              </div>
              <div>
                <p className="text-muted-foreground">Employee</p>
                <p className="font-mono text-foreground">john@company.com</p>
                <p className="font-mono text-muted-foreground">employee123</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-border/40">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Zap className="h-3 w-3 text-primary-foreground" />
              </div>
              <span>WorkforceTech Internal Portal</span>
            </div>
            <div>&copy; {new Date().getFullYear()} WorkforceTech. Internal use only.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
