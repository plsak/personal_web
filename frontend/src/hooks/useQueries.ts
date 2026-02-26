import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { BlogPost, WebLink, CaffeineInfo, UserProfile, UserRole } from '../backend';
import { Principal } from '@dfinity/principal';

// Define types that are missing from backend interface
interface CaffeineInfoScreen {
  id: bigint;
  title: string;
  content: string;
}

interface CaffeineInfoConfig {
  sectionTitle: string;
  screens: CaffeineInfoScreen[];
}

interface HeadingConfig {
  text: string;
  font: string;
  color: string;
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
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
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Admin Management Queries
export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['adminPrincipals'] });
    },
  });
}

// Get all admin principals - now using the actual backend method
export function useGetAllAdminPrincipals() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['adminPrincipals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAdminPrincipals();
    },
    enabled: !!actor && !isFetching,
  });
}

// Visit Count Queries
export function useGetVisitCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['visitCount'],
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
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.incrementVisitCount();
    },
    onSuccess: () => {
      // Invalidate and refetch visit count immediately after increment
      queryClient.invalidateQueries({ queryKey: ['visitCount'] });
      queryClient.refetchQueries({ queryKey: ['visitCount'] });
    },
    // Retry failed increments
    retry: 3,
    retryDelay: 1000,
  });
}

// Heading Configuration Queries
export function useGetHeadingConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<HeadingConfig | null>({
    queryKey: ['headingConfig'],
    queryFn: async () => {
      if (!actor) return null;
      // Try the new method first, fallback to defaults if not available
      try {
        if ('getHeadingConfig' in actor) {
          return (actor as any).getHeadingConfig();
        }
      } catch (error) {
        console.warn('Heading config method not available, using defaults');
      }
      return null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateHeadingConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: HeadingConfig) => {
      if (!actor) throw new Error('Actor not available');
      if ('updateHeadingConfig' in actor) {
        return (actor as any).updateHeadingConfig(config.text, config.font, config.color);
      }
      throw new Error('Heading config update method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['headingConfig'] });
    },
  });
}

// Blog Post Queries - Enhanced to prevent editing interruption
export function useGetAllBlogPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<BlogPost[]>({
    queryKey: ['blogPosts'],
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
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBlogPost(title, content);
    },
    onSuccess: () => {
      // Only invalidate after successful mutation
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      queryClient.refetchQueries({ queryKey: ['blogPosts'] });
    },
  });
}

export function useEditBlogPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, content }: { id: bigint; title: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editBlogPost(id, title, content);
    },
    onSuccess: () => {
      // Only invalidate after successful mutation
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      queryClient.refetchQueries({ queryKey: ['blogPosts'] });
    },
  });
}

export function useDeleteBlogPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBlogPost(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      queryClient.refetchQueries({ queryKey: ['blogPosts'] });
    },
  });
}

// Web Links Queries - Updated to use ordered links
export function useGetAllWebLinks() {
  const { actor, isFetching } = useActor();

  return useQuery<WebLink[]>({
    queryKey: ['webLinks'],
    queryFn: async () => {
      if (!actor) return [];
      // Use getOrderedWebLinks to get links in the correct saved order
      return actor.getOrderedWebLinks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddWebLink() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, url, description }: { title: string; url: string; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addWebLink(title, url, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webLinks'] });
    },
  });
}

export function useEditWebLink() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, url, description }: { id: bigint; title: string; url: string; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editWebLink(id, title, url, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webLinks'] });
    },
  });
}

export function useDeleteWebLink() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteWebLink(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webLinks'] });
    },
  });
}

// Web Links Reordering - Fixed to preserve exact order
export function useReorderWebLinks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newOrder: bigint[]) => {
      if (!actor) throw new Error('Actor not available');
      console.log('Calling backend reorderWebLinks with exact order:', newOrder);
      return actor.reorderWebLinks(newOrder);
    },
    onSuccess: (_, newOrder) => {
      console.log('Reorder successful, invalidating cache to fetch fresh data');
      
      // Invalidate and refetch to ensure we get the exact order from backend
      queryClient.invalidateQueries({ queryKey: ['webLinks'] });
      queryClient.refetchQueries({ queryKey: ['webLinks'] });
    },
    onError: (error) => {
      console.error('Reorder failed:', error);
      // Refetch to restore correct order on error
      queryClient.invalidateQueries({ queryKey: ['webLinks'] });
    },
  });
}

// Legacy Caffeine Info Queries (for backward compatibility)
export function useGetCaffeineInfo() {
  const { actor, isFetching } = useActor();

  return useQuery<CaffeineInfo | null>({
    queryKey: ['caffeineInfo'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCaffeineInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateCaffeineInfo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCaffeineInfo(content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caffeineInfo'] });
    },
  });
}

// Enhanced Caffeine Info Queries
export function useGetCaffeineInfoConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<CaffeineInfoConfig | null>({
    queryKey: ['caffeineInfoConfig'],
    queryFn: async () => {
      if (!actor) return null;
      // Try the new method first, fallback to old method if not available
      try {
        if ('getCaffeineInfoConfig' in actor) {
          return (actor as any).getCaffeineInfoConfig();
        }
      } catch (error) {
        console.warn('New caffeine info config method not available, using fallback');
      }
      return null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateCaffeineInfoSectionTitle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      if (!actor) throw new Error('Actor not available');
      if ('updateCaffeineInfoSectionTitle' in actor) {
        return (actor as any).updateCaffeineInfoSectionTitle(title);
      }
      throw new Error('Method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caffeineInfoConfig'] });
    },
  });
}

export function useAddCaffeineInfoScreen() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      if ('addCaffeineInfoScreen' in actor) {
        return (actor as any).addCaffeineInfoScreen(title, content);
      }
      throw new Error('Method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caffeineInfoConfig'] });
    },
  });
}

export function useEditCaffeineInfoScreen() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, content }: { id: bigint; title: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      if ('editCaffeineInfoScreen' in actor) {
        return (actor as any).editCaffeineInfoScreen(id, title, content);
      }
      throw new Error('Method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caffeineInfoConfig'] });
    },
  });
}

export function useDeleteCaffeineInfoScreen() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      if ('deleteCaffeineInfoScreen' in actor) {
        return (actor as any).deleteCaffeineInfoScreen(id);
      }
      throw new Error('Method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caffeineInfoConfig'] });
    },
  });
}
