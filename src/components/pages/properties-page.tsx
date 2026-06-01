"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Home,
  Wrench,
  Coins,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Zap,
  Plus,
  Pencil,
  Trash2,
  Search,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { getIntlTag } from "@/lib/intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ──────────────────────────────────────────────────────────
interface Property {
  id: string;
  title: string;
  location: string;
  category: string;
  area: string;
  status: string;
  revenue: number;
  energyClass: string;
  bedrooms: number;
  bathrooms: number;
  occupants: number;
  imageClass: string;
  dateFrom: string;
  dateTo: string;
  createdAt: string;
}

interface PropertiesResponse {
  properties: Property[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasPrevious: boolean;
  hasNext: boolean;
  totalProperties: number;
  occupiedCount: number;
  maintenanceCount: number;
  estimatedRevenue: number;
  occupancyRate: number;
}

type StatusFilter = "all" | "Occupied" | "Vacant" | "Maintenance";
type CategoryFilter = "all" | "Residential" | "Apartment" | "Commercial";

interface PropertyFormData {
  title: string;
  location: string;
  category: string;
  area: string;
  status: string;
  revenue: number;
  energyClass: string;
  bedrooms: number;
  bathrooms: number;
  occupants: number;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FORM: PropertyFormData = {
  title: "",
  location: "",
  category: "Residential",
  area: "",
  status: "Vacant",
  revenue: 0,
  energyClass: "A",
  bedrooms: 0,
  bathrooms: 0,
  occupants: 0,
  dateFrom: "",
  dateTo: "",
};

// ─── Constants ──────────────────────────────────────────────────────
const IMAGE_CLASS_GRADIENTS: Record<string, string> = {
  santorini: "from-blue-500 to-sky-400",
  loft: "from-amber-500 to-orange-400",
  cabin: "from-emerald-500 to-green-400",
  modern: "from-slate-500 to-gray-400",
  apartment: "from-teal-500 to-cyan-400",
};

const STATUS_STYLES: Record<string, string> = {
  Occupied:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  Vacant:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent",
  Maintenance:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-transparent",
};

const ENERGY_CLASSES = ["A+", "A", "B+", "B", "C", "D", "E"];
const CATEGORIES = ["Residential", "Apartment", "Commercial"];
const STATUSES = ["Occupied", "Vacant", "Maintenance"];

// ─── Helpers ────────────────────────────────────────────────────────

function getGradient(imageClass: string): string {
  return IMAGE_CLASS_GRADIENTS[imageClass] ?? "from-emerald-500 to-teal-400";
}

function getStatusStyle(status: string): string {
  return STATUS_STYLES[status] ?? "";
}

// ─── Stat Card ──────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  loading,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-4 pt-0">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            iconBg
          )}
        >
          <Icon className={cn("size-5", iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-8 w-28" />
          ) : (
            <p className="mt-0.5 text-2xl font-bold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Property Card ──────────────────────────────────────────────────
interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
  formatCurrency: (value: number) => string;
  formatDateRange: (from: string, to: string) => string;
}

function PropertyCard({
  property,
  onEdit,
  onDelete,
  formatCurrency,
  formatDateRange,
}: PropertyCardProps) {
  const t = useTranslations("properties");
  const tc = useTranslations("common");
  const statusLabel = (s: string) => {
    if (s === "Occupied") return t("statusLabels.Occupied");
    if (s === "Vacant") return t("statusLabels.Vacant");
    if (s === "Maintenance") return t("statusLabels.Maintenance");
    return s;
  };
  return (
    <Card className="group relative overflow-hidden py-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      {/* Colored gradient banner */}
      <div
        className={cn(
          "h-32 bg-gradient-to-br",
          getGradient(property.imageClass)
        )}
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 h-32 opacity-20">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/20" />
          <div className="absolute -bottom-4 left-4 size-20 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Status badge */}
      <div className="absolute top-3 right-3">
        <Badge
          variant="secondary"
          className={cn(
            "rounded-md text-xs font-medium shadow-sm",
            getStatusStyle(property.status)
          )}
        >
          {statusLabel(property.status)}
        </Badge>
      </div>

      <CardContent className="space-y-4 p-5">
        {/* Title & Location */}
        <div>
          <h3 className="text-lg font-bold leading-tight">{property.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {property.location}
          </p>
        </div>

        {/* Key stats row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BedDouble className="size-3.5" />
            {property.bedrooms}{" "}
            {property.bedrooms === 1 ? t("bed") : t("beds")}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-3.5" />
            {property.bathrooms}{" "}
            {property.bathrooms === 1 ? t("bath") : t("baths")}
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="size-3.5" />
            {property.area}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="size-3.5" />
            {property.energyClass}
          </span>
        </div>

        {/* Revenue */}
        <div className="flex items-center gap-1.5">
          <Coins className="size-4 text-emerald-500" />
          <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(property.revenue)}
          </span>
          <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
        </div>

        {/* Date range */}
        {property.dateFrom && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {formatDateRange(property.dateFrom, property.dateTo)}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-lg"
            onClick={() => onEdit(property)}
          >
            <Pencil className="size-3.5" />
            {tc("edit")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            onClick={() => onDelete(property)}
          >
            <Trash2 className="size-3.5" />
            {tc("delete")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────
function PropertiesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats row skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-start gap-4 pt-0">
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="ml-auto h-9 w-36" />
      </div>

      {/* Cards grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden py-0">
            <Skeleton className="h-32 w-full" />
            <div className="space-y-3 p-5">
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-40" />
              <div className="flex gap-2 border-t pt-3">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useTranslations("properties");
  return (
    <Card className="py-16">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Building2 className="size-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold">{t("emptyTitle")}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("emptyDesc")}
        </p>
        <Button
          className="mt-6 rounded-lg bg-emerald-600 hover:bg-emerald-700"
          onClick={onAdd}
        >
          <Plus className="size-4" />
          {t("emptyCta")}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Property Form Dialog ──────────────────────────────────────────
interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProperty: Property | null;
  onSubmit: (data: PropertyFormData) => Promise<void>;
}

function PropertyFormDialog({
  open,
  onOpenChange,
  editingProperty,
  onSubmit,
}: PropertyFormDialogProps) {
  const t = useTranslations("properties");
  const tc = useTranslations("common");
  const [form, setForm] = useState<PropertyFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingProperty) {
        setForm({
          title: editingProperty.title,
          location: editingProperty.location,
          category: editingProperty.category,
          area: editingProperty.area,
          status: editingProperty.status,
          revenue: editingProperty.revenue,
          energyClass: editingProperty.energyClass,
          bedrooms: editingProperty.bedrooms,
          bathrooms: editingProperty.bathrooms,
          occupants: editingProperty.occupants,
          dateFrom: editingProperty.dateFrom,
          dateTo: editingProperty.dateTo,
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, editingProperty]);

  const updateField = <K extends keyof PropertyFormData>(
    key: K,
    value: PropertyFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.location.trim()) {
      toast.error(t("toastRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingProperty ? t("dialogEditTitle") : t("dialogAddTitle")}
          </DialogTitle>
          <DialogDescription>
            {editingProperty ? t("dialogEditDesc") : t("dialogAddDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="prop-title">
              {t("labelTitle")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="prop-title"
              placeholder={t("placeholderTitle")}
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="prop-location">
              {t("labelLocation")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="prop-location"
              placeholder={t("placeholderLocation")}
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              required
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{tc("category")}</Label>
              <Select
                value={form.category}
                onValueChange={(v) => updateField("category", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`categoryLabels.${c}` as "categoryLabels.Residential")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("filterStatus")}</Label>
              <Select
                value={form.status}
                onValueChange={(v) => updateField("status", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`statusLabels.${s}` as "statusLabels.Occupied")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Area */}
          <div className="space-y-2">
            <Label htmlFor="prop-area">{t("labelArea")}</Label>
            <Input
              id="prop-area"
              placeholder={t("placeholderArea")}
              value={form.area}
              onChange={(e) => updateField("area", e.target.value)}
            />
          </div>

          {/* Revenue & Energy Class */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prop-revenue">{t("labelRevenue")}</Label>
              <Input
                id="prop-revenue"
                type="number"
                min={0}
                placeholder="0"
                value={form.revenue || ""}
                onChange={(e) =>
                  updateField("revenue", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("labelEnergyClass")}</Label>
              <Select
                value={form.energyClass}
                onValueChange={(v) => updateField("energyClass", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENERGY_CLASSES.map((ec) => (
                    <SelectItem key={ec} value={ec}>
                      {ec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bedrooms, Bathrooms, Occupants */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prop-bedrooms">{t("labelBedrooms")}</Label>
              <Input
                id="prop-bedrooms"
                type="number"
                min={0}
                placeholder="0"
                value={form.bedrooms || ""}
                onChange={(e) =>
                  updateField("bedrooms", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prop-bathrooms">{t("labelBathrooms")}</Label>
              <Input
                id="prop-bathrooms"
                type="number"
                min={0}
                placeholder="0"
                value={form.bathrooms || ""}
                onChange={(e) =>
                  updateField("bathrooms", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prop-occupants">{t("labelOccupants")}</Label>
              <Input
                id="prop-occupants"
                type="number"
                min={0}
                placeholder="0"
                value={form.occupants || ""}
                onChange={(e) =>
                  updateField("occupants", Number(e.target.value) || 0)
                }
              />
            </div>
          </div>

          {/* Date From & Date To */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prop-dateFrom">{t("labelDateFrom")}</Label>
              <Input
                id="prop-dateFrom"
                type="date"
                value={form.dateFrom}
                onChange={(e) => updateField("dateFrom", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prop-dateTo">{t("labelDateTo")}</Label>
              <Input
                id="prop-dateTo"
                type="date"
                value={form.dateTo}
                onChange={(e) => updateField("dateTo", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={submitting}
            >
              {submitting
                ? tc("saving")
                : editingProperty
                  ? t("saveChanges")
                  : t("addProperty")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation Dialog ─────────────────────────────────────
interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  onConfirm: () => Promise<void>;
}

function DeleteDialog({
  open,
  onOpenChange,
  property,
  onConfirm,
}: DeleteDialogProps) {
  const t = useTranslations("properties");
  const tc = useTranslations("common");
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteConfirm", { title: property?.title ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? tc("deleting") : tc("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Properties Page ──────────────────────────────────────────
export function PropertiesPage() {
  const t = useTranslations("properties");
  const tc = useTranslations("common");
  const locale = useLocale();
  const intlTag = getIntlTag(locale);

  const formatCurrency = useCallback(
    (value: number) =>
      value.toLocaleString(intlTag, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    [intlTag]
  );

  const formatDateRange = useCallback(
    (from: string, to: string): string => {
      const fmt = (d: string) => {
        if (!d) return "";
        const date = new Date(d + "T00:00:00");
        return date.toLocaleDateString(intlTag, {
          month: "short",
          year: "numeric",
        });
      };
      if (from && to) return `${fmt(from)} – ${fmt(to)}`;
      if (from) return fmt(from);
      return "";
    },
    [intlTag]
  );

  // Data state
  const [data, setData] = useState<PropertiesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [page, setPage] = useState(0);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(
    null
  );

  // ── Data Fetching ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: "6",
      });
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (!res.ok) throw new Error(t("loadFailed"));
      const json: PropertiesResponse = await res.json();
      setData(json);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("loadFailed")
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, page, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, categoryFilter]);

  // ── CRUD Handlers ──────────────────────────────────────────────
  const handleAdd = () => {
    setEditingProperty(null);
    setFormOpen(true);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormOpen(true);
  };

  const handleDeleteClick = (property: Property) => {
    setDeletingProperty(property);
    setDeleteOpen(true);
  };

  const handleSubmit = async (formData: PropertyFormData) => {
    try {
      if (editingProperty) {
        // Edit
        const res = await fetch("/api/properties", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingProperty.id, ...formData }),
        });
        if (!res.ok) throw new Error(t("updateFail"));
        toast.success(t("toastUpdated"));
      } else {
        // Add
        const res = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error(t("addFail"));
        toast.success(t("toastAdded"));
      }
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : tc("unexpectedError")
      );
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deletingProperty) return;
    try {
      const res = await fetch(
        `/api/properties?id=${deletingProperty.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(t("deleteFail"));
      toast.success(t("toastDeleted"));
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("deleteFail"));
      throw err;
    }
  };

  // ── Derived ────────────────────────────────────────────────────
  const hasData = !loading && data !== null;
  const hasProperties = hasData && data.properties.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Stats Overview ───────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("statTotal")}
          value={data?.totalProperties?.toLocaleString() ?? "0"}
          icon={Building2}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
          loading={loading}
        />
        <StatCard
          title={t("statOccupied")}
          value={data?.occupiedCount?.toLocaleString() ?? "0"}
          icon={Home}
          iconBg="bg-green-500/10"
          iconColor="text-green-500"
          loading={loading}
        />
        <StatCard
          title={t("statMaintenance")}
          value={data?.maintenanceCount?.toLocaleString() ?? "0"}
          icon={Wrench}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-500"
          loading={loading}
        />
        <StatCard
          title={t("statRevenue")}
          value={data ? formatCurrency(data.estimatedRevenue) : "€0"}
          icon={Coins}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
          loading={loading}
        />
      </div>

      {/* ── Loading Skeleton ─────────────────────────────────────── */}
      {loading && <PropertiesSkeleton />}

      {/* ── Empty State (no search, first load with no data) ────── */}
      {hasData && !hasProperties && !search && statusFilter === "all" && categoryFilter === "all" && (
        <EmptyState onAdd={handleAdd} />
      )}

      {/* ── No Results (active filters, no matches) ─────────────── */}
      {hasData && !hasProperties && (search || statusFilter !== "all" || categoryFilter !== "all") && (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
              <Search className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t("noMatchTitle")}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t("noMatchDesc")}
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-lg"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
            >
              {t("clearFilters")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Main Content ────────────────────────────────────────── */}
      {hasData && hasProperties && (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-lg"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[150px] rounded-lg">
                <SelectValue placeholder={t("filterStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="Occupied">
                  {t("statusLabels.Occupied")}
                </SelectItem>
                <SelectItem value="Vacant">{t("statusLabels.Vacant")}</SelectItem>
                <SelectItem value="Maintenance">
                  {t("statusLabels.Maintenance")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
            >
              <SelectTrigger className="w-[160px] rounded-lg">
                <SelectValue placeholder={t("filterCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCategories")}</SelectItem>
                <SelectItem value="Residential">
                  {t("categoryLabels.Residential")}
                </SelectItem>
                <SelectItem value="Apartment">
                  {t("categoryLabels.Apartment")}
                </SelectItem>
                <SelectItem value="Commercial">
                  {t("categoryLabels.Commercial")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              className="ml-auto rounded-lg bg-emerald-600 hover:bg-emerald-700"
              onClick={handleAdd}
            >
              <Plus className="size-4" />
              {t("addProperty")}
            </Button>
          </div>

          {/* Properties Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                formatCurrency={formatCurrency}
                formatDateRange={formatDateRange}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={!data.hasPrevious}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="size-4" />
                {t("previous")}
              </Button>

              <span className="text-sm text-muted-foreground">
                {t("pageOf", {
                  current: data.currentPage + 1,
                  total: data.totalPages,
                })}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={!data.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("next")}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Add Property button when properties exist but outside grid view ── */}
      {/* (Already shown in filter bar) */}

      {/* ── Form Dialog ──────────────────────────────────────────── */}
      <PropertyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingProperty={editingProperty}
        onSubmit={handleSubmit}
      />

      {/* ── Delete Dialog ────────────────────────────────────────── */}
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        property={deletingProperty}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default PropertiesPage;
