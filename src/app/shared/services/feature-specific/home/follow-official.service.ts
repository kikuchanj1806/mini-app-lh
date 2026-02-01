import { Injectable, inject } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { catchError, mapTo, switchMap } from 'rxjs/operators';
import { followOA } from 'zmp-sdk/apis';
import {UserService} from '../../../../core/services';

export type FollowOAResult = 'already' | 'bypass' | 'followed' | 'denied' | 'error';

@Injectable({ providedIn: 'root' })
export class FollowOfficialService {
  private readonly users = inject(UserService);

  follow$(oaId: string, opts?: { devBypass?: boolean }): Observable<FollowOAResult> {
    const devBypass = !!opts?.devBypass;

    const stored = this.users.userInfoValue;
    if (stored?.followedOA) return of('already' as const);

    if (devBypass) {
      return this.saveFollowedFlag$(stored).pipe(mapTo('bypass' as const));
    }

    return from(followOA({ id: oaId })).pipe(
      switchMap(() => this.saveFollowedFlag$(stored).pipe(mapTo('followed' as const))),
      catchError((err: any) => {
        if (err?.code === -201) return of('denied' as const);
        return of('error' as const);
      })
    );
  }

  private saveFollowedFlag$(stored: any): Observable<void> {
    const base = stored ?? {
      id: '',
      idByOA: '',
      name: '',
      avatar: '',
      phoneNumber: '',
      isSensitive: false,
      followedOA: false,
    };

    const updated = { ...base, followedOA: true };

    return this.users.setUserInfo$(updated).pipe(mapTo(void 0));
  }
}
