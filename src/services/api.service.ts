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
    'https://34.233.235.92/piwebapi/assetdatabases/D0Yfc0jetNdUKgzx5SiPQwKAjcpntrnuOUKBew1cDt4krwRUMyQU1BWi1UMU41RUo1XFRFU1RFUw/elements?searchFullHierarchy=true';

  constructor(
    private http: HttpClient,
    private storageService: StorageArvoreService
  ) {}

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

  getData() {
    this.showLoader();
    return this.http
      .get(this.baseUrl, this.httpOptions)
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
