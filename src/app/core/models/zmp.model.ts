export interface IResAppInfo {
  appUrl: string
  description: string
  name: string
  qrCodeUrl: string
  version: string
  logoUrl: string
}

/** getUserInfo — https://mini.zalo.me/documents/api/getUserInfo/ */
export interface IUserInfoParams {
  autoRequestPermission?: boolean,
  avatarType?: "small" | "normal" | "large"
}

export interface IResUserInfo {
  avatar: string
  followedOA: boolean,
  id: string,
  idByOA: string,
  isSensitive: boolean,
  name: string
  phoneNumber: string;

  /** Biến nội bộ: user đã từng follow và dùng lượt chơi game rồi thì set true. */
  isHaveFollow?: boolean;
}

export interface IUserApiResponse {
  userInfo: IResUserInfo;
}
export interface IUserPhoneRequestPayload {
  access_token: string;
  code: string;
  timestamp: number;
}

export interface ShareZaloMiniAppParams {
  title: string;
  description?: string;
  thumbnail?: string;
}
