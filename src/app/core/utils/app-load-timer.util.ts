import {BehaviorSubject, Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {environment} from '../../../environments';

/**
 * Đo thời gian load app lần đầu (bootstrap main.ts -> trang chủ có đủ dữ liệu). Không ảnh hưởng
 * hành vi app.
 *
 * Build test trên Zalo thật luôn dùng cấu hình `production` (xem angular.json) nên
 * `environment.production` luôn là `true` — không thể tự bật đo theo env như khi `ng serve`. Vì
 * vậy đo được bật thêm bằng 1 cờ thủ công lưu localStorage, bật qua query param `?perfdebug=1`
 * trên URL mở mini app (tắt lại bằng `?perfdebug=0` hoặc nút "Tắt" trên overlay).
 */

export interface LoadMark {
  name: string;
  t: number;
}

const PERF_DEBUG_KEY = 'hcc_perf_debug';

function readManualFlag(): boolean {
  try {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('perfdebug');
    if (fromQuery === '1') localStorage.setItem(PERF_DEBUG_KEY, '1');
    if (fromQuery === '0') localStorage.removeItem(PERF_DEBUG_KEY);
    return localStorage.getItem(PERF_DEBUG_KEY) === '1';
  } catch {
    return false;
  }
}

export const perfDebugEnabled = !environment.production || readManualFlag();

/** Tắt overlay đo (xoá cờ thủ công) — có hiệu lực từ lần mở app kế tiếp. */
export function disablePerfDebug(): void {
  try {
    localStorage.removeItem(PERF_DEBUG_KEY);
  } catch {
  }
}

const marks: LoadMark[] = [];
const marksSubject = new BehaviorSubject<LoadMark[]>(marks);
/** Danh sách mốc, cập nhật realtime — overlay debug subscribe vào đây để hiển thị trên màn hình. */
export const appLoadMarks$: Observable<LoadMark[]> = marksSubject.asObservable();

let pending = new Set<string>();

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** Ghi 1 mốc thời gian, tính từ lúc JS bundle bắt đầu chạy (main.ts). */
export function markAppLoad(name: string, extra?: Record<string, unknown>): void {
  if (!perfDebugEnabled) return;
  const t = now();
  marks.push({name, t});
  marksSubject.next([...marks]);
  console.log(`[perf-app-load] +${t.toFixed(0)}ms  ${name}`, extra ?? '');
}

/**
 * Khai báo tập tác vụ song song cần chờ để coi là "trang chủ sẵn sàng" — gọi 1 lần trước khi
 * bắn các request load trang chủ. Khi tất cả tác vụ trong danh sách đã hoàn tất (kể cả lỗi),
 * tự in bảng tổng kết ra console.
 */
export function trackHomeLoads(names: string[]): void {
  if (!perfDebugEnabled) return;
  pending = new Set(names);
  markAppLoad('home:loads-start', {count: names.length});
}

/** Đánh dấu 1 tác vụ trong `trackHomeLoads` đã xong — dùng cho nhánh không đi qua observable
 * (VD: bỏ qua load thời tiết vì chưa cấu hình địa danh). */
export function markLoadDone(name: string): void {
  if (!perfDebugEnabled) return;
  pending.delete(name);
  if (pending.size === 0) {
    markAppLoad('home:all-loaded');
    printAppLoadSummary();
  }
}

/**
 * Đo 1 APP_INITIALIZER — khâu CHẶN render, app trắng màn cho tới khi nó xong.
 *
 * Tách riêng khỏi `measureLoad` vì tuyệt đối KHÔNG được đụng tới hàng đợi `pending` của trang chủ:
 * lúc initializer chạy thì `trackHomeLoads` chưa được gọi nên `pending` còn rỗng, gọi
 * `markLoadDone` ở đây sẽ khiến `pending.size === 0` và in bảng tổng kết quá sớm.
 */
export function measureInit<T>(name: string, source: Observable<T>): Observable<T>;
export function measureInit<T>(name: string, source: Promise<T>): Promise<T>;
export function measureInit<T>(name: string, source: Observable<T> | Promise<T>): Observable<T> | Promise<T> {
  if (!perfDebugEnabled) return source;

  const start = now();
  markAppLoad(`${name}:start`);
  const done = () => markAppLoad(`${name}:done`, {ms: Math.round(now() - start)});

  if (source instanceof Promise) {
    return source.then(
      (value) => {
        done();
        return value;
      },
      (err) => {
        done();
        throw err;
      },
    );
  }

  return source.pipe(finalize(done));
}

/**
 * Bọc quanh 1 observable load (banner, tin tức, thời tiết, ...) để tự ghi mốc bắt đầu/kết thúc
 * và báo hoàn tất cho `trackHomeLoads`. Dùng trong `.pipe(measureLoad('bannerTop'), ...)`.
 */
export function measureLoad<T>(name: string) {
  return (source: Observable<T>): Observable<T> => {
    if (!perfDebugEnabled) return source;
    const start = now();
    markAppLoad(`${name}:start`);
    return source.pipe(
      finalize(() => {
        markAppLoad(`${name}:done`, {ms: Math.round(now() - start)});
        markLoadDone(name);
      }),
    );
  };
}

export function printAppLoadSummary(): void {
  if (!perfDebugEnabled || marks.length === 0) return;
  const rows = marks.map((m, i) => ({
    'mốc': m.name,
    'thời điểm (ms)': Math.round(m.t),
    'cách mốc trước (ms)': i === 0 ? 0 : Math.round(m.t - marks[i - 1].t),
  }));
  console.log('[perf-app-load] ===== Tổng thời gian load app (lần đầu vào) =====');
  console.table(rows);
  console.log(`[perf-app-load] Tổng: ${Math.round(marks[marks.length - 1].t)}ms kể từ khi bundle main.ts bắt đầu chạy`);
}
