import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ApiResponse, CandidateProfileResponse, CandidateSkillRequest, WorkExperienceRequest, EducationRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

const CandidateProfilePage = () => {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["candidate-profile"],
    queryFn: () => api.get<ApiResponse<CandidateProfileResponse>>("/api/v1/candidates/profile").then(r => r.data.data),
  });

  const [editProfile, setEditProfile] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", summary: "" });

  const updateProfile = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("fullName", form.fullName);
      fd.append("phone", form.phone);
      fd.append("address", form.address);
      fd.append("summary", form.summary);
      return api.put("/api/v1/candidates/profile", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => { toast.success("Profile updated"); setEditProfile(false); queryClient.invalidateQueries({ queryKey: ["candidate-profile"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (!profile) return <p className="text-muted-foreground">Profile not found. Please create your profile.</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profile</CardTitle>
            <Button variant="outline" size="sm" onClick={() => {
              setForm({ fullName: profile.fullName || "", phone: profile.phone || "", address: profile.address || "", summary: profile.summary || "" });
              setEditProfile(true);
            }}>Edit</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {editProfile ? (
            <form onSubmit={e => { e.preventDefault(); updateProfile.mutate(); }} className="space-y-3">
              <div><Label>Full Name</Label><Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div><Label>Summary</Label><Textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} /></div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateProfile.isPending}>Save</Button>
                <Button type="button" variant="outline" onClick={() => setEditProfile(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <>
              <p><strong>Name:</strong> {profile.fullName}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Phone:</strong> {profile.phone || "—"}</p>
              <p><strong>Address:</strong> {profile.address || "—"}</p>
              <p><strong>Summary:</strong> {profile.summary || "—"}</p>
            </>
          )}
        </CardContent>
      </Card>

      <SkillsSection skills={profile.skills} />
      <ExperienceSection experiences={profile.workExperiences} />
      <EducationSection educations={profile.educations} />
    </div>
  );
};

const SkillsSection = ({ skills }: { skills: any[] }) => {
  const queryClient = useQueryClient();
  const [skillName, setSkillName] = useState("");
  const [level, setLevel] = useState("BEGINNER");

  const addSkill = useMutation({
    mutationFn: (data: CandidateSkillRequest) => api.post("/api/v1/candidates/skills", data),
    onSuccess: () => { toast.success("Skill added"); setSkillName(""); queryClient.invalidateQueries({ queryKey: ["candidate-profile"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  const deleteSkill = useMutation({
    mutationFn: (name: string) => api.delete(`/api/v1/candidates/skills/${name}`),
    onSuccess: () => { toast.success("Skill removed"); queryClient.invalidateQueries({ queryKey: ["candidate-profile"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {skills?.map(s => (
            <Badge key={s.skillName} variant="secondary" className="gap-1">
              {s.displayName || s.skillName} ({s.level})
              <button onClick={() => deleteSkill.mutate(s.skillName)}><Trash2 className="w-3 h-3" /></button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1"><Label>Skill Name</Label><Input value={skillName} onChange={e => setSkillName(e.target.value)} placeholder="e.g. React" /></div>
          <div><Label>Level</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={level} onChange={e => setLevel(e.target.value)}>
              <option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option><option value="EXPERT">Expert</option>
            </select>
          </div>
          <Button onClick={() => addSkill.mutate({ skillName, level })} disabled={!skillName}><Plus className="w-4 h-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ExperienceSection = ({ experiences }: { experiences: any[] }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<WorkExperienceRequest>({ company: "", position: "", startDate: "", endDate: "", description: "", currentlyWorking: false });

  const addExp = useMutation({
    mutationFn: (data: WorkExperienceRequest) => api.post("/api/v1/candidates/experience", data),
    onSuccess: () => { toast.success("Experience added"); setOpen(false); queryClient.invalidateQueries({ queryKey: ["candidate-profile"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  const deleteExp = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/candidates/experience/${id}`),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["candidate-profile"] }); },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Work Experience</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Experience</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); addExp.mutate(form); }} className="space-y-3">
                <div><Label>Company</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required /></div>
                <div><Label>Position</Label><Input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} required /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required /></div>
                  <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} disabled={form.currentlyWorking} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.currentlyWorking} onChange={e => setForm(f => ({ ...f, currentlyWorking: e.target.checked }))} />
                  <Label>Currently working here</Label>
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <Button type="submit" disabled={addExp.isPending}>Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {experiences?.map(exp => (
          <div key={exp.id} className="border border-border rounded p-3">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{exp.position} at {exp.company}</p>
                <p className="text-sm text-muted-foreground">{exp.startDate} – {exp.currentlyWorking ? "Present" : exp.endDate}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => deleteExp.mutate(exp.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
            {exp.description && <p className="text-sm mt-1">{exp.description}</p>}
          </div>
        ))}
        {(!experiences || experiences.length === 0) && <p className="text-sm text-muted-foreground">No experience added.</p>}
      </CardContent>
    </Card>
  );
};

const EducationSection = ({ educations }: { educations: any[] }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EducationRequest>({ school: "", major: "", degree: "", startDate: "", endDate: "", description: "" });

  const addEdu = useMutation({
    mutationFn: (data: EducationRequest) => api.post("/api/v1/candidates/education", data),
    onSuccess: () => { toast.success("Education added"); setOpen(false); queryClient.invalidateQueries({ queryKey: ["candidate-profile"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  const deleteEdu = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/candidates/education/${id}`),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["candidate-profile"] }); },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Education</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Education</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); addEdu.mutate(form); }} className="space-y-3">
                <div><Label>School</Label><Input value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} required /></div>
                <div><Label>Major</Label><Input value={form.major} onChange={e => setForm(f => ({ ...f, major: e.target.value }))} required /></div>
                <div><Label>Degree</Label><Input value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} required /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required /></div>
                  <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <Button type="submit" disabled={addEdu.isPending}>Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {educations?.map(edu => (
          <div key={edu.id} className="border border-border rounded p-3">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{edu.degree} in {edu.major}</p>
                <p className="text-sm text-muted-foreground">{edu.school} · {edu.startDate} – {edu.endDate || "Present"}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => deleteEdu.mutate(edu.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {(!educations || educations.length === 0) && <p className="text-sm text-muted-foreground">No education added.</p>}
      </CardContent>
    </Card>
  );
};

export default CandidateProfilePage;
