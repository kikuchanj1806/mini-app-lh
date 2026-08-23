import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppCommonComponent} from '../../../../shared/components/app-common.service';

type FaqItem = {
  id: number;
  question: string;
  answer: string;
};

@Component({
  selector: 'app-asked-questions',
  templateUrl: 'asked-questions.component.html',
  styleUrls: ['asked-questions.component.scss'],
  standalone: false
})
export class AskedQuestionsComponent extends AppCommonComponent implements OnInit, OnDestroy {
  faqs: FaqItem[] = [
    {
      id: 1,
      question: 'Công dân phải đổi thẻ Căn cước công dân trong những trường hợp nào?',
      answer:
        'Theo quy định tại khoản 1 Điều 21 và Khoản 1 Điều 23 Luật Căn cước công dân quy định Thẻ Căn cước công dân được đổi trong 06 trường hợp sau đây:\n' +
        '• Thẻ Căn cước công dân phải được đổi khi công dân đủ 25 tuổi, đủ 40 tuổi và đủ 60 tuổi;\n' +
        '• Thẻ bị hư hỏng không sử dụng được;\n' +
        '• Thay đổi thông tin về họ, chữ đệm, tên; đặc điểm nhân dạng;\n' +
        '• Xác định lại giới tính, quê quán;\n' +
        '• Có sai sót về thông tin trên thẻ Căn cước công dân;\n' +
        '• Khi công dân có yêu cầu.'
    },
    {
      id: 2,
      question: 'Các phương tiện phòng cháy chữa cháy nào phải dán tem kiểm định và dán theo mẫu nào?',
      answer: 'Nội dung trả lời (demo)…'
    },
    {
      id: 3,
      question: 'Các trường hợp thu hồi giấy phép, giấy xác nhận về công cụ hỗ trợ?',
      answer: 'Nội dung trả lời (demo)…'
    },
    {id: 4, question: 'Thủ tục xin cấp lại thẻ căn cước công dân?', answer: 'Nội dung trả lời (demo)…'},
    {
      id: 5,
      question: 'Có thể đăng ký chuyển thẻ CCCD qua đường bưu điện đến địa chỉ theo yêu cầu của công dân được không?',
      answer: 'Nội dung trả lời (demo)…'
    },
    {id: 6, question: 'Dịch vụ công trực tuyến là gì và có mấy mức độ?', answer: 'Nội dung trả lời (demo)…'},
  ];

  openId: number | null = 1; // mặc định mở item đầu tiên

  ngOnInit() {
    this.setHeader({variant: 'title', show: true, back: true, title: 'Câu hỏi thường gặp'});
  }

  ngOnDestroy() {
    this.getDestroySubs();
  }

  toggle(item: FaqItem) {
    this.openId = this.openId === item.id ? null : item.id;
  }

  isOpen(item: FaqItem) {
    return this.openId === item.id;
  }

  trackById = (_: number, it: FaqItem) => it.id;
}
