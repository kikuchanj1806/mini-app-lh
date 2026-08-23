import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
  class?: string;
  type?: string;
};

type ForecastResp = {
  current?: {
    time: string;
    temperature_2m: number;
    weather_code?: number;
    is_day?: number;
  };
};

export type CurrentWeatherVM = {
  label: string;
  lat: number;
  lon: number;
  time: string | null;
  temp: number | null;
  code: number | null;
  isDay: boolean | null;
};

@Injectable({ providedIn: 'root' })
export class WeatherService {
  constructor(private http: HttpClient) {}

  /**
   * Cache geocode theo TÊN ĐỊA DANH.
   *
   * Trước đây toạ độ Long Hưng được viết cứng ở service này, nên mọi xã dùng chung bản build
   * đều thấy thời tiết của Long Hưng. Nay địa danh do admin từng xã nhập
   * (site_settings.weather_location).
   */
  private geoCache = new Map<string, Observable<{ lat: number; lon: number; label: string } | null>>();

  /**
   * Thời tiết hiện tại theo tên địa danh, vd "Long Hưng, Hưng Yên".
   *
   * Không tra được toạ độ thì trả VM rỗng (temp/code = null) kèm nhãn gốc — màn hình hiện
   * "Không lấy được thời tiết" thay vì lặng lẽ hiện thời tiết của một nơi khác.
   */
  getCurrentByLocationName(locationName: string): Observable<CurrentWeatherVM> {
    const name = (locationName || '').trim();
    const empty: CurrentWeatherVM = {
      label: name, lat: 0, lon: 0, time: null, temp: null, code: null, isDay: null,
    };

    if (!name) return of(empty);

    return this.resolveLocation(name).pipe(
      switchMap((loc) => {
        if (!loc) return of(empty);

        return this.getCurrentWeather(loc.lat, loc.lon).pipe(
          map((w) => ({
            label: loc.label || name,
            lat: loc.lat,
            lon: loc.lon,
            time: w.time,
            temp: w.temp,
            code: w.code,
            isDay: w.isDay,
          })),
          catchError(() => of({ ...empty, label: loc.label || name, lat: loc.lat, lon: loc.lon })),
        );
      }),
      catchError(() => of(empty)),
    );
  }

  private resolveLocation(name: string): Observable<{ lat: number; lon: number; label: string } | null> {
    const cached = this.geoCache.get(name);
    if (cached) return cached;

    const geo$ = this.geocodeOnce(name).pipe(
      catchError(() => of(null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.geoCache.set(name, geo$);
    return geo$;
  }

  /**
   * Geocode 1 lần để lấy lat/lon — dùng Nominatim (OpenStreetMap), KHÔNG dùng geocoder của
   * Open-Meteo dù cùng nhà cung cấp thời tiết bên dưới.
   *
   * Lý do: geocoder Open-Meteo (nền GeoNames) không hiểu định dạng "Xã, Tỉnh" admin xã hay nhập
   * (vd "Long Hưng, Hưng Yên" trả về 0 kết quả), và dữ liệu hành chính cấp xã của họ chưa cập
   * nhật theo đợt sáp nhập xã/phường 2025 — nhiều xã mới hoàn toàn không có trong CSDL của họ.
   * Nominatim vừa hiểu định dạng "Xã, Tỉnh", vừa có ranh giới hành chính mới hơn (cộng đồng OSM
   * cập nhật nhanh). Bước lấy nhiệt độ vẫn giữ Open-Meteo vì chỉ cần lat/lon, không phụ thuộc tên
   * địa danh.
   */
  private geocodeOnce(locationName: string): Observable<{ lat: number; lon: number; label: string } | null> {
    const url =
      'https://nominatim.openstreetmap.org/search' +
      `?q=${encodeURIComponent(locationName)}` +
      `&format=json&limit=5&accept-language=vi&countrycodes=vn`;

    return this.http.get<NominatimResult[]>(url).pipe(
      map((res) => {
        // Nominatim xếp hạng theo độ "nổi tiếng" (importance) lẫn độ khớp tên, nên kết quả đầu
        // tiên đôi khi là một nơi to hơn, nổi hơn nhưng KHÔNG khớp tên admin nhập (vd nhập
        // "Long Hưng, Hưng Yên" ra "Thành phố Hưng Yên" xếp đầu vì nổi tiếng hơn, còn "Xã Long
        // Hưng" xếp thứ 2). Ưu tiên đơn vị hành chính hiện hành (`boundary`/`administrative`)
        // thay vì lấy mù kết quả đầu tiên.
        const admin = res?.find((it) => it.class === 'boundary' && it.type === 'administrative');
        const r = admin ?? res?.[0];
        if (!r) return null;

        const lat = Number(r.lat);
        const lon = Number(r.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

        // display_name luôn có ", Việt Nam" ở cuối — bỏ đi cho gọn, phần còn lại (xã, tỉnh) đã đủ rõ.
        const label = (r.display_name || locationName)
          .split(', ')
          .filter((part) => part !== 'Việt Nam')
          .join(', ');

        return { lat, lon, label };
      }),
      catchError(() => of(null))
    );
  }

  private getCurrentWeather(lat: number, lon: number): Observable<{
    time: string | null;
    temp: number | null;
    code: number | null;
    isDay: boolean | null;
  }> {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,is_day` +
      `&timezone=Asia%2FBangkok`;

    return this.http.get<ForecastResp>(url).pipe(
      map((res) => ({
        time: res?.current?.time ?? null,
        temp: res?.current?.temperature_2m ?? null,
        code: res?.current?.weather_code ?? null,
        isDay: res?.current?.is_day == null ? null : res.current.is_day === 1
      })),
      catchError(() => of({ time: null, temp: null, code: null, isDay: null }))
    );
  }
}
