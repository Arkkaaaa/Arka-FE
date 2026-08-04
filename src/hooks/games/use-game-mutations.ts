import { useMutation } from '@tanstack/react-query';
import {
  cancelPreparation,
  createGameSession,
  createPreparation,
  type CreatePreparationInput,
} from '../../api/games.ts';

export function useCreatePreparationMutation(csrfToken: string) {
  return useMutation({
    mutationFn: (input: CreatePreparationInput) => createPreparation(input, csrfToken),
  });
}

export function useCancelPreparationMutation(csrfToken: string) {
  return useMutation({
    mutationFn: (preparationId: string) => cancelPreparation(preparationId, csrfToken),
  });
}

export function useCreateGameSessionMutation(csrfToken: string) {
  return useMutation({
    mutationFn: ({
      preparationId,
      idempotencyKey,
    }: {
      preparationId: string;
      idempotencyKey: string;
    }) => createGameSession(preparationId, csrfToken, idempotencyKey),
  });
}
