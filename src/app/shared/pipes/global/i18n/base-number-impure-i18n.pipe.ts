import {Subscription} from "rxjs";
import {BusinessI18nService, IBusinessI18nConfig} from '../../../../core/libs';


/**
 * Base abstract class cho các pipe impure dùng chung config & cache
 */
export abstract class BaseNumberImpureI18nPipe<TOpts> {

  protected configs: IBusinessI18nConfig;
  protected sub?: Subscription;

  // Cache
  protected lastValue: any;
  protected lastOpts?: TOpts;
  protected lastConfigsRef?: IBusinessI18nConfig;
  protected lastResult: string | null = null;

  constructor(
    protected businessI18nService: BusinessI18nService
  ) {
    this.configs = this.businessI18nService.getLocaleConfigs();

    // Lắng nghe thay đổi config (1 subscription duy nhất); lần transform() tới nếu config ref
    // thay đổi thì sẽ format lại.
    this.sub = this.businessI18nService.configs$.subscribe(newConfigs => {
      this.configs = newConfigs;
    });
  }

  public destroy(): void {
    this.sub?.unsubscribe();
  }

  transform(value: any, opts?: TOpts): string | null {
    if (
      this.lastConfigsRef === this.configs &&
      this.lastValue === value &&
      this.isSameOpts(this.lastOpts, opts)
    ) {
      return this.lastResult;
    }

    const result = this.formatValue(value, opts);

    this.lastConfigsRef = this.configs;
    this.lastValue = value;
    this.lastOpts = opts;
    this.lastResult = result;

    return result;
  }

  protected abstract formatValue(value: any, opts?: TOpts): string | null;

  /** So sánh 2 `opts`; mặc định shallow check, pipe con override nếu cần so sánh sâu hơn. */
  protected isSameOpts(oldOpts?: TOpts, newOpts?: TOpts): boolean {
    return oldOpts === newOpts;
  }

}
