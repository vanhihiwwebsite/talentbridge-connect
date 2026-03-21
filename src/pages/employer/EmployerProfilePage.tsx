import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ApiResponse, EmployerProfileResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const EmployerProfilePage = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["employer-profile"],
    queryFn: () => api.get<ApiResponse<EmployerProfileResponse>>("/api/v1/employers/profile").then(r => r.data.data),
  });

  const [form, setForm] = useState({
    companyName: "", website: "", description: "", industry: "", companySize: "", address: "",
  });

  const updateProfile = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      return api.put("/api/v1/employers/profile", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => { toast.success("Profile updated"); setEditing(false); queryClient.invalidateQueries({ queryKey: ["employer-profile"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Company Profile</CardTitle>
            <Button variant="outline" size="sm" onClick={() => {
              if (profile) setForm({
                companyName: profile.companyName || "", website: profile.website || "",
                description: profile.description || "", industry: profile.industry || "",
                companySize: profile.companySize || "", address: profile.address || "",
              });
              setEditing(true);
            }}>Edit</Button>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={e => { e.preventDefault(); updateProfile.mutate(); }} className="space-y-3">
              <div><Label>Company Name</Label><Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} /></div>
              <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} /></div>
              <div><Label>Industry</Label><Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} /></div>
              <div><Label>Company Size</Label><Input value={form.companySize} onChange={e => setForm(f => ({ ...f, companySize: e.target.value }))} /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateProfile.isPending}>Save</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <p><strong>Company:</strong> {profile?.companyName || "—"}</p>
              <p><strong>Email:</strong> {profile?.email || "—"}</p>
              <p><strong>Website:</strong> {profile?.website || "—"}</p>
              <p><strong>Industry:</strong> {profile?.industry || "—"}</p>
              <p><strong>Size:</strong> {profile?.companySize || "—"}</p>
              <p><strong>Address:</strong> {profile?.address || "—"}</p>
              <p><strong>Description:</strong> {profile?.description || "—"}</p>
              <p><strong>Followers:</strong> {profile?.followerCount || 0}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployerProfilePage;
