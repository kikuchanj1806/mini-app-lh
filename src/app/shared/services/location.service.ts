import { Injectable } from "@angular/core";
import {ApiService} from '../../core/services';
import {IResponseApi} from '../../core/models';


export interface ILocation {
  id?: number,
  level: number,
  parentId: number,
  code?: string,
  telephoneCode?: string,
  englishName?: string,
  nativeName?: string,
  otherName?: string,
  latitude?: string,
  longitude?: string,
  order?: number,
  status?: number,
  nameUniqueCode?: string,
}

export interface IResLocation {
  id: number,
  name: string,
  parentId?: number
}

export interface ILocationsSearch {
  level: number,
  matched: ILocation
}


const URI_LOCATION_API = '/zma/store/location';

@Injectable({
    providedIn: 'any'
})
export class LocationService extends ApiService {

    loadCities(params = {}) {
        return this.post<IResponseApi<IResLocation[]>>(URI_LOCATION_API, {
            type: 'CITY',
            ...params
        });
    }

    loadDistrictsByCityId(parentId: number) {
        return this.post<IResponseApi<IResLocation[]>>(URI_LOCATION_API, {
            type: 'DISTRICT',
            parentId
        });
    }

    loadWardsByDistrictId(parentId: number) {
        return this.post<IResponseApi<IResLocation[]>>(URI_LOCATION_API, {
            type: 'WARD',
            parentId
        });
    }

    searchLocation(query = '') {
        return this.post<IResponseApi<ILocationsSearch[]>>(URI_LOCATION_API, {
            type: 'SEARCH',
            query
        });
    }

    loadCountry(params = {}) {
        return this.post<IResponseApi<IResLocation[]>>(URI_LOCATION_API, {
            type: 'COUNTRY',
            ...params
        });
    }

}
