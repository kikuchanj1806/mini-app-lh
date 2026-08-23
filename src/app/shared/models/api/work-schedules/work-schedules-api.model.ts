export type WorkScheduleSession = 'morning' | 'afternoon' | 'full_day';

/** Khớp WorkSchedule::toPublicItem() phía BE — không có ghi chú nội bộ. */
export interface IResWorkScheduleItem {
  id: number;
  session: WorkScheduleSession;
  startTime: string | null;
  endTime: string | null;
  title: string;
  location: string | null;
  hostDisplayName: string | null;
  hostPosition: string | null;
  participants: string | null;
}

/** BE gom sẵn theo ngày (WorkScheduleService::publicRange) để FE không phải tự nhóm. */
export interface IResWorkScheduleGroup {
  date: string; // "2026-08-20"
  items: IResWorkScheduleItem[];
}
