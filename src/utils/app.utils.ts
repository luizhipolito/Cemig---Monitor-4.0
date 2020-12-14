import { Injectable } from '@angular/core';
import { element } from 'protractor';
import { of } from 'rxjs';
import { Attribute } from 'src/model/Attribute.model';
import { EnumModeAttribute } from 'src/model/PIWebAttribute.model';
import { PIWebObject } from 'src/model/PIWebObject.model';

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
      'T00:00';

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
  distinct = (value, index, self) => self.indexOf(value) === index;

  getItems(response: any): Array<PIWebObject> {
    let items = response;
    if ('Items' in response) {
      items = response['Items'] as Array<PIWebObject>;
    }
    return items;
  }

  getValue(
    response: any,
    name: string,
    endPoint: string,
    type: string = 'Links'
  ) {
    let item = response;
    if ('Items' in response) {
      let items = response['Items'] as Array<PIWebObject>;
      if (Array.isArray(items)) {
        item = items.find((item) => item.Path == name || item.Name == name);
      }
    }
    if (item) {
      return item[type][endPoint];
    }
  }

  getWrittenValues(elements: Attribute): PIWebObject[] {
    let writtenValues = new Array<PIWebObject>();

    writtenValues.push(elements.firstSelection);

    writtenValues = writtenValues.concat(
      elements.list.filter(
        (el) =>
          el.visible &&
          (el.mode == EnumModeAttribute.Escrita ||
            el.mode == EnumModeAttribute['Leitura/Escrita'])
      )
    );
    return writtenValues;
  }
}
