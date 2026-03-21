import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ApiResponse, UserResponse, PageResponse } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const AdminUsersPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => api.get<ApiResponse<PageResponse<UserResponse>>>("/api/v1/admin/users", { params: { page, size: 20 } }).then(r => r.data.data),
  });

  const activate = useMutation({
    mutationFn: (id: number) => api.put(`/api/v1/admin/users/${id}/activate`),
    onSuccess: () => { toast.success("User activated"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
  });

  const deactivate = useMutation({
    mutationFn: (id: number) => api.put(`/api/v1/admin/users/${id}/deactivate`),
    onSuccess: () => { toast.success("User deactivated"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">User Management</h1>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead>
            <TableHead>Status</TableHead><TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.content?.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
              <TableCell><Badge variant={user.active ? "default" : "destructive"}>{user.active ? "Active" : "Inactive"}</Badge></TableCell>
              <TableCell>
                {user.active ? (
                  <Button size="sm" variant="destructive" onClick={() => deactivate.mutate(user.id)}>Deactivate</Button>
                ) : (
                  <Button size="sm" onClick={() => activate.mutate(user.id)}>Activate</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data && (
        <div className="flex items-center gap-2 justify-center">
          <Button variant="outline" size="sm" disabled={data.first} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {data.number + 1} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={data.last} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
