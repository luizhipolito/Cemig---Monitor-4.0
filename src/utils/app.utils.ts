import { Injectable } from '@angular/core';
import { of } from 'rxjs';
// import { saveAs } from 'file-saver';

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

  convertStringTimeToValue = (stringTime: string): number => {
    let timeValue = new Date(stringTime).toLocaleTimeString().split(':');

    let valueOfDuration =
      parseInt(timeValue[0]) * 3600 +
      parseInt(timeValue[1]) * 60 +
      parseInt(timeValue[2]);

    return valueOfDuration;
  };

  convertValueToStringTime = (value: number): string => {
    const timeValue = value; // / 10;
    let result = [
      this.pad(Math.floor(timeValue / 3600)),
      this.pad(Math.floor(timeValue / 60) % 60),
      this.pad(Math.floor(timeValue % 60)),
    ].join(':');

    return result;
  };

  nl2br = (str) => {
    return str.replace(/(?:\r\n|\r|\n)/g, '<br>');
  };

  exportDataToCsv = (data: any[], fileName: string) => {
    var csv = '';
    var keys =
      (data[0] && Object.keys(data[0])).filter((r) => r != '$$hashKey') || [];
    csv += keys.join(';') + '\n';
    for (var line of data) {
      csv +=
        keys
          .map((key) => {
            return line[key];
          })
          .join(';') + '\n';
    }

    // saveAs(
    //   new Blob([this.stringToArrayBuffer(csv)], {
    //     type: 'application/octet-stream',
    //   }),
    //   fileName
    // );
  };

  stringToArrayBuffer(s) {
    let buf = new ArrayBuffer(s.length);
    let view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  }
}
