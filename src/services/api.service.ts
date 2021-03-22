import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Arvore, StorageArvoreService } from './storage-arvore.service';
import { AppUtils } from 'src/utils/app.utils';
import { Device } from '@ionic-native/device/ngx';
const prefix = 'https:\\\\';
const sufix = '/piwebapi';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  public baseUrl = this.utils.getStorage('baseUrl');

  setBaseUrl(server: string, config: string) {
    this.baseUrl = `${server}/elements/?path=${config}`;
  }

  constructor(private http: HttpClient,
              public utils: AppUtils,
              public device: Device,
              public storage: StorageArvoreService) { }

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  showLoader() {
    document.getElementById('loader').style.display = 'block';
  }

  hideLoader() {
    document.getElementById('loader').style.display = 'none';
  }

  setAuth(token: string) {
    this.httpOptions.headers = this.httpOptions.headers.delete('Authorization');
    this.httpOptions.headers = this.httpOptions.headers.append(
      'Authorization',
      `Basic ${token}`
    );
  }

  postData(data: any) {
    this.showLoader();
    return this.http
      .post<any>(this.baseUrl, JSON.stringify(data), this.httpOptions)

      .pipe(catchError(this.handleError.bind(this)));
  }

  executeBatch(server: string, data: any) {
    let batchUrl = '/batch';
    let url = `${prefix}${server}${sufix}${batchUrl}`;
    let selectedFieldsParam = new HttpParams();
    return this.post(url, data, selectedFieldsParam).pipe(catchError(this.handleError.bind(this)));
  }

  async executeBatchAsync(server: string, data: any) {
    return await this.executeBatch(server, data).toPromise()
  }


  post(url: string, data: any, params?: HttpParams) {
    this.showLoader();
    let reqOptions = this.httpOptions;

    if (params) {
      reqOptions['params'] = params;
    }

    return this.http
      .post<any>(url, JSON.stringify(data), reqOptions)
      .pipe(catchError(this.handleError.bind(this)));
  }

  put(url: string, data: any) {
    let options = this.httpOptions;

    this.showLoader();
    return this.http
      .put<any>(url, JSON.stringify(data), options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  putData(url: string, data: any) {
    this.showLoader();

    return this.http
      .put<any>(this.baseUrl + url, JSON.stringify(data), this.httpOptions)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getLink(data, name: string, endPoint: string, type: string = 'Links') {
    let item = data;
    if ('Items' in data) {
      let items = data['Items'] as Array<object>;
      if (Array.isArray(items)) {
        item = items.find(
          (item) => item['Path'] == name || item['Name'] == name
        );
      }
    }
    if (item) {
      return item[type][endPoint];
    }
  }

  get(url: string, params: HttpParams = new HttpParams()) {
    this.showLoader();
    return this.http
      .get(url, { ...this.httpOptions, params: params })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // getData() {
  //   this.showLoader();
  //   return this.http
  //     .get(this.baseUrl, this.httpOptions)
  //     .pipe(catchError(this.handleError.bind(this)));
  // }

  getCatagoryParams(categoryName: string): HttpParams {
    let params = new HttpParams();
    params = params.append('searchFullHierarchy', 'true');
    params = params.append('maxCount', '10000');
    params = params.append('categoryName', categoryName);

    return params;
  }

  handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Erro ocorreu no lado do client
      errorMessage = error.error?.message;
    } else {
      // Erro ocorreu no lado do servidor
      errorMessage =
        `Código do erro: ${error.status}, ` + `menssagem: ${error.message}`;
    }
    document.getElementById('loader').style.display = 'none';
    alert(errorMessage);
    this.saveLog(errorMessage);
    return throwError(errorMessage);
  }

  saveLog(errorMessage: string){
    let error = new Arvore();
    error.user = this.utils.getStorage('user');;
    error.date = this.utils.formatDateTimeHours(new Date());
    error.deviceModel = this.device.model;
    error.deviceId = this.device.uuid;
    error.device = this.device.manufacturer;
    error.deviceVersion = this.device.version;
    error.devicePlatform = this.device.platform;
    error.isConnectionError = true;
    error.errorMessage = errorMessage;
    error.AplicacaoID = this.utils.getRandom().toLocaleString();

    this.storage.insertOrUpdate(
      this.storage.writtenLogs,
      error
    )
  }

  async init() {
    let token = await this.utils.getStorage('Authorization');
    this.setAuth(token);
  }
}
