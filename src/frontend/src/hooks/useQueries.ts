import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type BlogPost,
  type CaffeineInfo,
  type CaffeineInfoScreenRecord,
  type UserProfile,
  type UserRole,
  type WebLink,
  createActor,
} from "../backend";

export type { CaffeineInfoScreenRecord };

interface CaffeineInfoConfig {
  sectionTitle: string;
  screens: CaffeineInfoScreenRecord[];
}

interface HeadingConfig {
  text: string;
  font: string;
  color: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Admin Management Queries
export function useAssignUserRole() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["adminPrincipals"] });
    },
  });
}

// Get all admin principals - now using the actual backend method
export function useGetAllAdminPrincipals() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<Principal[]>({
    queryKey: ["adminPrincipals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAdminPrincipals();
    },
    enabled: !!actor && !isFetching,
  });
}

// Visit Count Queries
export function useGetVisitCount() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<bigint>({
    queryKey: ["visitCount"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getVisitCount();
    },
    enabled: !!actor && !isFetching,
    // Refetch visit count more frequently to show updates
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useIncrementVisitCount() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.incrementVisitCount();
    },
    onSuccess: () => {
      // Invalidate and refetch visit count immediately after increment
      queryClient.invalidateQueries({ queryKey: ["visitCount"] });
      queryClient.refetchQueries({ queryKey: ["visitCount"] });
    },
    // Retry failed increments
    retry: 3,
    retryDelay: 1000,
  });
}

// Heading Configuration Queries
export function useGetHeadingConfig() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<HeadingConfig | null>({
    queryKey: ["headingConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getHeadingConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateHeadingConfig() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: HeadingConfig) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateHeadingConfig(
        config.text,
        config.font,
        config.color,
        config.backgroundColor ?? null,
        config.backgroundImageUrl ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["headingConfig"] });
    },
  });
}

// Background Config Queries
export function useGetBackgroundConfig() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<import("../backend").BackgroundConfig>({
    queryKey: ["backgroundConfig"],
    queryFn: async () => {
      if (!actor) return {};
      return actor.getBackgroundConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateBackgroundConfig() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: import("../backend").BackgroundConfig) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateBackgroundConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backgroundConfig"] });
    },
  });
}

// Blog Post Queries - Enhanced to prevent editing interruption
export function useGetAllBlogPosts() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<BlogPost[]>({
    queryKey: ["blogPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBlogPosts();
    },
    enabled: !!actor && !isFetching,
    // Reduce refetch frequency to prevent interrupting editing sessions
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    // Only refetch when explicitly requested
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAddBlogPost() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
    }: { title: string; content: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addBlogPost(title, content);
    },
    onSuccess: () => {
      // Only invalidate after successful mutation
      queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
      queryClient.refetchQueries({ queryKey: ["blogPosts"] });
      queryClient.invalidateQueries({ queryKey: ["siteStatistics"] });
    },
  });
}

export function useEditBlogPost() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
    }: { id: bigint; title: string; content: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.editBlogPost(id, title, content);
    },
    onSuccess: () => {
      // Only invalidate after successful mutation
      queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
      queryClient.refetchQueries({ queryKey: ["blogPosts"] });
      queryClient.invalidateQueries({ queryKey: ["siteStatistics"] });
    },
  });
}

export function useDeleteBlogPost() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteBlogPost(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
      queryClient.refetchQueries({ queryKey: ["blogPosts"] });
      queryClient.invalidateQueries({ queryKey: ["siteStatistics"] });
    },
  });
}

// Web Links Queries - Updated to use ordered links
export function useGetAllWebLinks() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<WebLink[]>({
    queryKey: ["webLinks"],
    queryFn: async () => {
      if (!actor) return [];
      // Use getOrderedWebLinks to get links in the correct saved order
      return actor.getOrderedWebLinks();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useAddWebLink() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      url,
      description,
    }: { title: string; url: string; description: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addWebLink(title, url, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webLinks"] });
      queryClient.invalidateQueries({ queryKey: ["siteStatistics"] });
    },
  });
}

