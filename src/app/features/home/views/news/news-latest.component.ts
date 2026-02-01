import { Component, OnDestroy, OnInit } from '@angular/core';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';

type LatestNewsItem = {
  id: number;
  title: string;
  date: string;       // dd/MM/yyyy
  imageUrl: string;
  liked?: boolean;    // quan tâm
};

@Component({
  selector: 'app-news-latest',
  templateUrl: './news-latest.component.html',
  styleUrls: ['./news-latest.component.scss'],
  standalone: false
})
export class NewsLatestComponent extends AppCommonComponent implements OnInit, OnDestroy {
  items: LatestNewsItem[] = [];

  ngOnInit(): void {
    this.setHeader({ variant: 'title', show: true, back: true, title: 'Tin tức mới nhất' });

    this.items = [
      {
        id: 1,
        title: 'Tập huấn kỹ năng phòng chống tai nạn thương tích, đuối nước và xâm hại trẻ em năm 2025',
        date: '10/09/2025',
        imageUrl: 'https://icdn.24h.com.vn/upload/1-2026/images/2026-01-19//1768825953-thu_truong_pham_the_tung-6-width800height532.jpg',
        liked: false,
      },
      {
        id: 2,
        title: 'Thông báo về thời gian, địa điểm tiếp công dân phục vụ Đại hội Đại biểu Đảng bộ nhiệm kỳ 2025 - 2030',
        date: '10/09/2025',
        imageUrl: 'https://icdn.24h.com.vn/upload/1-2026/images/2026-01-19//1768825953-thu_truong_pham_the_tung-6-width800height532.jpg',
        liked: false,
      },
      {
        id: 3,
        title: 'Tuyên truyền kỹ năng nhận diện tội phạm lừa đảo và bảo vệ dữ liệu cá nhân trên không gian mạng',
        date: '10/06/2025',
        imageUrl: 'https://icdn.24h.com.vn/upload/1-2026/images/2026-01-19//1768825953-thu_truong_pham_the_tung-6-width800height532.jpg',
        liked: true,
      },
      {
        id: 4,
        title: 'Kế hoạch tổ chức ngày hội “Toàn dân bảo vệ an ninh Tổ quốc” năm 2025',
        date: '05/06/2025',
        imageUrl: 'https://icdn.24h.com.vn/upload/1-2026/images/2026-01-19//1768825953-thu_truong_pham_the_tung-6-width800height532.jpg',
        liked: false,
      },
      {
        id: 5,
        title: 'Thông báo lịch làm việc và tiếp nhận hồ sơ dịch vụ công trực tuyến tuần này',
        date: '01/06/2025',
        imageUrl: 'https://icdn.24h.com.vn/upload/1-2026/images/2026-01-19//1768825953-thu_truong_pham_the_tung-6-width800height532.jpg',
        liked: false,
      },
      {
        id: 6,
        title: 'Tuyên truyền phòng chống cháy nổ, đảm bảo an toàn điện trong mùa nắng nóng',
        date: '28/05/2025',
        imageUrl: 'https://icdn.24h.com.vn/upload/1-2026/images/2026-01-19//1768825953-thu_truong_pham_the_tung-6-width800height532.jpg',
        liked: false,
      },
    ];
  }

  toggleLike(it: LatestNewsItem, ev: Event) {
    ev.stopPropagation();
    it.liked = !it.liked;
  }

  openDetail(it: LatestNewsItem) {
    console.log('open detail', it);
  }

  ngOnDestroy(): void {
    this.getDestroySubs();
  }
}
