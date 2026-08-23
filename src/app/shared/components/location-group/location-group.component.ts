import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    Renderer2,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { debounceTime, distinctUntilChanged, fromEvent, map, Observable, of, switchMap } from "rxjs";
import { filter } from "rxjs/operators";
import { NgClass, NgStyle } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {AppService} from '../../../core/services';
import {ILocationsSearch, LocationService} from '../../services/location.service';
import {arraysAreEqual, castInt, isArray} from '../../utils';


export interface IGroupLocation {
    cityId: number,
    districtId: number,
    wardId: number,
    cityName: string,
    districtName: string,
    wardName: string
}

interface IDisplayList  {
    value: any;
    label: any;
    selected?: boolean,
}

interface IConfigLocation {
    placeholderInput?: string
    classInput?: string
    label?: string,
    hideWard?: boolean
}

/**
 * Chọn địa chỉ theo nhóm thành phố/quận huyện/phường xã, có tìm kiếm; emit ra Id + name đã chọn.
 */
@Component({
    selector: 'app-location-dynamic',
    templateUrl: 'location-group.component.html',
    styleUrls: ['location-group.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        NgClass,
        FormsModule,
        NgStyle,
    ],
    exportAs: 'LocationGroupDynamic'
})
export class LocationDynamicComponent implements OnInit, AfterViewInit, OnChanges {
    CITY = 1
    DISTRICT = 2
    WARD = 3
    isOpenResult = false
    cities: IDisplayList[] = []
    districts: IDisplayList[] = []
    wards: IDisplayList[] = []
    tabActive = 1
    displayList: IDisplayList[] = []
    locations = {
        cityName: '',
        districtName: '',
        wardName: ''
    }
    valueDisplay = ''
    isLoading = false;
    private valuesString = '[]'; // value dưới dạng string diff
    private isLoadingCity = false
    private isLoadingDistrict = false
    private isLoadingWard = false
    locationsSearch: any = []
    isShowSearch = false
    placeholder = ''

    @Input() styles?: object;
    @Input() cityId?: number;
    @Input() districtId?: number;
    @Input() wardId?: number;
    @Input() config!: IConfigLocation
    @Output() valueChange = new EventEmitter<IGroupLocation>();

    @ViewChild('refSuggest') refSuggest: ElementRef | any;
    @ViewChild('refSelect') refSelect: ElementRef | any;
    @ViewChild('refBoxGroup') refBoxGroup: ElementRef | any;


    configUI: IConfigLocation = {
        placeholderInput: '', // placeholder Input khi không có kết quả, sử dụng khi không muốn dùng label
        classInput: '',
        label: 'common.selectLocation',
    }
    countTab = 3;

    constructor(
        private appService: AppService,
        private locationService: LocationService,
        private renderer: Renderer2
    ) {
    }

    ngOnInit() {
        this._patchConfig();
        this.setTab(this.CITY)
        this.resetSelect()
        this.loadInit()
        this.valuesString = this.createValueString(this.cityId, this.districtId, this.wardId)
    }

    private _patchConfig() {
        if (!this.config) {
            return;
        }
        const {label, classInput, placeholderInput, hideWard} = this.config;
        if (label) {
            this.configUI.label = label
        }
        if (classInput) {
            this.configUI.classInput = classInput
        }
        if (placeholderInput) {
            this.configUI.placeholderInput = placeholderInput
        }
        if (hideWard) {
            this.configUI.hideWard = hideWard
            this.countTab = 2;
        }
    }

    loadInit() {
        this.loadCity()
        if (this.cityId) {
            this.loadDistrict(this.cityId);
            if (this.districtId && !this.config?.hideWard) {
                this.loadWard(this.districtId);
            }
        }
    }

    createValueString(cityId: any, districtId: any, wardId: any) {
        const values = [parseInt(cityId), parseInt(districtId), parseInt(wardId)]
        return JSON.stringify(values);
    }


    ngOnChanges(changes: SimpleChanges) {
        const arrChange = {
            cityId: 0,
            districtId: 0,
            wardId: 0,
        }
        if (changes?.['cityId']) {
            arrChange.cityId = changes?.['cityId'].currentValue
        }
        if (changes?.['districtId']) {
            arrChange.cityId = changes?.['districtId'].currentValue
        }
        if (changes?.['wardId']) {
            arrChange.cityId = changes?.['wardId'].currentValue
        }
        this.valuesString = this.createValueString(arrChange.cityId, arrChange.districtId, arrChange.wardId)
        // nếu bị set value khác, load lại city, district, ward
        this.loadInit()
    }