export function useEditWebLink() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      url,
      description,
    }: { id: bigint; title: string; url: string; description: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.editWebLink(id, title, url, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webLinks"] });
      queryClient.invalidateQueries({ queryKey: ["siteStatistics"] });
    },
  });
}

export function useDeleteWebLink() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteWebLink(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webLinks"] });
      queryClient.invalidateQueries({ queryKey: ["siteStatistics"] });
    },
  });
}

// Web Links Reordering - Fixed to preserve exact order
export function useReorderWebLinks() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newOrder: bigint[]) => {
      if (!actor) throw new Error("Actor not available");
      console.log(
        "Calling backend reorderWebLinks with exact order:",
        newOrder,
      );
      return actor.reorderWebLinks(newOrder);
    },
    onSuccess: (_result, _newOrder) => {
      console.log("Reorder successful, invalidating cache to fetch fresh data");

      // Invalidate and refetch to ensure we get the exact order from backend
      queryClient.invalidateQueries({ queryKey: ["webLinks"] });
      queryClient.refetchQueries({ queryKey: ["webLinks"] });
    },
    onError: (error) => {
      console.error("Reorder failed:", error);
      // Refetch to restore correct order on error
      queryClient.invalidateQueries({ queryKey: ["webLinks"] });
    },
  });
}

// Section Names Queries
export function useGetSectionNames() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<{ about: string; blog: string; links: string }>({
    queryKey: ["sectionNames"],
    queryFn: async () => {
      if (!actor) return { about: "About", blog: "Blog", links: "Links" };
      return actor.getSectionNames();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetSectionName() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      section,
      name,
    }: { section: string; name: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setSectionName(section, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectionNames"] });
    },
  });
}

// Canister ID Queries
export function useGetBackendCanisterId() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<string>({
    queryKey: ["backendCanisterId"],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getBackendCanisterId();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 60 * 1000,
  });
}

export function useGetFrontendCanisterId() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<string>({
    queryKey: ["frontendCanisterId"],
    queryFn: async () => {
      // 1. Try Vite env var injected at build time (import.meta.env, not process.env)
      const viteEnvId =
        (import.meta.env as Record<string, string | undefined>)
          .CANISTER_ID_FRONTEND || "";
      if (viteEnvId) return viteEnvId;

      // 2. Extract canister ID from ICP hostname (e.g. <canisterId>.icp0.io or <canisterId>.raw.icp0.io)
      const hostname = window.location.hostname;
      const icpMatch = hostname.match(
        /^([a-z0-9-]{5,}-[a-z0-9-]{3,}-[a-z0-9-]{3,}-[a-z0-9-]{3,}-[a-z0-9]{3,})\.(?:raw\.)?icp0\.io$/,
      );
      if (icpMatch) return icpMatch[1];

      // 3. Localhost dev — canister ID embedded in hostname by DFX proxy
      const localMatch = hostname.match(
        /^([a-z0-9-]{5,}-[a-z0-9-]{3,}-[a-z0-9-]{3,}-[a-z0-9-]{3,}-[a-z0-9]{3,})(?:\.localhost)?$/,
      );
      if (localMatch) return localMatch[1];

      // 4. Try the backend API as last resort (stored by admin on first load)
      if (actor && !isFetching) {
        try {
          const stored = await actor.getFrontendCanisterId();
          if (stored) return stored;
        } catch {
          // ignore — backend call is best-effort
        }
      }

      return "";
    },
    enabled: true,
    staleTime: 60 * 60 * 1000,
  });
}

export function useSetFrontendCanisterId() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setFrontendCanisterId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frontendCanisterId"] });
    },
  });
}

// Legacy Caffeine Info Queries (for backward compatibility)
export function useGetCaffeineInfo() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<CaffeineInfo | null>({
    queryKey: ["caffeineInfo"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCaffeineInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateCaffeineInfo() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateCaffeineInfo(content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caffeineInfo"] });
    },
  });
}

