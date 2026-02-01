import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgbActiveOffcanvas} from '@ng-bootstrap/ng-bootstrap';
import {NgClass} from '@angular/common';
import {IGroupLocation, LocationDynamicComponent} from '../../location-group';
import {IAddress, IAddressForm} from '../../../models/global';

@Component({
  selector: 'app-create-address',
  templateUrl: 'create-address-modal.component.html',
  styles: [`
    .sheet-body {
      height: 500px;
    }

    .btn-create__address {
      background-color: var(--brand-color);
      border-color: var(--brand-color);
    }
  `],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    FormsModule,
    LocationDynamicComponent
  ]
})

export class CreateAddressModalComponent implements OnInit {
  @Input() initial?: IAddress;
  submitted = false;
  errors: Record<'name' | 'mobile' | 'location' | 'address', string> = {
    name: '', mobile: '', location: '', address: ''
  };

  form!: IAddressForm;

  constructor(
    private fb: FormBuilder,

    public active: NgbActiveOffcanvas,
  ) {
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
      mobile: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^\d{9,11}$/)]),
      address: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(255)]),
      isDefault: this.fb.nonNullable.control(false),
      location: this.fb.group({
        cityId: this.fb.control<number | null>(null, { validators: Validators.required }),
        districtId: this.fb.control<number | null>(null, { validators: Validators.required }),
        wardId: this.fb.control<number | null>(null, { validators: Validators.required }),
        cityName: this.fb.nonNullable.control(''),
        districtName: this.fb.nonNullable.control(''),
        wardName: this.fb.nonNullable.control(''),
      })
    }) as IAddressForm;

    if (this.initial) {
      this.form.patchValue({
        name: this.initial.name ?? '',
        mobile: this.initial.mobile ?? '',
        address: this.initial.address ?? '',
        isDefault: !!this.initial.isDefault,
        location: {
          cityId: this.initial.location?.cityId ?? null,
          districtId: this.initial.location?.districtId ?? null,
          wardId: this.initial.location?.wardId ?? null,
          cityName: this.initial.location?.cityName ?? '',
          districtName: this.initial.location?.districtName ?? '',
          wardName: this.initial.location?.wardName ?? '',
        }
      });
    }
    console.log('initial', this.initial)
  }

  onLocationPicked(val: IGroupLocation): void {
    this.form.controls.location.patchValue({
      cityId: val.cityId,
      districtId: val.districtId,
      wardId: val.wardId,
      cityName: val.cityName,
      districtName: val.districtName,
      wardName: val.wardName,
    });

  }

  showError(ctrlPath: string): boolean {
    const c = this.form.get(ctrlPath);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }


  errorMsg(ctrlPath: string): string {
    const c = this.form.get(ctrlPath);
    if (!c?.errors) return '';
    if (c.errors['required']) return 'Bạn chưa điền đủ thông tin';
    if (c.errors['maxlength']) return 'Vượt quá độ dài cho phép';
    if (c.errors['pattern']) return 'Số điện thoại không hợp lệ';
    return 'Giá trị không hợp lệ';
  }

  showLocationError(): boolean {
    const city = this.form.get('location.cityId');
    const dist = this.form.get('location.districtId');
    const ward = this.form.get('location.wardId');
    const touched = (city?.touched || city?.dirty || dist?.touched || dist?.dirty || ward?.touched || ward?.dirty);
    const invalid = city?.invalid || dist?.invalid || ward?.invalid;
    return !!(touched && invalid);
  }

  get cityId(): number | undefined {
    return (this.form?.get('location.cityId')?.value ?? undefined) as number | undefined;
  }

  get districtId(): number | undefined {
    return (this.form?.get('location.districtId')?.value ?? undefined) as number | undefined;
  }

  get wardId(): number | undefined {
    return (this.form?.get('location.wardId')?.value ?? undefined) as number | undefined;
  }

  // ----- getters tiện dùng trong template -----
  get name() {
    return this.form.get('name') as FormControl;
  }

  get mobile() {
    return this.form.get('mobile') as FormControl;
  }

  get address() {
    return this.form.get('address') as FormControl;
  }

  get locationGroup() {
    return this.form.get('location') as FormGroup;
  }

  get locationInvalid(): boolean {
    const v = this.locationGroup.value as IGroupLocation;
    return !(v?.cityId && v?.districtId && v?.wardId);
  }

  get locationDisplay(): string {
    const v = this.locationGroup.value as IGroupLocation;
    const parts = [v?.wardName, v?.districtName, v?.cityName].filter(Boolean);
    return parts.join(', ');
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid || this.locationInvalid) {
      this.form.markAllAsTouched();
      return;
    }
    const saved = '';

    if (saved) {
      this.active.close(saved);
    }
  }

  onClose() {
    this.active?.dismiss('close');
  }
}
