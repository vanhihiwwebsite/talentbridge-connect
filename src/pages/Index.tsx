import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
      <h1 className="text-4xl font-bold text-foreground">TalentBridge</h1>
      <p className="text-lg text-muted-foreground max-w-md">
        Connect talent with opportunity. Find your next role or hire the best candidates.
      </p>
      {!isAuthenticated ? (
        <div className="flex gap-3">
          <Link to="/login"><Button size="lg">Login</Button></Link>
          <Link to="/register"><Button size="lg" variant="outline">Register</Button></Link>
        </div>
      ) : (
        <div className="flex gap-3">
          {role === "CANDIDATE" && <Link to="/jobs"><Button size="lg">Browse Jobs</Button></Link>}
          {role === "EMPLOYER" && <Link to="/employer/jobs"><Button size="lg">My Jobs</Button></Link>}
          {role === "ADMIN" && <Link to="/admin/jobs"><Button size="lg">Admin Panel</Button></Link>}
        </div>
      )}
    </div>
  );
};

export default Index;