// Enhanced Caffeine Info Queries
export function useGetCaffeineInfoConfig() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<CaffeineInfoConfig | null>({
    queryKey: ["caffeineInfoConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCaffeineInfoConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateCaffeineInfoConfig() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionTitle,
      screens,
    }: {
      sectionTitle: string;
      screens: CaffeineInfoScreenRecord[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateCaffeineInfoConfig(sectionTitle, screens);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caffeineInfoConfig"] });
      queryClient.invalidateQueries({ queryKey: ["caffeineInfo"] });
      queryClient.invalidateQueries({ queryKey: ["siteStatistics"] });
    },
  });
}

export function useUpdateCaffeineInfoSectionTitle() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      if (!actor) throw new Error("Actor not available");
      if ("updateCaffeineInfoSectionTitle" in actor) {
        return (
          actor as unknown as Record<string, (t: string) => Promise<void>>
        ).updateCaffeineInfoSectionTitle(title);
      }
      throw new Error("Method not available");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caffeineInfoConfig"] });
    },
  });
}

export function useAddCaffeineInfoScreen() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
    }: { title: string; content: string }) => {
      if (!actor) throw new Error("Actor not available");
      if ("addCaffeineInfoScreen" in actor) {
        return (
          actor as unknown as Record<
            string,
            (t: string, c: string) => Promise<void>
          >
        ).addCaffeineInfoScreen(title, content);
      }
      throw new Error("Method not available");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caffeineInfoConfig"] });
    },
  });
}

export function useEditCaffeineInfoScreen() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
    }: { id: string; title: string; content: string }) => {
      if (!actor) throw new Error("Actor not available");
      if ("editCaffeineInfoScreen" in actor) {
        return (
          actor as unknown as Record<
            string,
            (id: string, t: string, c: string) => Promise<void>
          >
        ).editCaffeineInfoScreen(id, title, content);
      }
      throw new Error("Method not available");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caffeineInfoConfig"] });
    },
  });
}

export function useDeleteCaffeineInfoScreen() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      if ("deleteCaffeineInfoScreen" in actor) {
        return (
          actor as unknown as Record<string, (id: string) => Promise<void>>
        ).deleteCaffeineInfoScreen(id);
      }
      throw new Error("Method not available");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caffeineInfoConfig"] });
    },
  });
}
export function useReorderCaffeineInfoScreens() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newOrder: string[]) => {
      if (!actor) throw new Error("Actor not available");
      return actor.reorderCaffeineInfoScreens(newOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caffeineInfoConfig"] });
      queryClient.refetchQueries({ queryKey: ["caffeineInfoConfig"] });
      queryClient.invalidateQueries({ queryKey: ["siteStatistics"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["caffeineInfoConfig"] });
    },
  });
}

// Section Order Queries
export function useGetSectionOrder() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<string[]>({
    queryKey: ["sectionOrder"],
    queryFn: async () => {
      if (!actor) return ["about", "links", "blog"];
      return actor.getSectionOrder();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetSectionOrder() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: string[]) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setSectionOrder(order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectionOrder"] });
      queryClient.refetchQueries({ queryKey: ["sectionOrder"] });
    },
  });
}

// Section Visibility Queries
export function useGetSectionVisibility() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<{ about: boolean; links: boolean; blog: boolean }>({
    queryKey: ["sectionVisibility"],
    queryFn: async () => {
      if (!actor) return { about: true, links: true, blog: true };
      return actor.getSectionVisibility();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetSectionVisibility() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visibility: {
      about: boolean;
      links: boolean;
      blog: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setSectionVisibility(visibility);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectionVisibility"] });
      queryClient.refetchQueries({ queryKey: ["sectionVisibility"] });
    },
  });
}

// Site Statistics Query
export function useGetSiteStatistics() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<import("../backend").SiteStatistics>({
    queryKey: ["siteStatistics"],
    queryFn: async () => {
      if (!actor)
        return {
          visitCount: 0n,
          linksCount: 0n,
          blogPostsCount: 0n,
          infoScreensCount: 0n,
          backendCanisterId: "",
        };
      return actor.getSiteStatistics();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}
