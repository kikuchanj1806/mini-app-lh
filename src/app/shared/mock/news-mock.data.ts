import { IResNewsItem } from '../services/api/news/new-api.service';

/**
 * Dữ liệu tin tức giả (demo) — dùng tạm khi backend /api/news chưa sẵn sàng.
 * Khi có API thật, xoá import này ở nơi dùng và bỏ comment lại đoạn gọi NewApiService.
 */

const NOW_SEC = Math.floor(Date.now() / 1000);
const daysAgo = (d: number) => NOW_SEC - d * 86400;

const WARD_LONG_HUNG = { id: 4, name: 'Long Hưng' };

const CATEGORIES = {
  directive: { id: 25, name: 'Tin chỉ đạo - điều hành' },
  security: { id: 24, name: 'Tin tức an ninh' },
  law: { id: 23, name: 'Thư viện pháp luật' },
  culture: { id: 26, name: 'Văn hóa – Xã hội – Du lịch' },
};

// Ảnh demo lấy từ Picsum (ảnh ngẫu nhiên, ổn định theo seed) — chỉ dùng tạm cho mục đích demo,
// không phải ảnh thật của xã Long Hưng. Khi có ảnh/API thật thì thay các link này.
const THUMBS = [
  'https://picsum.photos/seed/long-hung-hanh-chinh/800/450',
  'https://picsum.photos/seed/long-hung-an-ninh/800/450',
  'https://picsum.photos/seed/long-hung-ho-tich/800/450',
  'https://picsum.photos/seed/long-hung-le-hoi/800/450',
  'https://picsum.photos/seed/long-hung-tiep-dan/800/450',
  'https://picsum.photos/seed/long-hung-canh-bao/800/450',
  'https://picsum.photos/seed/long-hung-le-phi/800/450',
  'https://picsum.photos/seed/long-hung-van-hoa/800/450',
];

