import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Briefcase, User, Shield } from "lucide-react";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role, username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="text-lg font-bold text-foreground">TalentBridge</Link>
          <nav className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {role === "CANDIDATE" && (
                  <>
                    <Link to="/jobs"><Button variant="ghost" size="sm"><Briefcase className="w-4 h-4 mr-1" />Jobs</Button></Link>
                    <Link to="/my-applications"><Button variant="ghost" size="sm">My Applications</Button></Link>
                    <Link to="/candidate/profile"><Button variant="ghost" size="sm"><User className="w-4 h-4 mr-1" />Profile</Button></Link>
                  </>
                )}
                {role === "EMPLOYER" && (
                  <>
                    <Link to="/employer/jobs"><Button variant="ghost" size="sm"><Briefcase className="w-4 h-4 mr-1" />My Jobs</Button></Link>
                    <Link to="/employer/applications"><Button variant="ghost" size="sm">Applications</Button></Link>
                    <Link to="/employer/profile"><Button variant="ghost" size="sm"><User className="w-4 h-4 mr-1" />Profile</Button></Link>
                  </>
                )}
                {role === "ADMIN" && (
                  <>
                    <Link to="/admin/jobs"><Button variant="ghost" size="sm"><Shield className="w-4 h-4 mr-1" />Pending Jobs</Button></Link>
                    <Link to="/admin/categories"><Button variant="ghost" size="sm">Categories</Button></Link>
                    <Link to="/admin/users"><Button variant="ghost" size="sm">Users</Button></Link>
                  </>
                )}
                <Link to="/notifications"><Button variant="ghost" size="sm"><Bell className="w-4 h-4" /></Button></Link>
                <span className="text-sm text-muted-foreground">{username}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link to="/register"><Button size="sm">Register</Button></Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
};

export default AppLayout;
