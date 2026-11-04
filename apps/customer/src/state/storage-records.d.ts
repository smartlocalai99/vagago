import type { PreviewStay } from '@vagago/domain';
import type { EscapeDraft } from '../types';

export type RoomOptionsByStay = Record<string, readonly {
  id: string;
  capacity: number;
  nightlyRate: number;
}[]>;

export const SAVED_STAYS_KEY: string;
export const ESCAPE_DRAFT_KEY: string;
export function createDefaultDraft(now?: Date | number | string): EscapeDraft;
export function decodeSavedStays(raw: string | null, knownIds: Set<string>): { value: string[]; recovered: boolean };
export function decodeEscapeDraft(raw: string | null, defaults: EscapeDraft, knownIds: Set<string>, roomOptionsByStay?: RoomOptionsByStay): {
  draft: EscapeDraft;
  hasSavedDraft: boolean;
  recovered: boolean;
};
export function encodeSavedStays(savedIds: string[]): string;
export function canSaveEscapeDraft(draft: EscapeDraft, previewStays: PreviewStay[], today?: string, roomOptionsByStay?: RoomOptionsByStay): boolean;
export function mergeEscapeDraft(draft: EscapeDraft, patch: Partial<EscapeDraft>): EscapeDraft;
export function encodeEscapeDraft(draft: EscapeDraft): string;
