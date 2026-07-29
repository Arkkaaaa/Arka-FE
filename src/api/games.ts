import {
  CreateGameSessionRequestSchema,
  CreateGameSessionResponseSchema,
  CreatePreparationRequestSchema,
  GameSessionDtoSchema,
  PreparationDtoSchema,
  type GameSessionDto,
  type PreparationDto,
} from '@/schemas';
import type { z } from 'zod';
import { apiGet, apiPost, requestBody } from '../config/api-client.ts';
import { API_ENDPOINTS } from '../constants/api.ts';

export type CreatePreparationInput = z.infer<typeof CreatePreparationRequestSchema>;

export function createPreparation(
  input: CreatePreparationInput,
  csrfToken: string,
): Promise<PreparationDto> {
  return apiPost(
    API_ENDPOINTS.games.preparations,
    requestBody(CreatePreparationRequestSchema, input),
    PreparationDtoSchema,
    csrfToken,
  );
}

export function createGameSession(
  preparationId: string,
  csrfToken: string,
  idempotencyKey: string,
): Promise<z.infer<typeof CreateGameSessionResponseSchema>> {
  return apiPost(
    API_ENDPOINTS.games.sessions,
    requestBody(CreateGameSessionRequestSchema, { preparationId }),
    CreateGameSessionResponseSchema,
    csrfToken,
    { 'Idempotency-Key': idempotencyKey },
  );
}

export function getGameSession(sessionId: string): Promise<GameSessionDto> {
  return apiGet(API_ENDPOINTS.games.session(sessionId), GameSessionDtoSchema);
}
