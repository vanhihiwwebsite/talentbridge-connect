import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ApiResponse, JobPostResponse, JobPostRequest, CategoryResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const EmployerJobsPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["my-jobs"],
    queryFn: () => api.get<ApiResponse<JobPostResponse[]>>("/api/v1/jobs/my-jobs").then(r => r.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<ApiResponse<CategoryResponse[]>>("/api/v1/categories").then(r => r.data.data),
  });

  const [form, setForm] = useState<JobPostRequest>({
    title: "", description: "", salaryMin: 0, salaryMax: 0, location: "",
    jobType: "FULL_TIME", experienceLevel: "ENTRY", categoryId: 0, expiredAt: "", skills: [],
  });

  const createJob = useMutation({
    mutationFn: (data: JobPostRequest) => api.post("/api/v1/jobs", data),
    onSuccess: () => { toast.success("Job posted!"); setOpen(false); queryClient.invalidateQueries({ queryKey: ["my-jobs"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  const deleteJob = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/jobs/${id}`),
    onSuccess: () => { toast.success("Job closed"); queryClient.invalidateQueries({ queryKey: ["my-jobs"] }); },
  });

  const statusColor: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-800", PENDING: "bg-yellow-100 text-yellow-800",
    REJECTED: "bg-red-100 text-red-800", CLOSED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Job Posts</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Post Job</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Job Post</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); createJob.mutate(form); }} className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Min Salary</Label><Input type="number" value={form.salaryMin} onChange={e => setForm(f => ({ ...f, salaryMin: Number(e.target.value) }))} /></div>
                <div><Label>Max Salary</Label><Input type="number" value={form.salaryMax} onChange={e => setForm(f => ({ ...f, salaryMax: Number(e.target.value) }))} /></div>
              </div>
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Job Type</Label>
                  <Select value={form.jobType} onValueChange={v => setForm(f => ({ ...f, jobType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full Time</SelectItem>
                      <SelectItem value="PART_TIME">Part Time</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="INTERNSHIP">Internship</SelectItem>
                      <SelectItem value="REMOTE">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Experience</Label>
                  <Select value={form.experienceLevel} onValueChange={v => setForm(f => ({ ...f, experienceLevel: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENTRY">Entry</SelectItem>
                      <SelectItem value="JUNIOR">Junior</SelectItem>
                      <SelectItem value="MID">Mid</SelectItem>
                      <SelectItem value="SENIOR">Senior</SelectItem>
                      <SelectItem value="LEAD">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Category</Label>
                <Select value={String(form.categoryId)} onValueChange={v => setForm(f => ({ ...f, categoryId: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Expiry Date</Label><Input type="date" value={form.expiredAt} onChange={e => setForm(f => ({ ...f, expiredAt: e.target.value }))} required /></div>
              <Button type="submit" disabled={createJob.isPending} className="w-full">
                {createJob.isPending ? "Posting..." : "Post Job"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {jobs?.map(job => (
        <Card key={job.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{job.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={statusColor[job.status] || ""}>{job.status}</Badge>
                <Badge variant="outline">{job.applicationCount} applications</Badge>
                <Button size="sm" variant="ghost" onClick={() => deleteJob.mutate(job.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{job.location} · {job.jobType} · {job.experienceLevel}</p>
            {job.rejectionReason && <p className="text-sm text-destructive mt-1">Rejected: {job.rejectionReason}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EmployerJobsPage;
