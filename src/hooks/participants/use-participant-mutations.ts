import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createParticipant,
  resolveParticipant,
  updateParticipant,
  type CreateParticipantInput,
  type ResolveParticipantInput,
  type UpdateParticipantInput,
} from '../../api/participants.ts';
import { QUERY_KEYS } from '../../constants/query-keys.ts';

export function useCreateParticipantMutation(csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateParticipantInput) => createParticipant(input, csrfToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants.all });
    },
  });
}

export function useResolveParticipantMutation(csrfToken: string) {
  return useMutation({
    mutationFn: (input: ResolveParticipantInput) => resolveParticipant(input, csrfToken),
  });
}

export function useUpdateParticipantMutation(participantId: string | undefined, csrfToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateParticipantInput) => {
      if (!participantId) throw new Error('Identitas peserta tidak tersedia');
      return updateParticipant(participantId, input, csrfToken);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.participants.detail(participantId),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.participants.historyPreview(participantId),
        }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.participants.all }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.all }),
      ]);
    },
  });
}
