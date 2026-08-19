"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  ArrowRight,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  apiGetAllUsers,
  apiGetUsersByRoleAndStatus,
  apiUpdateUserStatus,
  apiDeleteUser,
  apiGetDengueCaseSummary,
} from "@/lib/api";
import { WeeklyCasesUploadCard } from "@/components/dashboard/weekly-cases-upload";
import { DengueCaseKpis } from "@/components/dashboard/dengue-case-kpis";
import type {
  UserResponseDTO,
  PaginatedDTO,
  UserStatus,
  DengueCaseSummaryDTO,
} from "@/lib/types";

type FilterMode = "all" | "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status: UserStatus }) {
  switch (status) {
    case "APPROVED":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25">
          Approved
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25">
          Pending
        </Badge>
      );
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "ADMIN":
      return (
        <Badge variant="secondary" className="bg-purple-500/15 text-purple-600 dark:text-purple-400">
          Admin
        </Badge>
      );
    case "PHI":
      return (
        <Badge variant="secondary" className="bg-blue-500/15 text-blue-600 dark:text-blue-400">
          PHI
        </Badge>
      );
    case "MOH":
      return (
        <Badge variant="secondary" className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
          MOH
        </Badge>
      );
    case "EPIDEMIOLOGIST":
      return (
        <Badge variant="secondary" className="bg-teal-500/15 text-teal-600 dark:text-teal-400">
          Epidemiologist
        </Badge>
      );
    case "VOLUNTEER":
      return (
        <Badge variant="secondary" className="bg-gray-500/15 text-gray-600 dark:text-gray-400">
          Volunteer
        </Badge>
      );
    default:
      return <Badge variant="secondary">{role}</Badge>;
  }
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [caseSummary, setCaseSummary] = useState<DengueCaseSummaryDTO | null>(
    null,
  );
  const [caseSummaryLoading, setCaseSummaryLoading] = useState(true);

  const pageSize = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let data: PaginatedDTO;
      if (filter === "all") {
        data = await apiGetAllUsers(page, pageSize);
      } else {
        const statusMap: Record<string, string> = {
          pending: "PENDING",
          approved: "APPROVED",
          rejected: "REJECTED",
        };
        data = await apiGetUsersByRoleAndStatus(
          "PHI",
          statusMap[filter],
          page,
          pageSize,
        );
      }
      setUsers(data.content as UserResponseDTO[]);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (err) {
      toast.error("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    let cancelled = false;
    setCaseSummaryLoading(true);
    apiGetDengueCaseSummary()
      .then((data) => {
        if (!cancelled) setCaseSummary(data);
      })
      .catch(() => {
        if (!cancelled) setCaseSummary(null);
      })
      .finally(() => {
        if (!cancelled) setCaseSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStatusChange = async (
    userId: number,
    newStatus: string,
    userName: string,
  ) => {
    setActionLoading(userId);
    try {
      await apiUpdateUserStatus(userId, newStatus);
      toast.success(
        `${userName} has been ${newStatus.toLowerCase()}`,
      );
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update user status");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: number, userName: string) => {
    setActionLoading(userId);
    try {
      await apiDeleteUser(userId);
      toast.success(`${userName} has been removed`);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = filter === "pending" ? totalItems : 0;

  const stats = [
    {
      label: "Total Users",
      value: filter === "all" ? totalItems : "-",
      icon: Users,
      tone: "primary" as const,
    },
    {
      label: "Pending Approval",
      value: pendingCount || "-",
      icon: Clock,
      tone: "muted" as const,
    },
    {
      label: "Active PHIs",
      value: "-",
      icon: UserCheck,
      tone: "primary" as const,
    },
    {
      label: "System Security",
      value: "Active",
      icon: Shield,
      tone: "primary" as const,
    },
  ];

  return (
    <DashboardShell title="Admin Panel">
      <DengueCaseKpis summary={caseSummary} loading={caseSummaryLoading} />
      <div className="mt-2 flex justify-end">
        <Button variant="ghost" size="sm" className="gap-1.5" asChild>
          <Link href="/dashboard/cases">
            View weekly cases
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <div
                className={
                  s.tone === "primary"
                    ? "flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"
                    : "flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground"
                }
              >
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {s.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <WeeklyCasesUploadCard
        onImported={() => {
          setCaseSummaryLoading(true);
          apiGetDengueCaseSummary()
            .then(setCaseSummary)
            .catch(() => setCaseSummary(null))
            .finally(() => setCaseSummaryLoading(false));
        }}
      />

      {/* User Management Table */}
      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage PHI registrations and user access
            </CardDescription>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Select
              value={filter}
              onValueChange={(val) => {
                setFilter(val as FilterMode);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="pending">Pending PHI</SelectItem>
                <SelectItem value="approved">Approved PHI</SelectItem>
                <SelectItem value="rejected">Rejected PHI</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading users...
              </span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <UserX className="h-10 w-10 mb-2" />
              <p className="text-sm">No users found for this filter</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.fname} {u.lname}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.districtName ?? "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={u.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {u.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="gap-1"
                                disabled={actionLoading === u.id}
                                onClick={() =>
                                  handleStatusChange(
                                    u.id,
                                    "APPROVED",
                                    `${u.fname} ${u.lname}`,
                                  )
                                }
                              >
                                {actionLoading === u.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1"
                                disabled={actionLoading === u.id}
                                onClick={() =>
                                  handleStatusChange(
                                    u.id,
                                    "REJECTED",
                                    `${u.fname} ${u.lname}`,
                                  )
                                }
                              >
                                <XCircle className="h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          )}

                          {u.status === "APPROVED" && u.role !== "ADMIN" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              disabled={actionLoading === u.id}
                              onClick={() =>
                                handleStatusChange(
                                  u.id,
                                  "UNAVAILABLE",
                                  `${u.fname} ${u.lname}`,
                                )
                              }
                            >
                              <UserX className="h-3 w-3" />
                              Disable
                            </Button>
                          )}

                          {u.status === "REJECTED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              disabled={actionLoading === u.id}
                              onClick={() =>
                                handleStatusChange(
                                  u.id,
                                  "APPROVED",
                                  `${u.fname} ${u.lname}`,
                                )
                              }
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Approve
                            </Button>
                          )}

                          {u.status === "UNAVAILABLE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              disabled={actionLoading === u.id}
                              onClick={() =>
                                handleStatusChange(
                                  u.id,
                                  "APPROVED",
                                  `${u.fname} ${u.lname}`,
                                )
                              }
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Re-enable
                            </Button>
                          )}

                          {u.role !== "ADMIN" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  disabled={actionLoading === u.id}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete User
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete{" "}
                                    <strong>
                                      {u.fname} {u.lname}
                                    </strong>
                                    ? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() =>
                                      handleDelete(
                                        u.id,
                                        `${u.fname} ${u.lname}`,
                                      )
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * pageSize + 1}-
                    {Math.min((page + 1) * pageSize, totalItems)} of{" "}
                    {totalItems} users
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm text-muted-foreground">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
