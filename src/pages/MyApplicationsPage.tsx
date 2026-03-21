import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ApiResponse, ApplicationResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  REVIEWING: "bg-blue-100 text-blue-800",
  INTERVIEW: "bg-purple-100 text-purple-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-gray-100 text-gray-800",
};

const MyApplicationsPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => api.get<ApiResponse<ApplicationResponse[]>>("/api/v1/applications/my-applications").then(r => r.data.data),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/v1/applications/${id}/withdraw`),
    onSuccess: () => { toast.success("Application withdrawn"); queryClient.invalidateQueries({ queryKey: ["my-applications"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
      {(!data || data.length === 0) && <p className="text-muted-foreground">No applications yet.</p>}
      {data?.map(app => (
        <Card key={app.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{app.jobTitle}</CardTitle>
              <Badge className={statusColor[app.status] || ""}>{app.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{app.companyName} · Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
          </CardHeader>
          <CardContent>
            {app.coverLetter && <p className="text-sm mb-2">{app.coverLetter}</p>}
            {app.status === "PENDING" && (
              <Button variant="destructive" size="sm" onClick={() => withdrawMutation.mutate(app.id)}
                disabled={withdrawMutation.isPending}>Withdraw</Button>
            )}
            {app.histories?.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">History</p>
                {app.histories.map(h => (
                  <p key={h.id} className="text-xs text-muted-foreground">
                    {h.fromStatus} → {h.toStatus} {h.note && `- ${h.note}`} ({new Date(h.changedAt).toLocaleDateString()})
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyApplicationsPage;
