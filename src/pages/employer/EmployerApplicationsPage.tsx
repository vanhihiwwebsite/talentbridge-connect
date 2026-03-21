import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ApiResponse, ApplicationResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const EmployerApplicationsPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["employer-applications"],
    queryFn: () => api.get<ApiResponse<ApplicationResponse[]>>("/api/v1/applications/employer").then(r => r.data.data),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Applications Received</h1>
      {(!data || data.length === 0) && <p className="text-muted-foreground">No applications yet.</p>}
      {data?.map(app => (
        <ApplicationCard key={app.id} app={app} queryClient={queryClient} />
      ))}
    </div>
  );
};

const ApplicationCard = ({ app, queryClient }: { app: ApplicationResponse; queryClient: any }) => {
  const [status, setStatus] = useState(app.status);
  const [note, setNote] = useState("");

  const updateStatus = useMutation({
    mutationFn: () => api.put(`/api/v1/applications/${app.id}/status`, { status, note }),
    onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["employer-applications"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800", REVIEWING: "bg-blue-100 text-blue-800",
    INTERVIEW: "bg-purple-100 text-purple-800", ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{app.candidateName}</CardTitle>
            <p className="text-sm text-muted-foreground">{app.candidateEmail} · {app.jobTitle}</p>
          </div>
          <Badge className={statusColor[app.status] || ""}>{app.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {app.coverLetter && <p className="text-sm">{app.coverLetter}</p>}
        {app.cvUrlAtTime && (
          <a href={app.cvUrlAtTime} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">View CV</a>
        )}
        <div className="flex items-end gap-2">
          <div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REVIEWING">Reviewing</SelectItem>
                <SelectItem value="INTERVIEW">Interview</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="max-w-xs" />
          <Button size="sm" onClick={() => updateStatus.mutate()} disabled={updateStatus.isPending || status === app.status}>
            Update
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployerApplicationsPage;
