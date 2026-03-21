import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ApiResponse, JobPostResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

const AdminPendingJobsPage = () => {
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["admin-pending-jobs"],
    queryFn: () => api.get<ApiResponse<JobPostResponse[]>>("/api/v1/admin/jobs/pending").then(r => r.data.data),
  });

  const approve = useMutation({
    mutationFn: (id: number) => api.put(`/api/v1/admin/jobs/${id}/approve`),
    onSuccess: () => { toast.success("Job approved"); queryClient.invalidateQueries({ queryKey: ["admin-pending-jobs"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Pending Job Approvals</h1>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {(!jobs || jobs.length === 0) && !isLoading && <p className="text-muted-foreground">No pending jobs.</p>}
      {jobs?.map(job => (
        <PendingJobCard key={job.id} job={job} onApprove={() => approve.mutate(job.id)} queryClient={queryClient} />
      ))}
    </div>
  );
};

const PendingJobCard = ({ job, onApprove, queryClient }: { job: JobPostResponse; onApprove: () => void; queryClient: any }) => {
  const [reason, setReason] = useState("");

  const reject = useMutation({
    mutationFn: () => api.put(`/api/v1/admin/jobs/${job.id}/reject`, { rejectionReason: reason }),
    onSuccess: () => { toast.success("Job rejected"); queryClient.invalidateQueries({ queryKey: ["admin-pending-jobs"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{job.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{job.companyName} · {job.location} · {job.jobType}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">{job.description}</p>
        <p className="text-sm text-muted-foreground">Salary: {job.salaryMin?.toLocaleString()} - {job.salaryMax?.toLocaleString()}</p>
        <div className="flex items-end gap-2">
          <Button size="sm" onClick={onApprove}><Check className="w-4 h-4 mr-1" />Approve</Button>
          <Input placeholder="Rejection reason" value={reason} onChange={e => setReason(e.target.value)} className="max-w-xs" />
          <Button size="sm" variant="destructive" onClick={() => reject.mutate()} disabled={!reason}>
            <X className="w-4 h-4 mr-1" />Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPendingJobsPage;