    ngAfterViewInit() {
        fromEvent(this.refSuggest?.nativeElement, 'keyup')
            .pipe(
                map((v: any) => v.target.value),
                filter(value => value.trim() != ''),
                debounceTime(400),
                distinctUntilChanged(),
                switchMap(text => {
                    return this.getValues(text);
                })
            )
            .subscribe();
        this.hideClickOutside();
    }


    private getValues(text: string): Observable<any> {
        if (text.trim() == '') {
            this._reset();
            return of();
        }
        return this.locationService.searchLocation(text).pipe(map(res => {
            this.locationsSearch = []
            this.isShowSearch = true
            if (res.code) {
                this.locationsSearch = res.data
            }
        }));
    }

    private _reset() {
        this.locationsSearch = []
        this.isShowSearch = false
    }

    hideClickOutside() {
        this.renderer.listen('window', 'mousedown', (e: Event) => {
            if (this.isOpenResult) {
                if (!this.refSuggest.nativeElement.contains(e.target) && !this.refSelect.nativeElement.contains(e.target as Node) &&
                    !this.refBoxGroup.nativeElement.contains(e.target as Node)) {
                    this._close()
                }
            }
        })
    }


    // Mở lần đầu hoặc đã chọn xong hết thì chọn sẵn tab city, xóa value input để cho phép tìm kiếm.
    focusInput() {
        if (!this.isOpenResult) {
            this.moveTabContinue()
        }
        this.setStringDisplay()
        this.valueDisplay = ''
        this.isOpenResult = true
    }

    isValidGroups() {
        if (this.configUI.hideWard){
            return !!(this.cityId && this.districtId);
        }

        return !!(this.cityId && this.districtId && this.wardId);
    }


    loadCity():void {
        if (this.isLoadingCity) return
        this.findValueDefault(this.CITY)
        this.isLoading = true
        this.isLoadingCity = true
        if (this.appService.getTemp('cities')) {
            this.cities = this.appService.getTemp('cities')
            this.setDisplay()
            this.findValueDefault(this.CITY)
            this.isLoading = false
            this.isLoadingCity = false
            return
        }
        this.locationService.loadCities().subscribe({
            next: (res: any) => {
                if (res.code) {
                    const ct: IDisplayList[] = []
                    res.data.map((v: any) => ct.push({label: v.name, value: v.id}))
                    this.cities = [...ct]
                    this.appService.setTemp('cities', ct)
                    this.setDisplay()
                    this.findValueDefault(this.CITY)
                }
            },
            complete: () => {
                this.isLoading = false
                this.isLoadingCity = false
            }
        })
    }

    loadDistrict(cityId: number):void {
        if (this.isLoadingDistrict) return
        this.findValueDefault(this.DISTRICT)
        this.isLoading = true
        this.isLoadingDistrict = true
        if (!cityId) {
            this.districts = []
            this.isLoading = false
            this.isLoadingDistrict = false
            return
        }

        if (this.appService.getTemp('districts')) {
            const district = this.appService.getTemp('districts')
            if (district?.[cityId]) {
                this.districts = district[cityId]
                this.setDisplay()
                this.findValueDefault(this.DISTRICT)
                this.isLoading = false
                this.isLoadingDistrict = false
                return
            }
        }
        this.locationService.loadDistrictsByCityId(cityId).subscribe({
            next: (res: any) => {
                if (res.code) {
                    const dt: IDisplayList[] = []
                    res.data.map((v: any) => dt.push({label: v.name, value: v.id}))
                    this.districts = [...dt]
                    const dtr = this.appService.getTemp('districts')
                    if (dtr) {
                        dtr[cityId] = dt
                        this.appService.setTemp('districts', dtr)
                    } else {
                        this.appService.setTemp('districts', {[cityId]: dtr})
                    }
                    this.setDisplay()
                    this.findValueDefault(this.DISTRICT)
                }
            },
            complete: () => {
                this.isLoading = false
                this.isLoadingDistrict = false
            }
        })
    }

