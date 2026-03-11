// ─── magis-studio/frontend/src/hooks/useSocial.js ────────────────────────────
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── Keys ──────────────────────────────────────────────────────────────────────
export const socialKeys = {
  feed:          (page) => ['social', 'feed', page],
  feedInfinite:  ()     => ['social', 'feed', 'infinite'],
  stories:       ()     => ['social', 'stories'],
  post:          (id)   => ['social', 'post', id],
  userPosts:     (id)   => ['social', 'userPosts', id],
  explore:       (q)    => ['social', 'explore', q],
  notifications: ()     => ['social', 'notifications'],
  followers:     (id)   => ['social', 'followers', id],
  following:     (id)   => ['social', 'following', id],
};

// ── Feed (infinite scroll) ────────────────────────────────────────────────────
export const useFeed = () =>
  useInfiniteQuery({
    queryKey: socialKeys.feedInfinite(),
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/social/feed?page=${pageParam}&limit=12`).then(r => r.data),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    staleTime: 1000 * 60 * 2,
  });

// ── Stories ───────────────────────────────────────────────────────────────────
export const useStories = () =>
  useQuery({
    queryKey: socialKeys.stories(),
    queryFn: () => api.get('/social/stories').then(r => r.data.data),
    staleTime: 1000 * 60,
  });

// ── Single post ───────────────────────────────────────────────────────────────
export const usePost = (id) =>
  useQuery({
    queryKey: socialKeys.post(id),
    queryFn: () => api.get(`/social/posts/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

// ── User posts ────────────────────────────────────────────────────────────────
export const useUserPosts = (userId) =>
  useQuery({
    queryKey: socialKeys.userPosts(userId),
    queryFn: () => api.get(`/social/users/${userId}/posts`).then(r => r.data.data),
    enabled: !!userId,
  });

// ── Explore ───────────────────────────────────────────────────────────────────
export const useExplore = (query = '') =>
  useQuery({
    queryKey: socialKeys.explore(query),
    queryFn: () => api.get(`/social/explore${query ? `?q=${query}` : ''}`).then(r => r.data.data),
    staleTime: 1000 * 30,
  });

// ── Notifications ─────────────────────────────────────────────────────────────
export const useNotifications = () =>
  useQuery({
    queryKey: socialKeys.notifications(),
    queryFn: () => api.get('/social/notifications').then(r => r.data),
    refetchInterval: 1000 * 30, // Poll every 30s
  });

// ── Create post ───────────────────────────────────────────────────────────────
export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.post('/social/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.feedInfinite() });
      toast.success('Publicación creada');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error al publicar'),
  });
};

// ── Delete post ───────────────────────────────────────────────────────────────
export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/social/posts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.feedInfinite() });
      toast.success('Publicación eliminada');
    },
  });
};

// ── React to post ─────────────────────────────────────────────────────────────
export const useReactToPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, type = 'like' }) =>
      api.post(`/social/posts/${postId}/react`, { type }),
    onMutate: async ({ postId, type }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: socialKeys.feedInfinite() });
      const prev = qc.getQueryData(socialKeys.feedInfinite());
      qc.setQueryData(socialKeys.feedInfinite(), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            data: page.data.map(post =>
              post._id === postId
                ? { ...post, reactionCount: (post.reactionCount || 0) + 1, viewerReaction: type }
                : post
            ),
          })),
        };
      });
      return { prev };
    },
    onError: (err, _, ctx) => { if (ctx?.prev) qc.setQueryData(socialKeys.feedInfinite(), ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: socialKeys.feedInfinite() }),
  });
};

// ── Add comment ───────────────────────────────────────────────────────────────
export const useAddComment = (postId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/social/posts/${postId}/comments`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.post(postId) }),
    onError: (err) => toast.error(err.response?.data?.message || 'Error al comentar'),
  });
};

// ── Toggle save ───────────────────────────────────────────────────────────────
export const useToggleSave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) => api.post(`/social/posts/${postId}/save`),
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.feedInfinite() }),
  });
};

// ── Follow / unfollow ─────────────────────────────────────────────────────────
export const useFollowUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => api.post(`/social/users/${userId}/follow`),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: socialKeys.followers(userId) });
      toast.success('Siguiendo');
    },
  });
};

export const useUnfollowUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => api.delete(`/social/users/${userId}/follow`),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: socialKeys.followers(userId) });
      toast.success('Dejaste de seguir');
    },
  });
};

// ── Mark notifications read ───────────────────────────────────────────────────
export const useMarkNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/social/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.notifications() }),
  });
};
