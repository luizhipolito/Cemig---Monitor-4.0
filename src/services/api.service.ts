import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // URL PRODUCTION

  // public baseUrl = './api';

  // URL DEV
  public baseUrl = 'http://localhost:52346';

  constructor(private http: HttpClient) {}

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  showLoader() {
    document.getElementById('loader').style.display = 'block';
  }

  hideLoader() {
    document.getElementById('loader').style.display = 'none';
  }

  postData(url: string, data: any) {
    this.showLoader();
    return this.http
      .post<any>(this.baseUrl + url, JSON.stringify(data), this.httpOptions)
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
      .get<any>(this.baseUrl + url)
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
