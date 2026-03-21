import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ApiResponse, CategoryResponse, CategoryRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const AdminCategoriesPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CategoryRequest>({ name: "", description: "" });

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get<ApiResponse<CategoryResponse[]>>("/api/v1/admin/categories").then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (data: CategoryRequest) => api.post("/api/v1/admin/categories", data),
    onSuccess: () => { toast.success("Category created"); setOpen(false); setForm({ name: "", description: "" }); queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/admin/categories/${id}`),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Error"),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Add Category</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); create.mutate(form); }} className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <Button type="submit" disabled={create.isPending}>Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {categories?.map(cat => (
        <Card key={cat.id}>
          <CardContent className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{cat.name}</p>
              <p className="text-sm text-muted-foreground">{cat.description}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove.mutate(cat.id)}><Trash2 className="w-4 h-4" /></Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminCategoriesPage;
