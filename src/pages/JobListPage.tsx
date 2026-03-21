import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ApiResponse, JobPostResponse, PageResponse, ApplicationRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MapPin, DollarSign, Clock } from "lucide-react";

const JobListPage = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const { role } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", page, search],
    queryFn: () =>
      api.get<ApiResponse<PageResponse<JobPostResponse>>>(
        search ? "/api/v1/jobs/search" : "/api/v1/jobs",
        { params: { page, size: 12, ...(search ? { keyword: search } : {}) } }
      ).then(r => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Browse Jobs</h1>
        <Input
          placeholder="Search jobs..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="max-w-xs"
        />
      </div>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.content?.map(job => (
          <JobCard key={job.id} job={job} canApply={role === "CANDIDATE"} />
        ))}
      </div>
      {data && !data.empty && (
        <div className="flex items-center gap-2 justify-center">
          <Button variant="outline" size="sm" disabled={data.first} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {data.number + 1} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={data.last} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
      {data?.empty && <p className="text-muted-foreground text-center">No jobs found.</p>}
    </div>
  );
};

const JobCard = ({ job, canApply }: { job: JobPostResponse; canApply: boolean }) => {
  const [open, setOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: (data: ApplicationRequest) => api.post("/api/v1/applications", data),
    onSuccess: () => {
      toast.success("Application submitted!");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to apply"),
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{job.title}</CardTitle>
          <Badge variant="secondary">{job.jobType}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{job.companyName}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salaryMin?.toLocaleString()} - {job.salaryMax?.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />{job.experienceLevel}
        </div>
        {job.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.skills.map(s => <Badge key={s.skillName} variant="outline" className="text-xs">{s.displayName || s.skillName}</Badge>)}
          </div>
        )}
        <p className="text-sm line-clamp-2">{job.description}</p>
        {canApply && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full mt-2">Apply</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Apply to {job.title}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                applyMutation.mutate({ jobPostId: job.id, cvUrlAtTime: "", coverLetter });
              }} className="space-y-4">
                <div><Label>Cover Letter</Label><Textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={5} /></div>
                {applyMutation.isError && <p className="text-sm text-destructive">{(applyMutation.error as any)?.response?.data?.message || "Error"}</p>}
                <Button type="submit" disabled={applyMutation.isPending} className="w-full">
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default JobListPage;
