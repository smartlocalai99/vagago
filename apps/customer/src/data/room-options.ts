import type { RoomOption, Stay } from '@/types';

export type { RoomOption };

export function getRoomOptions(stay: Stay): RoomOption[] {
  return stay.rooms;
}
