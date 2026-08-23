export type ResidentGender = 'male' | 'female' | 'other';
export type ResidentVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface IResidentArea {
  id: number;
  name: string;
  level: string;
}

export interface IResidentPendingChangeRequest {
  id: number;
  type: string;
  payload: Record<string, any>;
  createdAt: number;
}

/** Khớp response `customer/residents/my-profile` phía BE — `data` là `null` khi chưa khai báo. */
export interface IResMyResident {
  id: number;
  fullName: string;
  gender: ResidentGender;
  dateOfBirth: string | null;
  idCardNo: string | null;
  phone: string | null;
  relationshipToHead: string | null;
  permanentAddress: string | null;
  status: string;
  area: IResidentArea | null;
  areaPath: string | null;
  verificationStatus: ResidentVerificationStatus;
  rejectReason: string | null;
  pendingChangeRequest: IResidentPendingChangeRequest | null;
}

/** Body của `customer/residents/declare` — cùng bộ khoá dùng lại cho `request-change`. */
export interface IReqResidentDeclare {
  fullName: string;
  gender: ResidentGender;
  dateOfBirth?: string | null;
  idCardNo?: string | null;
  relationshipToHead?: string | null;
  permanentAddress?: string | null;
  areaId: number;
  householdCode?: string | null;
}

/** Chỉ gửi các trường thực sự thay đổi — xem `residents/request-change`. */
export type IReqResidentChangePayload = Partial<IReqResidentDeclare>;

/** Khớp response `customer/areas/options` — cây địa bàn đệ quy. */
export interface IResAreaOption {
  id: number;
  parentId: number | null;
  name: string;
  level: string;
  children: IResAreaOption[];
}
