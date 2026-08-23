/** Khớp Official::toPublicItem() phía BE. */
export interface IResOfficialPublicItem {
  id: number;
  fullName: string;
  position: string | null;
  avatarUrl: string | null;
  workPhone: string | null;
  workEmail: string | null;
  responsibilities: string | null;
}

/** Khớp OfficialService::publicList() — nhóm theo phòng ban. */
export interface IResOfficialGroup {
  departmentId: number | null;
  departmentName: string;
  officials: IResOfficialPublicItem[];
}

/** Khớp Official::toPublicDetail() phía BE. */
export interface IResOfficialPublicDetail {
  id: number;
  fullName: string;
  position: string | null;
  departmentName: string | null;
  avatarUrl: string | null;
  workPhone: string | null;
  workEmail: string | null;
  responsibilities: string | null;
}
