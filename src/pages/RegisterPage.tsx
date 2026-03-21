import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { ApiResponse, AuthResponse, Role } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CANDIDATE");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () =>
      api.post<ApiResponse<AuthResponse>>("/api/v1/auth/register", {
        username, email, password, role,
        ...(role === "CANDIDATE" ? { fullName } : {}),
        ...(role === "EMPLOYER" ? { companyName } : {}),
      }),
    onSuccess: (res) => {
      const d = res.data.data;
      login(d.token, d.userId, d.role, d.username);
      if (d.role === "EMPLOYER") navigate("/employer/jobs");
      else navigate("/jobs");
    },
  });

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Create Account</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
            <div><Label>Username</Label><Input value={username} onChange={e => setUsername(e.target.value)} required /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CANDIDATE">Candidate</SelectItem>
                  <SelectItem value="EMPLOYER">Employer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === "CANDIDATE" && (
              <div><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} required /></div>
            )}
            {role === "EMPLOYER" && (
              <div><Label>Company Name</Label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} required /></div>
            )}
            {mutation.isError && (
              <p className="text-sm text-destructive">
                {(mutation.error as any)?.response?.data?.message || "Registration failed"}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating account..." : "Register"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary underline">Login</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
