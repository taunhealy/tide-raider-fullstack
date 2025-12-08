"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { Button } from "@/app/components/ui/Button";
import { Plus, Users, Trash2, Edit, Send } from "lucide-react";
import SquadForm from "@/app/components/squads/SquadForm";
import BroadcastForm from "@/app/components/squads/BroadcastForm";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";

interface SquadMember {
  id: string;
  phoneNumber: string;
  name?: string | null;
}

interface Squad {
  id: string;
  name: string;
  members: SquadMember[];
  _count?: {
    broadcasts: number;
  };
}

export default function SquadsPage() {
  const { data: session } = useBackendAuth();
  const queryClient = useQueryClient();
  const [isSquadFormOpen, setIsSquadFormOpen] = useState(false);
  const [isBroadcastFormOpen, setIsBroadcastFormOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Squad | null>(null);
  const [selectedSquadForBroadcast, setSelectedSquadForBroadcast] =
    useState<Squad | null>(null);

  // Fetch squads
  const { data, isLoading } = useQuery({
    queryKey: ["squads"],
    queryFn: async () => {
      const response = await fetch("/api/squads");
      if (!response.ok) throw new Error("Failed to fetch squads");
      return response.json() as Promise<{ squads: Squad[] }>;
    },
    enabled: !!session,
  });

  // Delete squad mutation
  const deleteSquadMutation = useMutation({
    mutationFn: async (squadId: string) => {
      const response = await fetch(`/api/squads/${squadId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete squad");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squads"] });
    },
  });

  const handleCreateSquad = () => {
    setEditingSquad(null);
    setIsSquadFormOpen(true);
  };

  const handleEditSquad = (squad: Squad) => {
    setEditingSquad(squad);
    setIsSquadFormOpen(true);
  };

  const handleDeleteSquad = async (squadId: string) => {
    if (confirm("Are you sure you want to delete this squad?")) {
      await deleteSquadMutation.mutateAsync(squadId);
    }
  };

  const handleNewBroadcast = (squad: Squad) => {
    setSelectedSquadForBroadcast(squad);
    setIsBroadcastFormOpen(true);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-primary mb-4">
            Please sign in to manage your squads
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-primary font-bold text-[var(--color-text-primary)]">
              My Squads
            </h1>
            <p className="text-gray-600 font-primary mt-2">
              Create squads and send WhatsApp broadcasts to your crew
            </p>
          </div>
          <Button
            onClick={handleCreateSquad}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Squad
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--color-tertiary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-primary">Loading squads...</p>
          </div>
        ) : data?.squads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-primary mb-4">
              No squads yet. Create your first squad to get started!
            </p>
            <Button
              onClick={handleCreateSquad}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Squad
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.squads.map((squad) => (
              <div
                key={squad.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-primary font-semibold text-[var(--color-text-primary)]">
                    {squad.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSquad(squad)}
                      className="text-gray-400 hover:text-[var(--color-tertiary)] transition-colors"
                      aria-label="Edit squad"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSquad(squad.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      aria-label="Delete squad"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 font-primary mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    {squad.members.length} member
                    {squad.members.length !== 1 ? "s" : ""}
                  </p>
                  {squad._count && (
                    <p className="text-sm text-gray-600 font-primary">
                      {squad._count.broadcasts} broadcast
                      {squad._count.broadcasts !== 1 ? "s" : ""} sent
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => handleNewBroadcast(squad)}
                    variant="dark"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    New Broadcast
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Squad Form Dialog */}
      <Dialog open={isSquadFormOpen} onOpenChange={setIsSquadFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <SquadForm
            squad={editingSquad}
            onClose={() => {
              setIsSquadFormOpen(false);
              setEditingSquad(null);
            }}
            onSuccess={() => {
              setIsSquadFormOpen(false);
              setEditingSquad(null);
              queryClient.invalidateQueries({ queryKey: ["squads"] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Broadcast Form Dialog */}
      <Dialog open={isBroadcastFormOpen} onOpenChange={setIsBroadcastFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <BroadcastForm
            squad={selectedSquadForBroadcast}
            onClose={() => {
              setIsBroadcastFormOpen(false);
              setSelectedSquadForBroadcast(null);
            }}
            onSuccess={() => {
              setIsBroadcastFormOpen(false);
              setSelectedSquadForBroadcast(null);
              queryClient.invalidateQueries({ queryKey: ["squads"] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
