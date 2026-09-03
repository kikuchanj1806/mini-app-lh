// mapping cơ bản theo WMO Weather interpretation codes
export function mapWeatherCodeToText(code: number | null): string {
  if (code == null) return 'Không xác định';
  if (code === 0) return 'Trời quang';
  if ([1, 2, 3].includes(code)) return 'Mây rải rác';
  if ([45, 48].includes(code)) return 'Sương mù';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Mưa phùn';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Mưa';
  if ([71, 73, 75, 77].includes(code)) return 'Tuyết';
  if ([80, 81, 82].includes(code)) return 'Mưa rào';
  if ([95, 96, 99].includes(code)) return 'Dông';
  return 'Thời tiết thay đổi';
}

export function mapWeatherCodeToIconClass(code: number | null): string {
  if (code == null) return 'wx-cloud';
  if (code === 0) return 'wx-sun';
  if ([1, 2, 3].includes(code)) return 'wx-cloud';
  if ([45, 48].includes(code)) return 'wx-fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'wx-drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'wx-rain';
  if ([71, 73, 75, 77].includes(code)) return 'wx-snow';
  if ([80, 81, 82].includes(code)) return 'wx-shower';
  if ([95, 96, 99].includes(code)) return 'wx-thunder';
  return 'wx-cloud';
}
