"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useBackendAuth } from "../hooks/useBackendAuth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Switch } from "../components/ui/switch";
import { Pencil, Trash2, Plus, Loader2, X } from "lucide-react";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const ADMIN_USER_ID = "cmiaglun10000s60endrcn5en";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
  trialDays: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    usages: number;
  };
}

interface PromoCodeUsage {
  id: string;
  usedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface PromoCodeWithUsages extends PromoCode {
  usages?: PromoCodeUsage[];
}

export default function PromoCodesPage() {
  const { data: session, status } = useBackendAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMaxUses, setEditingMaxUses] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [editingTrialDays, setEditingTrialDays] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [selectedPromoCode, setSelectedPromoCode] =
    useState<PromoCodeWithUsages | null>(null);
  const [isLoadingUsages, setIsLoadingUsages] = useState(false);
  const hasFetchedRef = useRef(false);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    maxUses: "",
    trialDays: "30",
    isActive: true,
  });

  // Check if user is admin
  const isAdmin = session?.user?.id === ADMIN_USER_ID;

  const fetchPromoCodes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/promo-codes");

      if (!response.ok) {
        if (response.status === 403) {
          setError(
            "Access denied. You don't have permission to view this page."
          );
        } else {
          setError("Failed to fetch promo codes");
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setPromoCodes(data.promoCodes || []);
    } catch (err) {
      console.error("Error fetching promo codes:", err);
      setError("An error occurred while fetching promo codes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      setError("Please sign in to access this page");
      setIsLoading(false);
      return;
    }

    if (session.user?.id !== ADMIN_USER_ID) {
      setError("Access denied. You don't have permission to view this page.");
      setIsLoading(false);
      return;
    }

    // Only fetch once
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPromoCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, status]);

  const handleCreate = async () => {
    if (!formData.code.trim()) {
      setError("Code is required");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch("/api/promo-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description || null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          trialDays: parseInt(formData.trialDays) || 30,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "Failed to create promo code");
        return;
      }

      setShowCreateForm(false);
      setFormData({
        code: "",
        description: "",
        maxUses: "",
        trialDays: "30",
        isActive: true,
      });
      await fetchPromoCodes();
    } catch (err) {
      console.error("Error creating promo code:", err);
      setError("An error occurred while creating the promo code");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<PromoCode>) => {
    try {
      setError(null);

      const response = await fetch(`/api/promo-codes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "Failed to update promo code");
        return;
      }

      await fetchPromoCodes();
    } catch (err) {
      console.error("Error updating promo code:", err);
      setError("An error occurred while updating the promo code");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/promo-codes/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "Failed to delete promo code");
        return;
      }

      await fetchPromoCodes();
    } catch (err) {
      console.error("Error deleting promo code:", err);
      setError("An error occurred while deleting the promo code");
    }
  };

  const handleToggleActive = async (promoCode: PromoCode) => {
    await handleUpdate(promoCode.id, { isActive: !promoCode.isActive });
  };

  const handleMaxUsesChange = (promoCode: PromoCode, value: string) => {
    setEditingMaxUses({ id: promoCode.id, value });
  };

  const handleMaxUsesSave = async (promoCode: PromoCode) => {
    if (!editingMaxUses || editingMaxUses.id !== promoCode.id) return;

    const maxUsesValue =
      editingMaxUses.value.trim() === ""
        ? null
        : parseInt(editingMaxUses.value, 10);

    if (
      editingMaxUses.value.trim() !== "" &&
      (isNaN(maxUsesValue!) || maxUsesValue! < 0)
    ) {
      setError("Max uses must be a positive number");
      setEditingMaxUses(null);
      return;
    }

    await handleUpdate(promoCode.id, { maxUses: maxUsesValue });
    setEditingMaxUses(null);
  };

  const handleMaxUsesCancel = () => {
    setEditingMaxUses(null);
  };

  const handleTrialDaysChange = (promoCode: PromoCode, value: string) => {
    setEditingTrialDays({ id: promoCode.id, value });
  };

  const handleTrialDaysSave = async (promoCode: PromoCode) => {
    if (!editingTrialDays || editingTrialDays.id !== promoCode.id) return;

    const trialDaysValue = parseInt(editingTrialDays.value, 10);

    if (isNaN(trialDaysValue) || trialDaysValue < 1) {
      setError("Trial days must be a positive number");
      setEditingTrialDays(null);
      return;
    }

    await handleUpdate(promoCode.id, { trialDays: trialDaysValue });
    setEditingTrialDays(null);
  };

  const handleTrialDaysCancel = () => {
    setEditingTrialDays(null);
  };

  const handleViewUsages = async (promoCode: PromoCode) => {
    setIsLoadingUsages(true);
    setSelectedPromoCode(null);

    try {
      const response = await fetch(`/api/promo-codes/${promoCode.id}`);

      if (!response.ok) {
        setError("Failed to fetch usage details");
        return;
      }

      const data = await response.json();
      setSelectedPromoCode(data.promoCode);
    } catch (err) {
      console.error("Error fetching usage details:", err);
      setError("An error occurred while fetching usage details");
    } finally {
      setIsLoadingUsages(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-tertiary)]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <p className="text-center font-primary text-gray-700">
              Please sign in to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <p className="text-center font-primary text-red-600">
              Access denied. You don't have permission to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-primary font-bold text-gray-900">
              Promo Codes
            </h1>
            <p className="text-gray-600 font-primary mt-1">
              Manage promo codes for 1-month free trials
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="font-primary bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Promo Code
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-primary text-sm">{error}</p>
          </div>
        )}

        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-primary font-semibold">
                Create New Promo Code
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-primary font-medium text-gray-700 mb-1">
                  Code *
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="TRIAL2024"
                  className="font-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-primary font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="1 Month Free Trial Promo Code"
                  className="font-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-primary font-medium text-gray-700 mb-1">
                    Max Uses (leave empty for unlimited)
                  </label>
                  <Input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: e.target.value })
                    }
                    placeholder="100"
                    className="font-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-primary font-medium text-gray-700 mb-1">
                    Trial Days *
                  </label>
                  <Input
                    type="number"
                    value={formData.trialDays}
                    onChange={(e) =>
                      setFormData({ ...formData, trialDays: e.target.value })
                    }
                    className="font-primary"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <label className="text-sm font-primary text-gray-700">
                  Active
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !formData.code.trim()}
                  className="font-primary bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      code: "",
                      description: "",
                      maxUses: "",
                      trialDays: "30",
                      isActive: true,
                    });
                  }}
                  className="font-primary"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-primary font-medium text-gray-700 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-primary font-medium text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-primary font-medium text-gray-700 uppercase tracking-wider">
                      Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-primary font-medium text-gray-700 uppercase tracking-wider">
                      Max Uses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-primary font-medium text-gray-700 uppercase tracking-wider">
                      Trial Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-primary font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-primary font-medium text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-primary font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {promoCodes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-8 text-center text-gray-500 font-primary"
                      >
                        No promo codes found. Create your first one above.
                      </td>
                    </tr>
                  ) : (
                    promoCodes.map((promoCode) => (
                      <tr key={promoCode.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-primary font-medium text-gray-900">
                            {promoCode.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-primary text-gray-700">
                            {promoCode.description || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewUsages(promoCode)}
                            className="text-sm font-primary text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            disabled={promoCode.usedCount === 0}
                          >
                            {promoCode.usedCount}
                            {promoCode._count &&
                              ` (${promoCode._count.usages})`}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingMaxUses?.id === promoCode.id ? (
                            <Input
                              type="number"
                              value={editingMaxUses.value}
                              onChange={(e) =>
                                setEditingMaxUses({
                                  id: promoCode.id,
                                  value: e.target.value,
                                })
                              }
                              onBlur={() => handleMaxUsesSave(promoCode)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleMaxUsesSave(promoCode);
                                } else if (e.key === "Escape") {
                                  handleMaxUsesCancel();
                                }
                              }}
                              className="w-28 h-8 text-sm font-primary"
                              autoFocus
                              min="0"
                              placeholder="Unlimited"
                            />
                          ) : (
                            <div
                              className="flex items-center gap-2 cursor-pointer group"
                              onClick={() =>
                                handleMaxUsesChange(
                                  promoCode,
                                  promoCode.maxUses?.toString() || ""
                                )
                              }
                            >
                              <span className="text-sm font-primary text-gray-700 group-hover:text-gray-900">
                                {promoCode.maxUses ?? "Unlimited"}
                              </span>
                              <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingTrialDays?.id === promoCode.id ? (
                            <Input
                              type="number"
                              value={editingTrialDays.value}
                              onChange={(e) =>
                                setEditingTrialDays({
                                  id: promoCode.id,
                                  value: e.target.value,
                                })
                              }
                              onBlur={() => handleTrialDaysSave(promoCode)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleTrialDaysSave(promoCode);
                                } else if (e.key === "Escape") {
                                  handleTrialDaysCancel();
                                }
                              }}
                              className="w-28 h-8 text-sm font-primary"
                              autoFocus
                              min="1"
                            />
                          ) : (
                            <div
                              className="flex items-center gap-2 cursor-pointer group"
                              onClick={() =>
                                handleTrialDaysChange(
                                  promoCode,
                                  promoCode.trialDays.toString()
                                )
                              }
                            >
                              <span className="text-sm font-primary text-gray-700 group-hover:text-gray-900">
                                {promoCode.trialDays} days
                              </span>
                              <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Switch
                            checked={promoCode.isActive}
                            onCheckedChange={() =>
                              handleToggleActive(promoCode)
                            }
                            className={cn(
                              "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-gray-900 data-[state=checked]:to-[var(--color-tertiary)]",
                              "data-[state=unchecked]:bg-gray-200"
                            )}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-primary text-gray-500">
                            {format(
                              new Date(promoCode.createdAt),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(promoCode.id)}
                              className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Details Modal */}
      <Dialog
        open={selectedPromoCode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPromoCode(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-primary">
              Users who used "{selectedPromoCode?.code}"
            </DialogTitle>
            <DialogDescription className="font-primary">
              {selectedPromoCode?.usedCount || 0} total usage
              {selectedPromoCode?.usedCount !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          {isLoadingUsages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : selectedPromoCode?.usages &&
            selectedPromoCode.usages.length > 0 ? (
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-primary font-medium text-gray-700 uppercase tracking-wider">
                        User Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-primary font-medium text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-primary font-medium text-gray-700 uppercase tracking-wider">
                        Used At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedPromoCode.usages.map((usage) => (
                      <tr key={usage.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-primary text-gray-900">
                            {usage.user.name || "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-primary text-gray-700">
                            {usage.user.email}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-primary text-gray-500">
                            {format(
                              new Date(usage.usedAt),
                              "MMM d, yyyy 'at' h:mm a"
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 font-primary">
                No users have used this promo code yet.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
