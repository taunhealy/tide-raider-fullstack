// app/hooks/useBeaches.ts
import { useQuery } from "@tanstack/react-query";
import type { Beach } from "@/app/types/beaches";
import api from "@/app/lib/api-client";

export function useBeaches() {
  return useQuery<Beach[]>({
    queryKey: ["beaches"],
    queryFn: async () => {
      const data = await api.getBeaches();
      return data.beaches;
    },
  });
}