    loadWard(districtId: number): void {
        if (this.isLoadingWard) return
        this.findValueDefault(this.WARD)
        this.isLoading = true
        if (!districtId) {
            this.wards = []
            this.isLoading = false
            this.isLoadingWard = false
        }
        if (this.appService.getTemp('wards')) {
            const wards = this.appService.getTemp('wards')
            if (wards?.[districtId]) {
                this.wards = wards[districtId]
                this.setDisplay()
                this.findValueDefault(this.WARD)
                this.isLoading = false
                this.isLoadingWard = false
                return
            }
        }
        this.locationService.loadWardsByDistrictId(districtId).subscribe({
            next: (res: any) => {
                if (res.code) {
                    const dt: IDisplayList[] = []
                    res.data.map((v: any) => dt.push({label: v.name, value: v.id}))
                    this.wards = [...dt]
                    const dtr = this.appService.getTemp('wards')
                    if (dtr) {
                        dtr[districtId] = dt
                        this.appService.setTemp('wards', dtr)
                    } else {
                        this.appService.setTemp('wards', {[districtId]: dtr})
                    }
                    this.setDisplay()
                    this.findValueDefault(this.WARD)
                }
            },
            complete: () => {
                this.isLoading = false
                this.isLoadingWard = false
            }
        })
    }

    handleChangeTab(tab: number):void {
        if (!this.conditionTab(tab)) return
        this.setTab(tab)
        this.setDisplay()
    }

    conditionTab(tab: number) {
        if (!this.cityId) {
            if (tab == this.DISTRICT || tab == this.WARD) {
                return false
            }
        }
        if (!this.districtId && tab == this.WARD) {
            return false
        }
        return true
    }

    setTab(tab: number) {
        this.tabActive = tab
    }

    findValueDefault(tab: number) {
        let name = ''
        switch (tab) {
            case this.CITY: {
                if (this.cityId) {
                    const indx = this.cities.findIndex((c) => c.value == this.cityId)
                    if (indx >= 0) {
                        name = this.cities[indx].label
                    }
                }
                break
            }
            case this.DISTRICT: {
                if (this.districtId) {
                    const indx = this.districts.findIndex((c) => c.value == this.districtId)
                    if (indx >= 0) {
                        name = this.districts[indx].label
                    }
                }
                break
            }
            case this.WARD: {
                if (this.wardId) {
                    const indx = this.wards.findIndex((c) => c.value == this.wardId)
                    if (indx >= 0) {
                        name = this.wards[indx].label
                    }
                }
                break
            }
        }
        this.setLocationName(tab, name)

    }

    setLocationName(tab: number, name: string) {
        switch (tab) {
            case this.CITY: {
                this.locations.cityName = name
                break
            }
            case this.DISTRICT: {
                this.locations.districtName = name
                break
            }
            case this.WARD: {
                this.locations.wardName = name
                break
            }
        }
        this.setStringDisplay()
    }

    setStringDisplay() {
        this.placeholder = ''
        this.valueDisplay = ''
        if (this.locations.cityName) {
            this.placeholder = this.locations.cityName
            this.valueDisplay = this.locations.cityName
            if (this.locations.districtName) {
                this.placeholder = this.locations.districtName + ', ' + this.placeholder
                this.valueDisplay = this.locations.districtName + ', ' + this.valueDisplay
                if (this.locations.wardName) {
                    this.placeholder = this.locations.wardName + ', ' + this.placeholder
                    this.valueDisplay = this.locations.wardName + ', ' + this.valueDisplay
                }
            }
        }

    }

    choose(item: IDisplayList) {
        this.resetSelect()
        switch (this.tabActive) {
            case this.CITY: {
                this.cityId = castInt(item.value)
                this.locations.cityName = item.label
                this.districtId = undefined
                this.locations.districtName = ''
                this.wardId = undefined
                this.locations.wardName = ''
                this.setTab(this.tabActive + 1)
                this.loadDistrict(item.value)
                break
            }
            case this.DISTRICT: {
                this.districtId = castInt(item.value)
                this.locations.districtName = item.label
                this.wardId = undefined
                this.locations.wardName = ''

                // Chỉ chuyển tab sang xã phường khi không có config ẩn xã phường
                if (!this.configUI.hideWard) {
                    this.setTab(this.tabActive + 1)
                    this.loadWard(item.value)
                }
                break
            }
            case this.WARD: {
                item.selected = true
                this.wardId = castInt(item.value)
                this.locations.wardName = item.label
                break
            }
        }
        this.setStringDisplay()

        if (this.isValidGroups()) {
            // Đóng dropdown khi tab active là WARD, hoặc DISTRICT khi configUI.hideWard
            if (this.tabActive == this.WARD || (this.tabActive == this.DISTRICT && this.configUI.hideWard)) {
                this._close()
            }
        }
    }

