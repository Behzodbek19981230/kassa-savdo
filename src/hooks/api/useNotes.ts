import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteService, type NoteItem, type NotePayload } from '../../services/note.service';

export function useNotes(params?: Record<string, unknown>) {
	return useQuery({
		queryKey: ['notes', params],
		queryFn: () => noteService.getNotes(params),
		staleTime: 30000,
	});
}

export function useNotesAll() {
	return useQuery({
		queryKey: ['notes-all'],
		queryFn: () => noteService.getNotes(),
		staleTime: 30000,
	});
}

export function useCreateNote() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: NotePayload) => noteService.createNote(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notes'] });
			queryClient.invalidateQueries({ queryKey: ['notes-all'] });
		},
	});
}

export function useUpdateNote() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: NotePayload }) =>
			noteService.updateNote(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notes'] });
			queryClient.invalidateQueries({ queryKey: ['notes-all'] });
		},
	});
}

export function useDeleteNote() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => noteService.deleteNote(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notes'] });
			queryClient.invalidateQueries({ queryKey: ['notes-all'] });
		},
	});
}
