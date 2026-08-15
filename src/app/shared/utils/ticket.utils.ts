type TicketDateInput = string | number | Date | null | undefined;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function fromUnixLike(value: number): Date | null {
  if (!Number.isFinite(value)) return null;

  const milliseconds = value > 1e12 ? value : value * 1000;
  const date = new Date(milliseconds);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseTicketDate(input: TicketDateInput): Date | null {
  if (input == null || input === '') return null;

  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === 'number') {
    return fromUnixLike(input);
  }

  const raw = String(input).trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    return fromUnixLike(Number(raw));
  }

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  }

  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) {
    return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeTicketDateYmd(input: TicketDateInput): string | undefined {
  const date = parseTicketDate(input);
  if (!date) return undefined;

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatTicketNumber(
  orderNumber: string | number | null | undefined,
  dateInput?: TicketDateInput
): string {
  const order = Number(orderNumber ?? 0);
  if (!Number.isFinite(order) || order <= 0) return '---';

  const date = parseTicketDate(dateInput) ?? new Date();
  const serial = String(Math.trunc(order)).padStart(3, '0');

  return `${pad2(date.getDate())}${pad2(date.getMonth() + 1)}${serial}`;
}