    private _close() {
        this.isOpenResult = false
        this.isShowSearch = false
        this.setStringDisplay()
        const dataEmit: IGroupLocation = {
            cityId: castInt(this.cityId ?? 0),
            districtId: castInt(this.districtId ?? 0),
            wardId: castInt(this.wardId ?? 0),
            cityName: this.locations.cityName,
            districtName: this.locations.districtName,
            wardName: this.locations.wardName
        }
        const arrChang = JSON.parse(this.createValueString(dataEmit.cityId, dataEmit.districtId, dataEmit.wardId))
        // check có khác nhau mới emit
        const flagDiff = JSON.parse(this.valuesString)
        if (!arraysAreEqual(flagDiff, arrChang)) {
            this.valueChange.emit(dataEmit)
            this.valuesString = this.createValueString(dataEmit.cityId, dataEmit.districtId, dataEmit.wardId)
        }
    }

    setDisplay() {
        this.displayList = []
        switch (this.tabActive) {
            case this.CITY: {
                this.displayList = [...this.cities]
                this.resetSelect()
                if (this.cityId) {
                    const indx = this.displayList.findIndex((c) => c.value == this.cityId)
                    if (indx >= 0) {
                        this.displayList[indx].selected = true
                        this.locations.cityName = this.displayList[indx].label
                    }
                }
                break
            }
            case this.DISTRICT: {
                this.displayList = [...this.districts]
                this.resetSelect()
                if (this.districtId) {
                    const indx = this.displayList.findIndex((c) => c.value == this.districtId)
                    if (indx >= 0) {
                        this.displayList[indx].selected = true
                        this.locations.districtName = this.displayList[indx].label
                    }
                }
                break
            }
            case this.WARD: {
                this.displayList = [...this.wards]
                this.resetSelect()
                if (this.wardId) {
                    const indx = this.displayList.findIndex((c) => c.value == this.wardId)
                    if (indx >= 0) {
                        this.displayList[indx].selected = true
                        this.locations.wardName = this.displayList[indx].label
                    }
                }
                break
            }
        }
    }

    resetSelect() {
        if (!this.displayList.length) return
        this.displayList.forEach((d) => {
            if (d?.selected) {
                d.selected = false
            }
        })
    }

    resetGroup() {
        this.locations.cityName = ''
        this.locations.districtName = ''
        this.locations.wardName = ''
        this.cityId = 0
        this.districtId = 0
        this.wardId = 0
    }

    chooseItemSearch(locations: ILocationsSearch[]) {
        this.resetSelect()
        this.resetGroup()
        if (isArray(locations) && locations.length) {
            locations.sort((a, b) => b.level - a.level)
            const city = locations[0]
            if (city.matched.id) {
                this.cityId = castInt(city.matched.id)
                this.locations.cityName = city.matched.nativeName ?? ''
                if (locations[1]) {
                    const district = locations[1]
                    if (district.matched.id) {
                        this.districtId = castInt(district.matched.id)
                        this.locations.districtName = district.matched.nativeName ?? ''
                    }
                    if (locations[2]) {
                        const ward = locations[2]
                        if (ward.matched.id) {
                            this.wardId = castInt(ward.matched.id)
                            this.locations.wardName = ward.matched.nativeName ?? ''
                        }
                    }
                }
            }
            this.setStringDisplay()
            this.loadInit()
            if (this.isValidGroups()) {
                this._close()
            } else {
                this.isShowSearch = false
                this.moveTabContinue()
            }
        }
    }

    moveTabContinue() {
        if (!this.cityId || this.isValidGroups()) {
            this.handleChangeTab(this.CITY)
        } else if (!this.districtId) {
            this.handleChangeTab(this.DISTRICT)
        } else if (!this.wardId) {
            this.handleChangeTab(this.WARD)
        }
    }


    clearGroup() {
        this.resetGroup()
        this.setStringDisplay()
        this.moveTabContinue()
        this.resetSelect()
        if(this.refSuggest){
            this.refSuggest.nativeElement.focus();
        }
    }

    isShowButtonClear() {
        return !!(this.isOpenResult && (this.cityId || this.districtId || this.wardId))
    }

    // Chưa chọn gì thì hiện icon search; có giá trị rồi thì ẩn đi, chỉ hiện icon x
    isShowIconSearch() {
        return (this.isOpenResult && !this.placeholder)
    }
}

