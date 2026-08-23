import { Injectable } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
// @ts-ignore
import { NgbModalOptions } from "@ng-bootstrap/ng-bootstrap/modal/modal-config";

@Injectable({
   providedIn: 'root'
})

export class ModalCustomService {

   constructor(
     private _modalService: NgbModal,
   ) {}

   /** Mở modal với cấu hình mặc định để không đóng khi click bên ngoài. */
   openDefault(content: any, options?: NgbModalOptions): NgbModalRef {
      options = options || {};
      options.backdrop = 'static';
      if (typeof options.keyboard == "undefined"){
         options.keyboard = true;
      }
      return this._modalService.open(content, options);
   }

   openIntro(content: any, options?: NgbModalOptions): NgbModalRef {
      return this._modalService.open(content, options);
   }

   dismissAll(reason?: any){
      return this._modalService.dismissAll(reason);
   }

   hasOpenModals(): boolean {
      return this._modalService.hasOpenModals();
   }
}
