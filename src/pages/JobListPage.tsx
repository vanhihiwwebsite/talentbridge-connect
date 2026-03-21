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
import { MapPin, DollarSign, Clock, Search, Briefcase, Send } from "lucide-react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";

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
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Browse Jobs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Find your next opportunity</p>
          </div>
          <div className="relative sm:ml-auto w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, skills, companies..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-10 w-full sm:w-80"
            />
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!isLoading && data?.empty && (
          <EmptyState
            icon={<Briefcase className="w-8 h-8 text-primary" />}
            title="No jobs found"
            description="Try adjusting your search terms or check back later for new opportunities."
          />
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.content?.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <JobCard job={job} canApply={role === "CANDIDATE"} />
            </motion.div>
          ))}
        </div>

        {data && !data.empty && (
          <div className="flex items-center gap-3 justify-center pt-2">
            <Button variant="outline" size="sm" disabled={data.first} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground font-medium">
              Page {data.number + 1} of {data.totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={data.last} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </PageTransition>
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
    <Card className="group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">{job.title}</CardTitle>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">{job.companyName}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs font-medium">{job.jobType}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />{job.location}
          </span>
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            {job.salaryMin?.toLocaleString()} – {job.salaryMax?.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />{job.experienceLevel}
        </div>
        {job.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 4).map(s => (
              <Badge key={s.skillName} variant="outline" className="text-xs font-normal bg-accent/50">
                {s.displayName || s.skillName}
              </Badge>
            ))}
            {job.skills.length > 4 && (
              <Badge variant="outline" className="text-xs font-normal">+{job.skills.length - 4}</Badge>
            )}
          </div>
        )}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{job.description}</p>
        {canApply && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full mt-1 font-medium shadow-soft group/btn">
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Apply Now
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Apply to {job.title}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                applyMutation.mutate({ jobPostId: job.id, cvUrlAtTime: "", coverLetter });
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Cover Letter</Label>
                  <Textarea
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    rows={5}
                    placeholder="Tell the employer why you're a great fit..."
                  />
                </div>
                {applyMutation.isError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{(applyMutation.error as any)?.response?.data?.message || "Error"}</p>
                  </div>
                )}
                <Button type="submit" disabled={applyMutation.isPending} className="w-full font-medium shadow-soft">
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
