import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

type GeoResp = {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    admin1?: string;     // tỉnh/thành
    admin2?: string;     // quận/huyện
    admin3?: string;     // phường/xã
    country?: string;
  }>;
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
   * ✅ Cấu hình địa điểm cố định
   * - Nếu bạn đã biết lat/lon của "Trường Tân, Hải Phòng" => điền vào đây và set USE_GEO_FALLBACK=false
   * - Nếu chưa biết => để LAT/LON = null và service sẽ tự geocode 1 lần rồi cache
   */
  private readonly LOCATION = {
    nameForGeocode: 'Trường Tân, Hải Phòng, Việt Nam',
    label: 'Trường Tân, Hải Phòng',
    // ✅ Nếu đã có tọa độ chính xác thì điền vào:
    LAT: null as number | null,
    LON: null as number | null,
    // nếu LAT/LON null thì service tự geocode:
    USE_GEO_FALLBACK: true
  };

  /** Cache geocode (để không gọi lại nhiều lần) */
  private cachedGeo$?: Observable<{ lat: number; lon: number; label: string }>;

  /** Public API: Lấy thời tiết hiện tại cho vị trí cố định */
  getCurrentFixed(): Observable<CurrentWeatherVM> {
    return this.resolveFixedLocation().pipe(
      switchMap((loc) => this.getCurrentWeather(loc.lat, loc.lon).pipe(
        map((w) => ({
          label: loc.label,
          lat: loc.lat,
          lon: loc.lon,
          time: w.time,
          temp: w.temp,
          code: w.code,
          isDay: w.isDay
        }))
      )),
      catchError(() => {
        // fallback cuối cùng (để UI không crash)
        const fallbackLat = 20.8449;   // bạn có thể thay nếu muốn
        const fallbackLon = 106.6881;  // bạn có thể thay nếu muốn
        return of({
          label: this.LOCATION.label,
          lat: fallbackLat,
          lon: fallbackLon,
          time: null,
          temp: null,
          code: null,
          isDay: null
        } as CurrentWeatherVM);
      })
    );
  }

  // -----------------------------
  // Internal helpers
  // -----------------------------

  /** Resolve vị trí cố định: ưu tiên LAT/LON, nếu null thì geocode 1 lần rồi cache */
  private resolveFixedLocation(): Observable<{ lat: number; lon: number; label: string }> {
    // 1) Nếu có sẵn LAT/LON => dùng luôn (ổn định nhất)
    if (this.LOCATION.LAT != null && this.LOCATION.LON != null) {
      return of({
        lat: this.LOCATION.LAT,
        lon: this.LOCATION.LON,
        label: this.LOCATION.label
      });
    }

    // 2) Nếu không có LAT/LON mà không cho phép fallback => trả “tạm”
    if (!this.LOCATION.USE_GEO_FALLBACK) {
      return of({
        lat: 20.8449,
        lon: 106.6881,
        label: this.LOCATION.label
      });
    }

    // 3) Geocode 1 lần + cache
    if (!this.cachedGeo$) {
      this.cachedGeo$ = this.geocodeOnce(this.LOCATION.nameForGeocode).pipe(
        map((g) => {
          // nếu geocode fail => fallback toạ độ tạm
          if (!g) {
            return { lat: 20.8449, lon: 106.6881, label: this.LOCATION.label };
          }
          return g;
        }),
        shareReplay(1)
      );
    }
    return this.cachedGeo$;
  }

  /** Geocode 1 lần để lấy lat/lon */
  private geocodeOnce(locationName: string): Observable<{ lat: number; lon: number; label: string } | null> {
    const url =
      'https://geocoding-api.open-meteo.com/v1/search' +
      `?name=${encodeURIComponent(locationName)}` +
      `&count=1&language=vi&format=json`;

    return this.http.get<GeoResp>(url).pipe(
      map((res) => {
        const r = res?.results?.[0];
        if (!r) return null;

        // label hiển thị ưu tiên rõ ràng (name + admin3/admin2/admin1)
        const labelParts = [
          r.name,
          r.admin3,
          r.admin2,
          r.admin1
        ].filter(Boolean);

        return {
          lat: r.latitude,
          lon: r.longitude,
          label: labelParts.join(', ')
        };
      }),
      catchError(() => of(null))
    );
  }

  /** Lấy thời tiết hiện tại theo lat/lon */
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
