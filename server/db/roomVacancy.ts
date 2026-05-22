import type { ResidentLean } from "./resident.model.js";
import type { RoomLean, RoomWithVacancy } from "./room.model.js";

function roomKey(community: string, section: string, room: string): string {
  return `${community}__${section}__${room}`;
}

/** Count residents per room; vacancy = capacity minus occupancy (min 0). */
export function attachVacancyToRooms(
  rooms: RoomLean[],
  residents: Pick<ResidentLean, "community" | "section" | "room">[],
): RoomWithVacancy[] {
  const countByRoom = new Map<string, number>();

  for (const r of residents) {
    const key = roomKey(r.community, r.section, r.room);
    countByRoom.set(key, (countByRoom.get(key) ?? 0) + 1);
  }

  return rooms.map((room) => {
    const key = roomKey(room.community, room.section, room.room);
    const occupied = countByRoom.get(key) ?? 0;
    const vacancy = Math.max(0, Number(room.capacity) - occupied);

    return { ...room, vacancy } as RoomWithVacancy;
  });
}