export const MOCK_NEWS: IResNewsItem[] = [
  {
    id: 1,
    title: 'UBND xã Long Hưng triển khai kế hoạch cải cách thủ tục hành chính năm 2026',
    status: 1,
    published_at: daysAgo(0),
    expired_at: null,
    thumbnail: THUMBS[0],
    excerpt: 'Xã Long Hưng đẩy mạnh số hoá thủ tục hành chính, rút ngắn thời gian xử lý hồ sơ cho người dân.',
    content: '<p>UBND xã Long Hưng vừa ban hành kế hoạch cải cách thủ tục hành chính năm 2026, tập trung vào việc số hoá quy trình tiếp nhận và xử lý hồ sơ, giảm thời gian chờ đợi cho người dân và doanh nghiệp.</p>',
    category: CATEGORIES.directive,
    ward: WARD_LONG_HUNG,
    created_at: daysAgo(0),
    updated_at: daysAgo(0),
  },
  {
    id: 2,
    title: 'Tăng cường tuần tra, đảm bảo an ninh trật tự dịp cuối năm',
    status: 1,
    published_at: daysAgo(1),
    expired_at: null,
    thumbnail: THUMBS[1],
    excerpt: 'Công an xã Long Hưng ra quân tuần tra ban đêm, phòng chống tội phạm và tệ nạn xã hội.',
    content: '<p>Nhằm đảm bảo an ninh trật tự trên địa bàn, lực lượng công an xã Long Hưng đã tăng cường tuần tra ban đêm tại các khu vực trọng điểm.</p>',
    category: CATEGORIES.security,
    ward: WARD_LONG_HUNG,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
  },
  {
    id: 3,
    title: 'Hướng dẫn thủ tục đăng ký khai sinh, khai tử trực tuyến',
    status: 1,
    published_at: daysAgo(2),
    expired_at: null,
    thumbnail: THUMBS[2],
    excerpt: 'Người dân có thể nộp hồ sơ hộ tịch trực tuyến qua Cổng dịch vụ công, không cần đến trực tiếp.',
    content: '<p>Để tạo thuận lợi cho người dân, UBND xã Long Hưng hướng dẫn chi tiết các bước đăng ký khai sinh, khai tử trực tuyến qua Cổng dịch vụ công quốc gia.</p>',
    category: CATEGORIES.law,
    ward: WARD_LONG_HUNG,
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
  },
  {
    id: 4,
    title: 'Lễ hội truyền thống làng nghề Long Hưng thu hút đông đảo du khách',
    status: 1,
    published_at: daysAgo(4),
    expired_at: null,
    thumbnail: THUMBS[3],
    excerpt: 'Lễ hội năm nay có nhiều hoạt động văn hoá, trò chơi dân gian đặc sắc.',
    content: '<p>Lễ hội truyền thống làng nghề tại xã Long Hưng diễn ra trong không khí sôi động, thu hút hàng nghìn lượt du khách tham quan, trải nghiệm.</p>',
    category: CATEGORIES.culture,
    ward: WARD_LONG_HUNG,
    created_at: daysAgo(4),
    updated_at: daysAgo(4),
  },
  {
    id: 5,
    title: 'Thông báo lịch tiếp công dân định kỳ tháng này',
    status: 1,
    published_at: daysAgo(5),
    expired_at: null,
    thumbnail: THUMBS[4],
    excerpt: 'Lãnh đạo UBND xã tiếp công dân vào các ngày thứ Ba và thứ Năm hàng tuần.',
    content: '<p>UBND xã Long Hưng thông báo lịch tiếp công dân định kỳ nhằm giải quyết kịp thời các kiến nghị, phản ánh của người dân.</p>',
    category: CATEGORIES.directive,
    ward: WARD_LONG_HUNG,
    created_at: daysAgo(5),
    updated_at: daysAgo(5),
  },
  {
    id: 6,
    title: 'Cảnh báo thủ đoạn lừa đảo giả danh cán bộ xã qua điện thoại',
    status: 1,
    published_at: daysAgo(6),
    expired_at: null,
    thumbnail: THUMBS[5],
    excerpt: 'Người dân cần cảnh giác trước các cuộc gọi mạo danh cán bộ yêu cầu chuyển tiền, cung cấp thông tin cá nhân.',
    content: '<p>Công an xã Long Hưng khuyến cáo người dân nâng cao cảnh giác trước thủ đoạn giả danh cán bộ để lừa đảo chiếm đoạt tài sản qua điện thoại.</p>',
    category: CATEGORIES.security,
    ward: WARD_LONG_HUNG,
    created_at: daysAgo(6),
    updated_at: daysAgo(6),
  },
  {
    id: 7,
    title: 'Quy định mới về mức thu phí, lệ phí một số thủ tục hành chính',
    status: 1,
    published_at: daysAgo(8),
    expired_at: null,
    thumbnail: THUMBS[6],
    excerpt: 'Áp dụng từ tháng này, một số loại phí, lệ phí được điều chỉnh theo quy định mới của tỉnh.',
    content: '<p>Căn cứ quy định mới, UBND xã Long Hưng thông báo mức thu phí, lệ phí áp dụng đối với một số thủ tục hành chính trên địa bàn.</p>',
    category: CATEGORIES.law,
    ward: WARD_LONG_HUNG,
    created_at: daysAgo(8),
    updated_at: daysAgo(8),
  },
  {
    id: 8,
    title: 'Phát động phong trào "Toàn dân đoàn kết xây dựng đời sống văn hoá"',
    status: 1,
    published_at: daysAgo(10),
    expired_at: null,
    thumbnail: THUMBS[7],
    excerpt: 'Xã Long Hưng phát động phong trào thi đua xây dựng gia đình văn hoá, thôn xóm văn minh.',
    content: '<p>UBND xã Long Hưng phối hợp cùng các đoàn thể phát động phong trào thi đua "Toàn dân đoàn kết xây dựng đời sống văn hoá" giai đoạn 2026-2030.</p>',
    category: CATEGORIES.culture,
    ward: WARD_LONG_HUNG,
    created_at: daysAgo(10),
    updated_at: daysAgo(10),
  },
];
