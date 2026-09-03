export enum HEADER_STATUS_CODE {
	 FOUND = 302,
	 UNAUTHORIZED = 401,
	 FORBIDDEN = 403,
	 NOT_FOUND = 404,
	 INTERNAL_SERVER_ERROR = 500,
}

export const ERROR_CODE = {
	 REQUIRED_TOKEN: 'ERR_REQUIRED_TOKEN',
	 INVALID_TOKEN: 'ERR_INVALID_TOKEN',
	 REQUIRED_FILTER_DATA: 'ERR_REQUIRED_FILTER_DATA',
	 REQUIRED_FILTER_FIELD: 'ERR_REQUIRED_FILTER_FIELD',
	 REQUIRED_FORM_DATA: 'ERR_REQUIRED_FORM_DATA',
	 INVALID_FORM_FIELDS: 'ERR_INVALID_FORM_FIELDS',
	 PAGE_401: 'ERR_PAGE_401',
	 PAGE_403: 'ERR_PAGE_403',
	 PAGE_404: 'ERR_PAGE_404',
	 DATA_403: 'ERR_DATA_403',
	 DATA_404: 'ERR_DATA_404',
}

const API_V1_PREFIX = '/api/v1';

/**
 * Nhóm `tenant public` của BE: chỉ cần `appId` để resolve doanh nghiệp, KHÔNG cần token.
 * Thêm endpoint mới vào đây thì interceptor tự động không gắn token (xem ApiInterceptor.needsAuth).
 */
export const PUBLIC_API_ENDPOINTS = {
	 BUSINESS_CONFIG: `${API_V1_PREFIX}/business-config`,
	 MINIAPP_HOME_CONTENT: `${API_V1_PREFIX}/miniapp/home-content`,
	 MINIAPP_VISITS_TRACK: `${API_V1_PREFIX}/miniapp/visits/track`,
	 BANNERS_ACTIVE: `${API_V1_PREFIX}/banners/active`,
	 MENU_ITEMS_ACTIVE: `${API_V1_PREFIX}/menu-items/active`,
	 POST_CATEGORIES_MENU: `${API_V1_PREFIX}/post-categories/menu`,
	 POSTS_PUBLIC_LIST: `${API_V1_PREFIX}/posts/public-list`,
	 POSTS_PUBLIC_DETAIL: `${API_V1_PREFIX}/posts/public-detail`,
	 BROADCAST_CHANNELS: `${API_V1_PREFIX}/broadcasts/channels`,
	 BROADCAST_LATEST: `${API_V1_PREFIX}/broadcasts/latest`,
	 BROADCAST_PUBLIC_LIST: `${API_V1_PREFIX}/broadcasts/public-list`,
	 BROADCAST_PUBLIC_DETAIL: `${API_V1_PREFIX}/broadcasts/public-detail`,
	 NOTIFICATIONS_PUBLIC_LIST: `${API_V1_PREFIX}/notifications/public-list`,
	 NOTIFICATIONS_PUBLIC_DETAIL: `${API_V1_PREFIX}/notifications/public-detail`,
	 FEEDBACKS_PUBLIC_LIST: `${API_V1_PREFIX}/feedbacks/public-list`,
	 FEEDBACKS_PUBLIC_DETAIL: `${API_V1_PREFIX}/feedbacks/public-detail`,
} as const;

/**
 * Nhóm `auth:customer` của BE — mọi endpoint dưới đây cần Bearer token, TRỪ hai bước đăng nhập
 * (`AUTH_ZALO`, `AUTH_ZALO_PHONE`) vốn chính là nơi phát ra token nên không thể tự yêu cầu token.
 */
export const CUSTOMER_API_ENDPOINTS = {
	 AUTH_ZALO: `${API_V1_PREFIX}/customer/auth/zalo`,
	 AUTH_ZALO_PHONE: `${API_V1_PREFIX}/customer/auth/zalo/phone`,
	 AUTH_ME: `${API_V1_PREFIX}/customer/auth/me`,
	 AUTH_LOGOUT: `${API_V1_PREFIX}/customer/auth/logout`,
	 ZALO_OA_FOLLOW: `${API_V1_PREFIX}/customer/zalo/oa-follow`,
	 UPLOAD: `${API_V1_PREFIX}/customer/upload`,
	 FEEDBACKS_CREATE: `${API_V1_PREFIX}/customer/feedbacks/create`,
	 FEEDBACKS_RESOLVE_LOCATION: `${API_V1_PREFIX}/customer/feedbacks/resolve-location`,
	 FEEDBACKS_RESOLVE_MAP_LINK: `${API_V1_PREFIX}/customer/feedbacks/resolve-map-link`,
	 FEEDBACKS_MY_LIST: `${API_V1_PREFIX}/customer/feedbacks/my-list`,
	 FEEDBACKS_MY_DETAIL: `${API_V1_PREFIX}/customer/feedbacks/my-detail`,
	 APPOINTMENT_FIELDS_LIST: `${API_V1_PREFIX}/customer/appointment-fields/list`,
	 APPOINTMENT_TIME_SLOTS_LIST: `${API_V1_PREFIX}/customer/appointment-time-slots/list`,
	 APPOINTMENT_TICKETS_CREATE: `${API_V1_PREFIX}/customer/appointment-tickets/create`,
	 APPOINTMENT_TICKETS_MY_LIST: `${API_V1_PREFIX}/customer/appointment-tickets/my-list`,
	 APPOINTMENT_TICKETS_DETAIL: `${API_V1_PREFIX}/customer/appointment-tickets/detail`,
} as const;

/** Hai bước đăng nhập — public vì chính chúng phát ra token. Interceptor dùng để chống đệ quy. */
export const CUSTOMER_AUTH_PUBLIC_PATHS: readonly string[] = [
	 CUSTOMER_API_ENDPOINTS.AUTH_ZALO,
	 CUSTOMER_API_ENDPOINTS.AUTH_ZALO_PHONE,
];
