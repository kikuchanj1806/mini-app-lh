# Kế hoạch tích hợp Mini App ↔ hcc-admin-api

Phạm vi: 4 cụm tính năng **Tin tức · Phản ánh · Banner · Tiện ích nổi bật**.

3 project liên quan:
- `Mini-app/mini-app-lh` (Angular, Zalo Mini App)
- `Admin/BE/hcc-admin-api` (Laravel, multi-tenant, API v1)
- `Admin/FE/hcc-admin-fe` (Angular, trang quản trị)

> **Cập nhật:** auth **đã triển khai xong** theo phương án **gen 2** (port từ `nts-ca-template`) —
> xem [§Giai đoạn 8](#giai-đoạn-8--auth-gen-2--đã-triển-khai). Các mục nói "hoãn auth" bên dưới giữ
> lại làm bối cảnh; ràng buộc đó **không còn hiệu lực**.
>
> Bảng [§2.0 Ranh giới auth](#20-ranh-giới-auth--cái-gì-làm-được-ngay) vẫn đúng về mặt *route nào cần
> token*, chỉ khác là cột "chờ auth" nay đã mở khoá.

---

## PHẦN 1 — HIỆN TRẠNG

### 1.1 Kết luận nhanh

| Cặp | Trạng thái |
|---|---|
| Admin FE ↔ Admin BE | ✅ **Đã khớp hoàn toàn** — `uri.contants.ts` trỏ đúng `/api/v1/*`, cùng envelope, cùng camelCase |
| Mini App ↔ Admin BE (cụm Lấy số thứ tự) | 🟡 URL đã đúng `/api/v1/customer/appointment-*` nhưng **token sai nguồn** → thực tế vẫn 401 |
| Mini App ↔ Admin BE (Tin tức / Phản ánh / Banner / Tiện ích) | ❌ **Chưa móc nối** |

### 1.2 Chặn lớn nhất: luồng AUTH

Mini App lấy token qua `POST /api/zma/auth/sync` ([user-manage.service.ts:41](../src/app/shared/services/feature-specific/user/user-manage.service.ts#L41)).
**Endpoint này không tồn tại trong `hcc-admin-api`** — `routes/api.php` chỉ có `/api/v1/*`, không có bất kỳ route `zma` nào.

Hệ quả: mọi endpoint cần `auth:customer` đều hỏng, kể cả cụm appointment đã trỏ đúng URL. Đây là việc **phải làm trước tiên**.

BE đã có sẵn thay thế:
- `POST /api/v1/customer/auth/zalo` → `{token, expiresAt, customer}`
- `POST /api/v1/customer/auth/zalo/phone` → profile phẳng + `{token, expiresAt}` (đã cố ý giữ tương thích ngược cho bản mini app cũ)

### 1.3 Hiện trạng từng cụm

**Tin tức** — [new-api.service.ts](../src/app/shared/services/api/news/new-api.service.ts)
- Đang gọi `GET /api/news`, `GET /api/news/{id}` (BE dự án cũ).
- Thực tế **đang chạy MOCK**: `MOCK_NEWS` hardcode ở [home.component.ts](../src/app/features/home/views/home/home.component.ts), [news-latest.component.ts](../src/app/features/home/views/news/news-latest.component.ts), [new-detail.component.ts](../src/app/features/home/views/news/new-detail.component.ts) — code gọi API đã bị comment.

**Banner** — [banner-api.service.ts](../src/app/shared/services/api/banners/banner-api.service.ts)
- Đang gọi `GET /api/public/banners?ward_id=&position_key=`.
- `HOME_TOP` hardcode ảnh local `/assets/img/banners/93f5685b-...png`; chỉ `HOME_MIDDLE` còn gọi API cũ.

**Phản ánh** — [feedback-api.service.ts](../src/app/shared/services/api/feedbacks/feedback-api.service.ts)
- `POST /api/zma/feedbacks` với `{ward_id, title, content, image: path}`.
- Upload `POST /api/zma/upload` (FormData có `ward_id`, `psName`, `itemName`).
- Chưa có màn "Phản ánh của tôi" và "Phản ánh công khai".

**Tiện ích nổi bật** — hoàn toàn hardcode
- `quickActions[]` (4 nút) và `featuredTools[]` (8 ô) là mảng tĩnh trong [home.component.ts](../src/app/features/home/views/home/home.component.ts).
- Không gọi API nào.

### 1.4 Bảng lệch kỹ thuật (nguyên nhân "clone từ dự án khác")

| # | Khía cạnh | Mini App | hcc-admin-api |
|---|---|---|---|
| 1 | Base path | `/api/...` | `/api/v1/...` |
| 2 | HTTP verb | GET + query cho news/banner | **POST toàn bộ**, tham số trong body |
| 3 | Envelope | 2 kiểu lẫn lộn: `IResponseApi{code,errorCode,messages,data}` và `IResponseApiZma{status:'success',data,http_code}` | Chỉ 1 kiểu: `{code, errorCode, messages, data}` |
| 4 | Phân vùng dữ liệu | `ward_id` trong payload | **Multi-tenant theo `appId` → DB riêng.** Không có khái niệm `ward_id` |
| 5 | Naming | snake_case (`image_url`, `published_at`, `position_key`) | camelCase (`imageUrl`, `publishedAt`, `positionCode`) |
| 6 | Mã vị trí banner | `HOME_TOP` / `HOME_MIDDLE` | `miniapp_home_hero` / `miniapp_home_mid` / `miniapp_propaganda` (+ `platform`) |
| 7 | Timestamp | coi là **giây** (code nhân 1000) | **epoch milliseconds** |
| 8 | Phân trang | `perPage`, `data` là mảng phẳng | `pageSize`, `data = {totalPages,totalItems,page,pageSize,result[]}` |
| 9 | Payload phản ánh | `{ward_id,title,content,image}` | `{field*, title*, content*, location?, citizenName?, phone?, fileIds[]}` — `field` là **enum bắt buộc** |
| 10 | Upload | trả `{status,path,url}` → FE lưu `path` | trả `{id, url, filePath, ...}` → FE phải lưu **`id`** để đưa vào `fileIds` |
| 11 | Tiện ích | `{key,label,sub,iconClass,colorClass,route,externalUrl,categoryId}` | `{id,label,icon,iconClass,actionType,linkType,link,ref}` |

### 1.5 Điểm sáng: BE đã chuẩn bị sẵn cho Mini App

Không cần viết API mới cho 4 cụm này. Đã có:

| Endpoint | Auth | Dùng cho |
|---|---|---|
| `POST /api/v1/business-config` | public (appId) | branding, OA id, feature flags lúc khởi động |
| `POST /api/v1/banners/active` | public | `{positionCode, platform:'miniapp'}` |
| `POST /api/v1/banner-positions/options` | public | danh sách vị trí |
| `POST /api/v1/menu-items/active` | public | `{groupKey}`, mặc định `home_utilities` |
| `POST /api/v1/miniapp/home-content` | public | sections tin tức admin cấu hình + block thống kê xã |
| `POST /api/v1/post-categories/menu` `/options` | public | tab danh mục tin |
| `POST /api/v1/posts/public-list` `/public-detail` | public | tin tức |
| `POST /api/v1/notifications/public-list` `/public-detail` | public | thông báo |
| `POST /api/v1/feedbacks/public-list` `/public-detail` | public | phản ánh công khai |
| `POST /api/v1/customer/feedbacks/create` `/my-list` `/my-detail` | customer | gửi & theo dõi phản ánh |
| `POST /api/v1/customer/upload` | customer | ảnh phản ánh |
| `POST /api/v1/customer/auth/zalo` `/auth/zalo/phone` `/auth/me` | public/customer | đăng nhập |
| `POST /api/v1/miniapp/visits/track` | public | thống kê truy cập |

Hơn nữa `MenuItemSeeder` **đã nạp sẵn đúng danh sách đang hardcode trong `home.component.ts`** vào group `home_utilities`, và `BannerPositionSeeder` đã tạo 3 vị trí `miniapp_*`. Tức là BE được viết có chủ đích để mini app cắm vào — chỉ là mini app chưa được sửa.

### 1.6 Thứ BE **không** có (cần quyết định)

- `/api/public/tthc-videos` — không có tương ứng
- Quiz/game (`/api/zma/quiz-results-zma`, `/api/questions/list`) — không có tương ứng
- `/api/wards/{id}` (thống kê xã) — **có thể thay bằng** `miniapp/home-content` → `data.stats`
- `/api/zma/getphonenumber` — thay bằng `customer/auth/zalo/phone`

---

## PHẦN 2 — KẾ HOẠCH THỰC HIỆN (auth hoãn lại)

Nguyên tắc: **giữ nguyên kiến trúc `ApiService` / interceptor / cache hiện có**, chỉ đổi endpoint + thêm lớp mapping. Mỗi cụm thêm một hàm `mapXxx()` để tách BE contract khỏi ViewModel — tránh sửa template.

---

### 2.0 Ranh giới auth — cái gì làm được ngay

BE chia route thành *tenant public* (chỉ cần `appId`) và *customer* (cần Sanctum token). Đối chiếu với 4 cụm:

| Cụm | Endpoint dùng | Nhóm | Làm ngay? |
|---|---|---|---|
| **Banner** | `banners/active`, `banner-positions/options` | tenant public | ✅ 100% |
| **Tin tức** | `posts/public-list`, `posts/public-detail`, `miniapp/home-content`, `post-categories/menu` | tenant public | ✅ 100% |
| **Tiện ích nổi bật** | `menu-items/active` | tenant public | ✅ 100% |
| **Phản ánh — đọc công khai** | `feedbacks/public-list`, `feedbacks/public-detail` | tenant public | ✅ |
| **Phản ánh — gửi mới** | `customer/upload`, `customer/feedbacks/create` | **auth:customer** | ⛔ chờ auth |
| **Phản ánh — của tôi** | `customer/feedbacks/my-list`, `my-detail` | **auth:customer** | ⛔ chờ auth |
| *(ngoài phạm vi)* Lấy số thứ tự | `customer/appointment-*` | **auth:customer** | ⛔ vẫn 401 như hiện tại |

**Kết luận: 3/4 cụm làm trọn vẹn được ngay.** Chỉ cụm Phản ánh bị chẻ đôi — phần đọc làm được, phần ghi phải chờ.

Cơ sở kỹ thuật: `ResolveTenant` resolve doanh nghiệp theo thứ tự *Bearer token → header `X-Business-Id` → `appId`*. Route public không có `auth:` middleware nên chỉ cần nhánh thứ 3. Miễn `business_configs.zalo_app_id` khớp `environment.apiConfig.appId` là mọi route public trả dữ liệu bình thường, **không cần token nào**.

---

### 2.1 Xử lý phần Phản ánh bị chặn

Chọn phương án **(b) — code sẵn theo contract mới, chặn ở 1 điểm duy nhất.**

Lý do: nếu để form gửi phản ánh trỏ BE cũ (`/api/zma/feedbacks`) thì phải nuôi 2 base URL + 2 kiểu envelope song song, và toàn bộ phần UI (chọn lĩnh vực, multi-ảnh, `fileIds`) sẽ phải làm lại lần nữa khi auth xong. Code sẵn theo contract mới thì lúc bật auth chỉ cần gỡ một cờ.

Cụ thể:
- Viết đủ `FeedbackApiService.upload()` / `.create()` / `.myList()` / `.myDetail()` theo đúng contract BE mới (§ Giai đoạn 4).
- Làm đủ UI form mới: select **Lĩnh vực** (enum bắt buộc), `location`, multi-ảnh tối đa 5.
- Thêm cờ `environment.features.feedbackSubmit = false`. Khi tắt: nút Gửi disabled + banner "Tính năng đang được hoàn thiện", ẩn lối vào "Phản ánh của tôi".
- Khi auth xong → bật cờ, **không phải sửa service hay template**.

---

### GIAI ĐOẠN 0 — Chuẩn hoá nền (0.5 ngày)

**0.1 Environment**
```ts
// src/environments/environment.ts
apiUrl: 'http://127.0.0.1:8001',
apiPrefix: '/api/v1',
apiConfig: { appId: '3702118187570639533' },
features: { feedbackSubmit: false },   // bật khi xong auth
// wardId: @deprecated — gỡ ở Giai đoạn 6
```

**0.2 `ApiService`** ([api-common.service.ts](../src/app/core/services/api-common.service.ts))
- Thêm `postV1<T>(path, body)` — tự ghép `apiPrefix`, tự **chèn `appId` vào body**. BE đọc `zaloAppId|appId|zalo_app_id` từ cả `input()` lẫn `query()`, nhưng đưa vào body đúng chuẩn POST-only hơn cách nối `?appId=` hiện tại.
- Thêm `uploadV1<T>(path, formData)` cho multipart (dùng ở Giai đoạn 4, chuẩn bị trước).
- Giữ `get()/post()` cũ để không vỡ code chưa migrate (quiz, tthc-video).

**0.3 Model chung** ([core/models](../src/app/core/models))
```ts
export interface IResPage<T> {
  totalPages: number; totalItems: number; page: number; pageSize: number; result: T[];
}
```
Đánh dấu `IResponseApiZma` là `@deprecated`.

**0.4 Interceptor — quan trọng khi hoãn auth** ([api.interceptor.ts](../src/app/core/interceptors/api.interceptor.ts))

Vì chưa có auth, quy tắc phải là **không bao giờ gắn token vào `/api/v1/*`**:
```ts
private needsAuth(req: HttpRequest<any>): boolean {
  if (req.url.includes('/api/v1/')) return false;   // auth hoãn → không gắn token
  return this.legacyNeedsAuth(req);                 // giữ nguyên cho quiz/tthc-video
}
```

⚠️ **Hai bẫy phải xử lý cùng lúc, nếu không sẽ sinh lỗi khó lần:**

1. **Token rác trong localStorage.** Máy người dùng đang có `zma.token` phát từ BE cũ. Nếu lỡ đính vào request, `TenantResolver.fromBearerToken()` chạy trước nhánh `appId` — `findToken()` trả `null` nên vẫn rơi xuống `appId` (không hỏng), nhưng đây là đường dẫn ngầm không đáng có. Xử lý dứt điểm: đổi khoá lưu `zma.token` → `hcc.customer.token` để token cũ tự vô hiệu.

2. **Vòng lặp refresh khi 401.** Interceptor hiện bắt 401 → gọi `userMs.refresh$()` → `/api/zma/auth/sync` (endpoint không tồn tại) → lỗi tiếp. Trong giai đoạn hoãn auth phải **tắt nhánh retry này**, nếu không mọi 401 từ cụm appointment sẽ đẻ thêm một request hỏng và log nhiễu. Bọc bằng `if (environment.features.authEnabled)` hoặc tạm comment kèm `TODO(auth)`.

**0.5 Kiểm tra dữ liệu tiên quyết**
`business_configs.zalo_app_id` phải chứa đúng `3702118187570639533`. Thiếu → **mọi** route public trả `400 TENANT_NOT_RESOLVED`. Verify trước khi code bất cứ giai đoạn nào:
```bash
curl -X POST http://127.0.0.1:8001/api/v1/business-config \
  -H 'Content-Type: application/json' \
  -d '{"appId":"3702118187570639533"}'
```

---

### ~~GIAI ĐOẠN 1 — AUTH~~ → chuyển thành **Giai đoạn 8**, và **đã làm xong**

Xem [§Giai đoạn 8](#giai-đoạn-8--auth-gen-2--đã-triển-khai). Auth được đưa lên làm sớm sau khi khảo
sát `NTS-mini-app` và chốt phương án **gen 2**; cụm *Lấy số thứ tự* nhờ đó chạy được luôn.

---

### GIAI ĐOẠN 2 — BANNER (0.5 ngày) · ✅ không cần auth

**2.1 Đổi mã vị trí** ([banner-api.model.ts](../src/app/shared/models/api/banner/banner-api.model.ts))
```ts
export type BannerPositionCode = 'miniapp_home_hero' | 'miniapp_home_mid' | 'miniapp_propaganda';

export interface IResBannerActive {   // đúng Banner::toListItem() của BE
  id: number; title: string | null; imageUrl: string | null; linkUrl: string | null;
  position: { id: number; code: string; name: string; platform: string } | null;
  sortOrder: number; isActive: boolean; startAt: number | null; endAt: number | null; createdAt: number;
}
```
Giữ `IResBannerT` (ViewModel slider) — chỉ thêm hàm map.

**2.2 `BannerApiService`**
```ts
getBanners(params: { positionCode: BannerPositionCode; platform?: 'miniapp' }) {
  return this.postV1<IResponseApi<IResBannerActive[]>>('/banners/active',
    { positionCode: params.positionCode, platform: params.platform ?? 'miniapp' });
}
```

**2.3 `BannerCacheService`**
- `BannerQuery` → `{ positionCode, platform?, forceRefresh? }`; bỏ `ward_id`.
- `makeKey` = `${platform}:${positionCode}`.
- Xoá `clearByWard()` → `clearByPosition()`.

**2.4 `home.component.ts`**
- `loadBannerTop()`: **xoá ảnh hardcode** `/assets/img/banners/93f5685b-...png`, gọi `miniapp_home_hero` → map **toàn bộ mảng** thành `slides` (BE cho tối đa 5 → slider có nhiều slide thật).
- `loadBannerMiddle()`: `miniapp_home_mid`, lấy phần tử đầu.
- `getBannerImgUrl()` đọc `imageUrl`; `onOpenBanner()` đọc `linkUrl`.

**Nghiệm thu:** Admin FE tạo banner vị trí *Mini App - Trang chủ (Hero)* → reload mini app thấy ngay.

---

### GIAI ĐOẠN 3 — TIN TỨC (1.5 ngày) · ✅ không cần auth

**3.1 Model mới** — thay `IResNewsItem`
```ts
export interface IResPostListItem {
  id: number; title: string; slug: string; excerpt: string | null;
  thumbnailUrl: string | null;
  category: { id: number; name: string; slug: string } | null;
  isPublished: boolean; publishedAt: number | null;  // ⚠ epoch MILLISECONDS
  author: { id: number; fullName?: string } | null; createdAt: number;
}
export interface IResPostDetail extends IResPostListItem { content: string | null; updatedAt: number; }
```

**3.2 `NewApiService`**
```ts
publicList(params: { keyword?; categoryId?; categorySlug?; includeChildren?; page?; pageSize? }) {
  return this.postV1<IResponseApi<IResPage<IResPostListItem>>>('/posts/public-list', params);
}
publicDetail(idOrSlug: { id?: number; slug?: string }) {
  return this.postV1<IResponseApi<IResPostDetail>>('/posts/public-detail', idOrSlug);
}
categoryMenu() { return this.postV1<IResponseApi<any[]>>('/post-categories/menu', {}); }
```
⚠ `perPage` → `pageSize`; mảng nằm ở `res.data.result`, **không phải** `res.data`.

**3.3 Trang chủ dùng `home-content`**
```ts
homeContent() {
  return this.postV1<IResponseApi<{
    sections: { code; title; sourceMode; displayLimit;
                viewAllCategory: {id;name;slug}|null; items: IResPostListItem[] }[];
    stats: { title; updatedMonth; isActive; items: {code;label;tag;value;iconClass;tone}[] } | null;
  }>>('/miniapp/home-content', {});
}
```
`home.component.ts`:
- Xoá `MOCK_NEWS` + `loadNews()` → `loadHomeContent()`: block tin tức lấy `sections[0].items`, tiêu đề lấy `sections[0].title`, nút "Xem tất cả" điều hướng theo `viewAllCategory.id`.
- **Xoá `loadWardStats()` + `userApiService.getWardDetail()`** → block thống kê render từ `data.stats.items` (admin nhập ở màn *Thống kê trang chủ*). Bỏ hết logic tự tính `%`/`km2` ở FE.

**3.4 `news-latest.component.ts`**
- Xoá `MOCK_NEWS`, mở lại `publicList({ categoryId, page:1, pageSize:20 })`.
- **Xoá `toMs()` nhân 1000** — `publishedAt` đã là ms.
- Thêm thanh tab danh mục từ `categoryMenu()`.

**3.5 `new-detail.component.ts`**
- Xoá `MOCK_NEWS`, mở lại `publicDetail({ id })`; bỏ `published_at * 1000`.
- Giữ `bypassSecurityTrustHtml` cho `content`.

**3.6** Xoá `src/app/shared/mock/news-mock.data.ts` sau khi 3 màn đã sạch.

---

### GIAI ĐOẠN 4 — PHẢN ÁNH (2 ngày) · 🟡 chẻ đôi

#### 4A — Phần làm ngay (không cần auth)

**4A.1 Hằng số** (khớp `Feedback::FIELDS` / `STATUSES` của BE)
```ts
export const FEEDBACK_FIELDS = [
  { value: 'an_ninh',    label: 'An ninh trật tự' },
  { value: 'giao_thong', label: 'Giao thông' },
  { value: 'moi_truong', label: 'Môi trường' },
  { value: 'ha_tang',    label: 'Hạ tầng' },
  { value: 'thu_tuc',    label: 'Thủ tục hành chính' },
  { value: 'dat_dai',    label: 'Đất đai' },
  { value: 'khac',       label: 'Khác' },
] as const;

export const FEEDBACK_STATUS_LABEL: Record<string, string> = {
  new: 'Tiếp nhận', processing: 'Đang xử lý', done: 'Đã xử lý', rejected: 'Từ chối',
};
```

**4A.2 Màn mới: "Phản ánh công khai"** (`/feedback/public`) — **đây là phần chạy được thật ngay bây giờ**
```ts
publicList(p?: {field?; page?; pageSize?}) {
  return this.postV1<IResponseApi<IResPage<IFeedbackPublicItem>>>('/feedbacks/public-list', p ?? {});
}
publicDetail(id: number) {
  return this.postV1<IResponseApi<IFeedbackPublicDetail>>('/feedbacks/public-detail', { id });
}
```
Shape BE (`toPublicListItem`): `{id, code, field, title, location, status, coverImageUrl, hasReply, createdAt}`.
Detail thêm: `{content, reply, repliedAt, images[]}` — chỉ gồm ảnh admin đã tick công khai.

UI: filter theo `field`, chip trạng thái theo `FEEDBACK_STATUS_LABEL`, badge "Đã phản hồi" khi `hasReply`.
Đây là mảnh ghép khép kín vòng *người dân thấy được kết quả xử lý* — và nó **không phụ thuộc auth chút nào**.

#### 4B — Phần code sẵn, khoá sau cờ (chờ auth)

**4B.1 `FeedbackApiService`** — viết đủ, đúng contract mới
```ts
upload(file: File) {                           // POST /api/v1/customer/upload
  const fd = new FormData();
  fd.append('file', file);
  fd.append('name', file.name);
  fd.append('type', '50');                     // FileUpload::TYPE_IMG_FEEDBACK
  return this.uploadV1<IResponseApi<{id:number; url:string; filePath:string}>>('/customer/upload', fd);
}
create(payload: {
  field: string; title: string; content: string;
  location?: string; citizenName?: string; phone?: string; fileIds: number[];
}) { return this.postV1<IResponseApi<IFeedbackMyDetail>>('/customer/feedbacks/create', payload); }

myList(p?: {status?; page?; pageSize?}) { return this.postV1<...>('/customer/feedbacks/my-list', p ?? {}); }
myDetail(id: number)                    { return this.postV1<...>('/customer/feedbacks/my-detail', { id }); }
```
⚠ **Giữ `id` trả về từ upload, không giữ `path`** — `create` nhận `fileIds: number[]`.
⚠ Ràng buộc BE cần validate sẵn ở FE: tối đa **5 ảnh**, mỗi ảnh **≤ 5MB**, chỉ `jpg/jpeg/png/webp`; upload throttle **10 req/phút**, create throttle **5 req/phút**.

**4B.2 `feedback.component.ts` + `.html`** — làm đủ UI ngay
- Thêm `field` (select bắt buộc), `location`, `citizenName`, `phone`.
- Ảnh đơn → **mảng tối đa 5**: `previewUrls: string[]`, `fileIds: number[]`, nút xoá từng ảnh.
- Bỏ mọi kiểm tra `wardId`; bỏ `res.status !== 'success'` → dùng `res.code === 1`.
- **Gate:** `features.feedbackSubmit === false` → nút Gửi disabled + banner "Tính năng đang được hoàn thiện".
- `citizenName`/`phone` sẽ prefill từ `auth/me` khi có auth — hiện để người dùng tự nhập.

**4B.3 Màn "Phản ánh của tôi"** (`/feedback/my`) — code sẵn, ẩn lối vào khi cờ tắt.

---

### GIAI ĐOẠN 5 — TIỆN ÍCH NỔI BẬT (1 ngày) · ✅ không cần auth

**5.1 `MenuItemApiService` (mới)**
```ts
export interface IResMenuItemActive {
  id: number; label: string;
  icon: string | null;        // URL ảnh admin upload
  iconClass: string | null;   // class FontAwesome
  actionType: 'route'|'url'|'webview'|'post_category'|'post_detail'|'phone'|'oa'|'none';
  linkType: 'route'|'url'|'webview'|'phone'|'none';   // BE đã resolve
  link: string | null;                                 // BE đã resolve
  ref: { type: string; id: number; slug?: string; name?: string; title?: string } | null;
}

active(groupKey = 'home_utilities') {
  return this.postV1<IResponseApi<IResMenuItemActive[]>>('/menu-items/active', { groupKey });
}
```
BE **đã resolve sẵn** `post_category` → `/news?categoryId=N`, `post_detail` → `/news/N`. FE chỉ switch theo `linkType`, **không tự map lại**.

**5.2 `home.component.ts`**
- `featuredTools` từ mảng tĩnh → nạp qua `active('home_utilities')`.
- **Giữ mảng hardcode làm fallback** khi API lỗi/rỗng → trang chủ không bao giờ trống.
```ts
async onMenuItemClick(it: IResMenuItemActive) {
  switch (it.linkType) {
    case 'route':   return this.route.navigateByUrl(it.link!);
    case 'url':     return void window.open(it.link!, '_blank');
    case 'webview': return void this.openExternalUrl(it.link!);
    case 'phone':   return this.callNow(it.link!);
    default:        return this._notify.info('Tính năng đang được cập nhật.');
  }
}
```
- Icon: `icon` (ảnh) → `iconClass` → icon mặc định.
- `colorClass`: BE không có → gán ở FE theo index từ palette `['tile-blue','tile-green','tile-orange','tile-purple','tile-teal','tile-pink','tile-cyan','tile-sky']`.
- `sub`: BE không có → bỏ khỏi template (hoặc xem 5.3).

**5.3 Thay đổi nhỏ phía BE (tuỳ chọn)**
- Quản trị luôn 4 nút `quickActions`: chỉ cần **thêm seeder** group `home_quick_actions` rồi FE gọi `active('home_quick_actions')`. `MenuItemActiveFilter` cho `groupKey` tự do → **không phải sửa code BE**.
- Muốn `sub` + `colorClass` do admin nhập: thêm cột `subtitle`, `color_tone` vào `menu_items` + expose ở `toActiveItem()`/`toListItem()` + thêm field ở `menu-item-form.modal.component.ts`. Đây là thay đổi thật (migration + BE + Admin FE).

---

### GIAI ĐOẠN 6 — Bổ sung & dọn dẹp (1 ngày) · ✅ không cần auth

**6.1 Khởi động app** — gọi `POST /api/v1/business-config` trong `APP_INITIALIZER` → `zaloOaId`, `brand`, `featureFlags`. Thay `environment.OAId` hardcode bằng `zaloOaId` (dùng ở `follow-official.service`, `home.component`).

**6.2 Tracking** — `POST /api/v1/miniapp/visits/track` một lần khi mở app.

**6.3 Thông báo** — `onNotificationTap()` hiện fake `'Bạn có 3 thông báo mới.'` → nối `POST /api/v1/notifications/public-list`.

**6.4 Xoá dead code**
- `UserApiService`: `syncZaloUser`, `syncAuth`, `getPhoneNumber`, `getWardDetail`, `sendFeedback`, `sendMessageZma`, và `list()` (endpoint rỗng `''` — bug tiềm tàng).
  ⚠ Giữ lại phần `UserManageService` liên quan ZMP SDK (`authorizeScopes$`, `getUserInfo`) — Giai đoạn 8 sẽ dùng lại.
- `shared/mock/news-mock.data.ts`, `IResponseApiZma`, `uriApiConst.user.*` legacy.

**6.5** Gỡ `wardId` khỏi environment (sau Giai đoạn 4 không còn nơi dùng).

---

### GIAI ĐOẠN 7 — Kiểm thử tích hợp (0.5 ngày)

**Tiên quyết:** `business_configs.zalo_app_id` = `environment.apiConfig.appId`.

Kịch bản E2E xuyên 3 project — **chạy được toàn bộ mà không cần đăng nhập**:
1. Admin FE tạo banner `miniapp_home_hero` → Mini App hiện slide.
2. Admin FE tạo + publish bài viết → Mini App trang chủ và `/news` hiện; mở chi tiết đúng nội dung.
3. Admin FE màn *Nội dung trang chủ* đổi danh mục nguồn / thêm bài thủ công → Mini App đổi theo.
4. Admin FE màn *Thống kê trang chủ* nhập giá trị → block thống kê Mini App đổi theo.
5. Admin FE thêm/ẩn/kéo thả thứ tự tiện ích → Mini App đổi theo; bấm từng `actionType` chạy đúng.
6. Admin FE bật công khai một phản ánh + chọn ảnh công khai → Mini App `/feedback/public` thấy đúng ảnh đã chọn.
7. Gọi API thiếu `appId` → nhận `400 TENANT_NOT_RESOLVED`, UI báo lỗi tử tế (không màn trắng).
8. Xoá `localStorage` → app vẫn chạy đủ 3 cụm public (chứng minh không lệ thuộc token).

**Còn lại của Giai đoạn 4B:** gửi phản ánh + ảnh, "Phản ánh của tôi" — chờ UI, không còn chờ auth.

---

### GIAI ĐOẠN 8 — AUTH (gen 2) — ✅ ĐÃ TRIỂN KHAI

Sau khi khảo sát `NTS-mini-app`, chốt phương án **gen 2** (`nts-ca-template`) thay vì gen 1
(`nts-ub-template`). Phần này mô tả thứ đã code, không còn là dự kiến.

#### 8.1 Vì sao gen 2

`nts-ub-template` (gen 1) để interceptor **tự đăng nhập ngầm** qua `ensureLogin$()`. `nts-ca-template`
đã cố ý bỏ cách đó, lý do ghi thẳng trong code:

> Đăng nhập giờ bao gồm cả việc xin quyền và `getPhoneNumber()`, mà `authorize()` cần thao tác thật
> của người dùng mới gọi được — không thể khởi từ một request nền. Để interceptor tự đăng nhập sẽ
> khiến hộp thoại xin quyền bung ra ở bất kỳ màn nào, và chính request đăng nhập cũng đi qua đây nên
> sẽ đệ quy.

HCC là app phường/xã: phản ánh và lấy số thứ tự đều cần định danh SĐT thật — đúng bài toán gen 2 sinh
ra để giải. BE `hcc-admin-api` đã sẵn sàng: `Customer/AuthController.php`, `CustomerZaloService.php`,
`TenantResolver.php` **giống hệt từng byte** với NTS; limiter `customer-zalo` cũng vậy. Không sửa BE
dòng nào.

#### 8.2 Nguyên tắc

**Đăng nhập thành công ⟺ server đổi được `phoneToken` ra số điện thoại.** Không có SĐT thì không có
phiên, nên không tồn tại trạng thái "đã đăng nhập nhưng chưa có SĐT".

Luồng 2 bước, chỉ chạy từ thao tác thật của người dân:

```
[người dân bấm nút]
  └─ authorize(['scope.userInfo','scope.userPhonenumber'])   ← all-or-nothing
       └─ getUserInfo({autoRequestPermission: true})          ← thiếu cờ này userInfo luôn rỗng
            └─ verifyZalo(accessToken)      POST /customer/auth/zalo         ← chỉ verify
                 └─ getPhoneNumber()                                         ← mã sống 2 phút
                      └─ loginWithPhone(...) POST /customer/auth/zalo/phone  ← cấp token thật
```

Tách `verifyZalo` ra trước là có chủ đích: accessToken hỏng thì biết ngay, không tiêu phí
`phoneToken` vốn chỉ sống 2 phút và dùng được đúng một lần. `getPhoneNumber()` phải nằm **sát** lời
gọi đăng nhập, không lấy sẵn từ trước.

#### 8.3 Các file đã thay đổi

| File | Nội dung |
|---|---|
| `core/constants/api.constants.ts` | `PUBLIC_API_ENDPOINTS`, `CUSTOMER_API_ENDPOINTS`, `CUSTOMER_AUTH_PUBLIC_PATHS` |
| `core/services/api-common.service.ts` | `postGuestRequest()` nhét `appId` vào body (trước chỉ có ở query) |
| `core/interceptors/api.interceptor.ts` | Viết lại theo gen 2 — xem 8.4 |
| `shared/services/api/user/customer-auth-api.service.ts` | **mới** — `verifyZalo`/`loginWithPhone`/`me`/`logout`/`reportOaFollow` |
| `shared/services/feature-specific/user/zma-token-storage.service.ts` | Ràng buộc `zaloUserId`, đổi khoá, `purgeLegacy()` |
| `shared/services/feature-specific/user/user-manage.service.ts` | `login$`/`autoLogin$`/`profileOrFetch$`/`clearSessionIfScopeRevoked$`/`clearSession` |
| `features/book-appointment/.../book-appointment.component.ts` | Bỏ đăng nhập ngầm, `onLoginNow()` → `login$()` |
| `features/book-appointment/.../ticket-detail.component.ts` | Bỏ `getValidToken$()`, dựa vào nhánh 401 sẵn có |
| `features/game/views/quiz-start.component.ts` | `ensureQuizAuth$()` → `login$()` |
| `environments/*.ts` | `features.authEnabled: true` |

#### 8.4 Interceptor — chỉ gắn token, không tự đăng nhập

```ts
private needsAuth(req) {
  const path = this.apiPath(req);                       // bỏ query rồi mới so khớp
  if (CUSTOMER_AUTH_PUBLIC_PATHS.includes(path)) return false;   // chống đệ quy
  if (path.startsWith('/api/v1/customer/')) return environment.features?.authEnabled !== false;
  if (path.startsWith('/api/v1/')) return false;        // tenant public
  return this.legacyNeedsAuth(req);                     // quiz / tthc-video
}
```

Ba điểm cốt lõi:
- **`apiPath()` thay cho `url.includes(...)`.** Mọi request public đều mang `?appId=...`; so khớp
  trên chuỗi có query rất dễ trúng nhầm — `/api/v1/customer/auth/zalo?appId=x` vẫn "chứa"
  `/api/v1/customer/`.
- **Whitelist hai bước đăng nhập.** Thiếu nó, request đăng nhập lại đòi token của chính nó → đệ quy.
- **Không còn nhánh 401 → refresh → retry.** Thay bằng: 401 khi *đã* gắn token thì xoá token, để
  `isLoggedIn()` phản ánh đúng và màn hình mời đăng nhập lại.

#### 8.5 Hai rủi ro gen 1 không xử lý, gen 2 có

1. **Token ràng buộc `zaloUserId`.** `localStorage` sống theo *thiết bị*, không theo tài khoản Zalo.
   Người B đăng nhập Zalo sau người A trên cùng máy sẽ dùng lại được token còn hạn của A. Khoá thứ
   ba `hcc.customer.zaloUserId` + `isValid(currentZaloUserId)` chặn việc này; khi phát hiện lệch,
   `login$()` xoá token cũ **và gọi logout với chính token đó** để BE thu hồi phía server.
   Lời gọi logout ấy phải đi thẳng qua `HttpClient`, không qua `CustomerAuthApiService.logout()` —
   nếu qua service, interceptor sẽ gắn token *hiện tại* và tự đăng xuất người vừa đăng nhập.

2. **Cooldown 30s cho luồng tự động.** Ra/vào tab tạo lại component nên luồng đăng nhập chạy lại mỗi
   lượt; một lượt tốn 2 request, mà limiter `customer-zalo` chỉ cho 20/phút. `autoLogin$()` im lặng
   bỏ qua trong 30s sau lần hỏng gần nhất; nút bấm tay vẫn gọi thẳng `login$()` nên luôn thử lại ngay.

Kèm theo: `clearSessionIfScopeRevoked$()` phát hiện người dân gỡ quyền bên Cài đặt Zalo — phải gọi ở
**điểm vào màn**, không chỉ lúc app khởi động, vì thao tác gỡ diễn ra ngoài app trong khi webview vẫn
đang chạy nên constructor không chạy lại.

#### 8.6 Đổi khoá localStorage

`zma.token`/`zma.expiresAt` → `hcc.customer.token`/`hcc.customer.expiresAt`/`hcc.customer.zaloUserId`.
Token do backend đời trước phát ra không phải Sanctum token của `hcc-admin-api`; đổi khoá là cách vô
hiệu chúng trên máy người dùng mà không cần bước dọn riêng. `purgeLegacy()` chạy trong constructor
`UserManageService` để xoá nốt rác.

#### 8.7 Còn lại

- [ ] Bật `features.feedbackSubmit = true` sau khi UI form phản ánh (Giai đoạn 4B) xong — **không
      còn phụ thuộc auth**, chỉ chờ UI.
- [ ] Kiểm thử trên máy thật: đổi tài khoản Zalo cùng thiết bị; gỡ quyền giữa phiên; 429 khi bấm
      đăng nhập liên tục.

---

## PHẦN 3 — QUYẾT ĐỊNH CẦN CHỐT

| # | Vấn đề | Ảnh hưởng ngay? | Phương án |
|---|---|---|---|
| 1 | ~~Màn *gửi* phản ánh trong lúc chờ auth~~ | ~~Có~~ | **Đã hết vướng** — auth xong ở GĐ 8, chỉ còn chờ UI form (GĐ 4B) rồi bật `features.feedbackSubmit` |
| 2 | `tthc-video`, quiz/game — BE mới không có | **Đã chốt** | Giữ nguyên trên backend đời trước. Đây là lý do `environment.wardId` và `IResponseApiZma` còn tồn tại — chỉ hai cụm này dùng. Chuyển sang v1 khi có nhu cầu thật |
| 3 | `quickActions` (4 nút đầu trang chủ) | **Đã làm** | Quản trị qua group `home_quick_actions` (thêm vào `MenuItemSeeder`), FE lùi về danh sách mặc định nếu nhóm rỗng |
| 4 | `sub` + `colorClass` của tiện ích | **Đã chốt** | FE gán `colorClass` theo index từ palette 8 màu; `sub` bỏ khỏi ô nạp từ API. Không đổi BE |
| 5 | `asked-questions`, `review` | **Đã chốt** | Giữ UI tĩnh |

---

## Ước lượng & thứ tự

| Giai đoạn | Trạng thái |
|---|---|
| 0 — Chuẩn hoá nền | ✅ `postV1`/`uploadV1`/`apiPrefix`/`features` |
| 8 — Auth gen 2 | ✅ xem §Giai đoạn 8 |
| 2 — Banner | ✅ `banners/active` + 2 vị trí `miniapp_*`, bỏ ảnh hardcode |
| 3 — Tin tức | ✅ `posts/public-*` + `miniapp/home-content`, bỏ MOCK_NEWS và `getWardDetail` |
| 4A — Phản ánh công khai | ✅ màn `/feedback/public` |
| 4B — Form phản ánh + "của tôi" | ✅ form mới + màn `/feedback/my`, `feedbackSubmit: true` |
| 5 — Tiện ích nổi bật | ✅ `menu-items/active` cho cả lưới tiện ích lẫn hàng nút tắt |
| 6 — Bổ sung & dọn dẹp | ✅ business-config, visits/track, notifications, gỡ dead code |
| 7 — Kiểm thử | 🟡 build sạch; **chưa chạy tay trên máy thật** |

**Toàn bộ phần code đã xong.** Việc còn lại duy nhất là kiểm thử thủ công (§Giai đoạn 7) và các mục
ở §Phần 3 đã chốt bên dưới.
