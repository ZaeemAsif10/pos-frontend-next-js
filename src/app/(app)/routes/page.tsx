"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IconRoute,
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconMapPin,
  IconUserCheck,
  IconCalendarEvent,
  IconUsers,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/auth-context";
import { useAppEventListener } from "@/lib/events";
import {
  partyService,
  type DeliveryAreaItem,
} from "@/services/party.service";
import { teamService, type StaffMember } from "@/services/team.service";

export default function DeliveryAreasPage() {
  const { user, tenant } = useAuth();
  const userPerms = tenant?.permissions || [];
  const userRole = tenant?.role_name || "";
  const isOwnerOrAdmin =
    user?.is_superadmin ||
    userRole.toLowerCase() === "admin" ||
    userRole.toLowerCase() === "owner" ||
    userPerms.includes("*");

  const canCreate = isOwnerOrAdmin || userPerms.includes("delivery_areas:create");
  const canEdit = isOwnerOrAdmin || userPerms.includes("delivery_areas:edit");
  const canDelete = isOwnerOrAdmin || userPerms.includes("delivery_areas:delete");

  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<DeliveryAreaItem[]>([]);
  const [salesmen, setSalesmen] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryAreaItem | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Lahore");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [assignedSalesmanId, setAssignedSalesmanId] = useState<number | 0>(0);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deletingArea, setDeletingArea] = useState<DeliveryAreaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [areasData, staffData] = await Promise.all([
        partyService.listDeliveryAreas(),
        teamService.getStaffList().catch(() => ({ items: [] })),
      ]);
      setAreas(areasData || []);
      setSalesmen(staffData?.items || []);
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to load delivery areas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reactive UI: auto-refresh table when delivery areas change anywhere
  useAppEventListener("routes:changed", () => {
    loadData();
  });

  const openCreateModal = () => {
    setEditingArea(null);
    setCode(`R-${String(areas.length + 1).padStart(2, "0")}`);
    setName("");
    setCity("Lahore");
    setDeliveryDays("Mon, Wed, Fri");
    setAssignedSalesmanId(0);
    setDescription("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (area: DeliveryAreaItem) => {
    setEditingArea(area);
    setCode(area.code);
    setName(area.name);
    setCity(area.city);
    setDeliveryDays(area.delivery_days || "");
    setAssignedSalesmanId(area.assigned_salesman_id || 0);
    setDescription(area.description || "");
    setIsActive(area.is_active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a route / area name");
      return;
    }
    if (!code.trim()) {
      toast.error("Please enter a route code");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingArea) {
        await partyService.updateDeliveryArea(editingArea.id, {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          city: city.trim(),
          delivery_days: deliveryDays.trim() || null,
          assigned_salesman_id: assignedSalesmanId > 0 ? assignedSalesmanId : null,
          description: description.trim() || null,
          is_active: isActive,
        });
        toast.success(`Route '${name}' updated successfully`);
      } else {
        await partyService.createDeliveryArea({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          city: city.trim(),
          delivery_days: deliveryDays.trim() || null,
          assigned_salesman_id: assignedSalesmanId > 0 ? assignedSalesmanId : null,
          description: description.trim() || null,
          is_active: isActive,
        });
        toast.success(`Route '${name}' created successfully`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to save route");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingArea) return;
    try {
      setIsDeleting(true);
      const res = await partyService.deleteDeliveryArea(deletingArea.id);
      toast.success(res.message || "Route deleted successfully");
      setDeletingArea(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.detail || err?.message || "Failed to delete route");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAreas = areas.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase()) ||
      (a.assigned_salesman_name &&
        a.assigned_salesman_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && a.is_active) ||
      (statusFilter === "inactive" && !a.is_active);

    return matchesSearch && matchesStatus;
  });

  const paginatedAreas = filteredAreas.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Delivery Areas & Sectors</h1>
            <Badge variant="outline" className="text-xs">
              {areas.length} Total Routes
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage geographic delivery routes, order booking beats, and assigned salesmen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canCreate && (
            <Button size="sm" onClick={openCreateModal} className="h-9 gap-1.5">
              <IconPlus className="h-4 w-4" />
              Add Delivery Route
            </Button>
          )}
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <IconRoute className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{areas.length}</div>
            <p className="text-xs text-muted-foreground">Active distribution sectors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Salesmen</CardTitle>
            <IconUserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {areas.filter((a) => a.assigned_salesman_id).length}
            </div>
            <p className="text-xs text-muted-foreground">Routes with order bookers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Linked Customers</CardTitle>
            <IconUsers className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {areas.reduce((sum, a) => sum + (a.customer_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Mapped retail shops & buyers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Status</CardTitle>
            <IconCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {areas.filter((a) => a.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently operational routes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border/70 overflow-hidden shadow-sm">
        <div className="p-3.5 border-b bg-card/60 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-72 md:w-80">
              <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search routes or salesmen..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val: any) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>{filteredAreas.length} Routes Found</span>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Route Code</TableHead>
                <TableHead>Route / Area Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Delivery Schedule</TableHead>
                <TableHead>Assigned Salesman</TableHead>
                <TableHead className="text-center">Customers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <IconRefresh className="h-6 w-6 animate-spin text-primary" />
                      <span>Loading delivery routes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAreas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <IconRoute className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium">No delivery areas found</p>
                      <p className="text-xs">
                        {search
                          ? "Try adjusting your search criteria"
                          : "Create your first delivery beat to organize distribution"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAreas.map((area) => (
                  <TableRow key={area.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-semibold">
                      {area.code}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{area.name}</div>
                      {area.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {area.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <IconMapPin className="h-3.5 w-3.5" />
                        <span>{area.city}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {area.delivery_days ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <IconCalendarEvent className="h-3.5 w-3.5 text-blue-500" />
                          <span>{area.delivery_days}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Daily</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {area.assigned_salesman_name ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-bold">
                            {area.assigned_salesman_name[0]?.toUpperCase()}
                          </div>
                          <span className="text-xs font-medium">
                            {area.assigned_salesman_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-xs">
                      <Badge variant="secondary" className="px-2 py-0.5">
                        {area.customer_count || 0} Shops
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={area.is_active ? "default" : "secondary"}
                        className={
                          area.is_active
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-0"
                            : ""
                        }
                      >
                        {area.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit && (
                            <DropdownMenuItem onClick={() => openEditModal(area)}>
                              <IconEdit className="mr-2 h-4 w-4" />
                              Edit Route
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingArea(area)}
                                className="text-destructive focus:text-destructive"
                              >
                                <IconTrash className="mr-2 h-4 w-4" />
                                Delete Route
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={filteredAreas.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingArea ? "Edit Delivery Route" : "Add Delivery Route"}
              </DialogTitle>
              <DialogDescription>
                Define market beats, geographic areas, and assign responsible salesmen.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs font-semibold">
                    Route Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. R-01"
                    className="font-mono uppercase"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Route / Sector Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shah Alam Market / Sector B"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="deliveryDays" className="text-xs font-semibold">
                    Delivery Days
                  </Label>
                  <Input
                    id="deliveryDays"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                    placeholder="e.g. Mon, Wed, Fri"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salesman" className="text-xs font-semibold">
                    Assigned Salesman
                  </Label>
                  <Select
                    value={String(assignedSalesmanId)}
                    onValueChange={(val) => setAssignedSalesmanId(Number(val))}
                  >
                    <SelectTrigger id="salesman">
                      <SelectValue placeholder="Select Salesman" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Unassigned</SelectItem>
                      {salesmen.map((s) => (
                        <SelectItem key={s.id} value={String(s.user_id)}>
                          {s.full_name} ({s.role_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold">
                  Description / Boundaries
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Covers Circular Road to Rang Mahal"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Operational Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive routes will not accept new order dispatches.
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? editingArea
                    ? "Saving Changes..."
                    : "Creating..."
                  : editingArea
                  ? "Save Changes"
                  : "Create Route"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deletingArea)}
        onOpenChange={(open) => !open && setDeletingArea(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="h-5 w-5" />
              Delete Delivery Route
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Are you sure you want to delete route{" "}
                  <strong className="text-foreground">
                    &quot;{deletingArea?.name}&quot;
                  </strong>{" "}
                  ({deletingArea?.code})?
                </p>
                {deletingArea?.customer_count && deletingArea.customer_count > 0 ? (
                  <p className="text-destructive font-medium">
                    Warning: There are {deletingArea.customer_count} customers assigned to this
                    route. The system will prevent deletion until they are reassigned.
                  </p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Deleting..." : "Delete Route"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
