import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { StorageArvoreService } from './storage-arvore.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  public baseUrl =
    'https://34.233.235.92/piwebapi/elements/E0Yfc0jetNdUKgzx5SiPQwKAKWkZ-0ID6xGDTA46LyNIOwRUMyQU1BWi1UMU41RUo1XFRFU1RFU1xDRU1JRyAtIEdFUsOKTkNJQSBERSBTRUdVUkFOw4dBIERFIEJBUlJBR0VOUyBFIE1BTlVURU7Dh8ODTyBDSVZJTFxVU0lOQVM/elements';

  constructor(
    private http: HttpClient,
    private storageService: StorageArvoreService
  ) {
    // let options = {
    //   headers: new HttpHeaders({
    //     Authorization: 'Basic UGlVc2VyOmlobTEyMyFAIw==',
    //   }),
    // };
    // this.http.get(this.baseUrl, options).subscribe(console.log);
  }

  // loadConfig() {
  //   this.storageService
  //     .getConfig('baseUrl')
  //     .then((result) => (this.baseUrl = result));
  //   console.log('url', this.baseUrl);
  // }

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
    this.httpOptions.headers = this.httpOptions.headers.append(
      'Authorization',
      `Basic ${token}`
    );
  }

  postData(data: any) {
    this.showLoader();
    console.log(this.httpOptions);
    return this.http
      .post<any>(this.baseUrl, JSON.stringify(data), this.httpOptions)

      .pipe(retry(2), catchError(this.handleError));
  }

  putData(url: string, data: any) {
    this.showLoader();
    return this.http
      .put<any>(this.baseUrl + url, JSON.stringify(data), this.httpOptions)
      .pipe(retry(2), catchError(this.handleError));
  }

  getData(url: string) {
    this.showLoader();
    return this.http
      .get<any>(this.baseUrl, this.httpOptions)
      .pipe(retry(2), catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Erro ocorreu no lado do client
      errorMessage = error.error.message;
    } else {
      // Erro ocorreu no lado do servidor
      errorMessage =
        `Código do erro: ${error.status}, ` + `menssagem: ${error.message}`;
    }
    document.getElementById('loader').style.display = 'none';
    alert(errorMessage);
    return throwError(errorMessage);
  }
}
