import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppUtils {
  constructor() {}

  public isCollapsed: boolean = false;
  public usuarioLogado: any;

  saveStorage(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getStorage(key: string) {
    let value = localStorage.getItem(key);
    return JSON.parse(value || null);
  }

  formatDateTime = (d: Date) => {
    var dateStr =
      d.getFullYear() +
      '-' +
      ('00' + (d.getMonth() + 1)).slice(-2) +
      '-' +
      ('00' + d.getDate()).slice(-2) +
      'T' +
      ('00' + d.getHours()).slice(-2) +
      ':' +
      ('00' + d.getMinutes()).slice(-2);

    return dateStr;
  };

  removeStorgare(key: string) {
    localStorage.removeItem(key);
  }

  pad(num) {
    if (num < 10) {
      return '0' + num;
    } else {
      return '' + num;
    }
  }

  firstOrNull = () => true;
}
