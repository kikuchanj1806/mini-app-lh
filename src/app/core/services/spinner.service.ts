import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({providedIn: 'root'})
export class SpinnerService {
  private _loading = new BehaviorSubject<boolean>(false);
  readonly isLoading$: Observable<boolean> = this._loading.asObservable();

  private defer(fn: () => void) {
    if (typeof queueMicrotask === 'function') queueMicrotask(fn);
    else setTimeout(fn, 0);
  }

  show(): void {
    this.defer(() => this._loading.next(true));
  }

  hide(): void {
    this.defer(() => this._loading.next(false));
  }
}
