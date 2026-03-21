import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ApiResponse, NotificationResponse } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Trash2 } from "lucide-react";

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<ApiResponse<NotificationResponse[]>>("/api/v1/notifications").then(r => r.data.data),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put("/api/v1/notifications/read-all"),
    onSuccess: () => { toast.success("All marked as read"); queryClient.invalidateQueries({ queryKey: ["notifications"] }); },
  });

  const markRead = useMutation({
    mutationFn: (id: number) => api.put(`/api/v1/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
          <Check className="w-4 h-4 mr-1" />Mark all read
        </Button>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {(!data || data.length === 0) && !isLoading && <p className="text-muted-foreground">No notifications.</p>}
      {data?.map(n => (
        <Card key={n.id} className={n.isRead ? "opacity-60" : ""}>
          <CardContent className="flex items-start justify-between py-3">
            <div>
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.content}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-1">
              {!n.isRead && <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}><Check className="w-4 h-4" /></Button>}
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(n.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NotificationsPage;
