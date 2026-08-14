import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/apiService';

export interface Todo {
    _id?: string;
    id?: string;
    title?: string;
    name?: string;
    completed?: boolean;
    description?: string;
    image?: string;
    pdf?: string;
    mode?: boolean;
    latitude?: number;
    longitude?: number;
    address?: string;
}

export const TODOS_QUERY_KEY = ['todos'];

/**
 * Hook to fetch paginated todos with TanStack Query.
 * Automatic caching, persistence, and background refetching are enabled.
 */
export const useTodos = (page: number = 1) => {
    return useQuery({
        queryKey: [...TODOS_QUERY_KEY, page],
        queryFn: async () => {
            const res = await apiService.getTodos(page);
            const data = res.data;
            let todosArray: Todo[] = [];
            if (Array.isArray(data)) {
                todosArray = data;
            } else if (data && Array.isArray(data.todos)) {
                todosArray = data.todos;
            } else if (data && Array.isArray(data.data)) {
                todosArray = data.data;
            }
            return todosArray;
        },
    });
};

interface SaveTodoParams {
    formData: FormData;
    editingTodoId?: string | null;
    optimisticTodo?: Todo;
}

/**
 * Mutation hook for adding or updating a todo.
 * Performs optimistic updates on cached query data for immediate UI feedback.
 */
export const useSaveTodoMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ formData, editingTodoId }: SaveTodoParams) => {
            const res = await apiService.saveTodo(formData, editingTodoId);
            return res.data;
        },
        onMutate: async ({ optimisticTodo, editingTodoId }) => {
            // Cancel outgoing refetches so they don't overwrite optimistic update
            await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });

            // Save snapshots of all existing todo queries for rollback on error
            const previousQueries = queryClient.getQueriesData<Todo[]>({ queryKey: TODOS_QUERY_KEY });

            if (optimisticTodo) {
                // Optimistically update all cached pages matching ['todos']
                queryClient.setQueriesData<Todo[]>({ queryKey: TODOS_QUERY_KEY }, (old = []) => {
                    if (editingTodoId) {
                        return old.map((t) =>
                            (t._id === editingTodoId || t.id === editingTodoId) ? { ...t, ...optimisticTodo } : t
                        );
                    }
                    return [optimisticTodo, ...old];
                });
            }

            return { previousQueries };
        },
        onError: (_err, _variables, context) => {
            // Rollback optimistic changes using saved snapshots
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            // Invalidate to fetch canonical server state
            queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
        },
    });
};

/**
 * Mutation hook for deleting a todo.
 * Performs optimistic deletion on cached query data.
 */
export const useDeleteTodoMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiService.deleteTodo(id);
            return res.data;
        },
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });

            const previousQueries = queryClient.getQueriesData<Todo[]>({ queryKey: TODOS_QUERY_KEY });

            // Optimistically remove todo from all cached queries matching ['todos']
            queryClient.setQueriesData<Todo[]>({ queryKey: TODOS_QUERY_KEY }, (old = []) =>
                old.filter((t) => t._id !== id && t.id !== id)
            );

            return { previousQueries };
        },
        onError: (_err, _id, context) => {
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
        },
    });
};
