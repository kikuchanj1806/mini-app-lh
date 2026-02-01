import {Injectable} from '@angular/core';

export type ZmaInternalAuth = { token: string; expiresAt: string };

@Injectable({ providedIn: 'root' })
export class ZmaTokenStorage {
  private K1 = 'zma.token';
  private K2 = 'zma.expiresAt';

  get(): ZmaInternalAuth | null {
    const token = localStorage.getItem(this.K1);
    const expiresAt = localStorage.getItem(this.K2);
    if (!token || !expiresAt) return null;
    return { token, expiresAt };
  }

  set(v: ZmaInternalAuth) {
    localStorage.setItem(this.K1, v.token);
    localStorage.setItem(this.K2, v.expiresAt);
  }

  clear() {
    localStorage.removeItem(this.K1);
    localStorage.removeItem(this.K2);
  }

  isValid(bufferMs = 60_000): boolean {
    const v = this.get();
    if (!v) return false;
    return Date.now() < new Date(v.expiresAt).getTime() - bufferMs;
  }
}
