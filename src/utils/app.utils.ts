import { Injectable } from '@angular/core';

import { Attribute } from 'src/model/Attribute.model';
import { EnumModeAttribute } from 'src/model/PIWebAttribute.model';
import { PIWebObject } from 'src/model/PIWebObject.model';
import { isNumber } from 'util';

@Injectable({
  providedIn: 'root',
})
export class AppUtils {
  constructor() {}

  public isCollapsed: boolean = false;

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

  createBatch(items: Array<PIWebObject>, type: string, date?: string) {
    let batchItem = {};
    let method = type == 'update' ? 'PUT' : 'GET';

    let selectedFieldsParam =
      '?selectedFields=Items.WebId;Items.Description;Items.Name;Items.Path;Items.Type;Items.TypeQualifier;Items.HasChildren;Items.Links.Attributes;Items.Links.Value';

    if (type == 'Value') {
      selectedFieldsParam =
        '?selectedFields=Items.Name;Items.Value;Items.Path;Items.HasChildren';
    }
    if (type == 'EnumerationSets') {
      selectedFieldsParam = '';
      type = 'Values';
    }
    if (type == 'ChildrenValue' || type == 'update') {
      selectedFieldsParam = '';
      type = 'Value';
    }

    items.forEach((item, index) => {
      let url = `${item.Links[type]}${selectedFieldsParam}`;
      batchItem[index] = {
        Method: method,
        Resource: url,
      };

      if (method == 'PUT') {
        batchItem[index]['Method'] = 'POST';
        let value =
          item['Selected'] && item['Selected']['Value']
            ? item['Selected']['Value']
            : item['Selected'];

        if (!isNaN(value)) {
          value = new Number(value).valueOf();
        }

        batchItem[index]['Content'] = JSON.stringify({
          Timestamp: date,
          // UnitsAbbreviation: '',
          // Good: true,
          // Questionable: false,
          Value: value,
        });
      }
    });
    return batchItem;
  }
}
