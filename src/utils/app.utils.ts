import { Injectable } from '@angular/core';

import { Attribute } from 'src/model/Attribute.model';
import {
  EnumModeAttribute,
  PIWebAttribute,
} from 'src/model/PIWebAttribute.model';
import { PIWebObject } from 'src/model/PIWebObject.model';
import { isNumber } from 'util';

@Injectable({
  providedIn: 'root',
})
export class AppUtils {
  constructor() { }

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

  getWrittenValues(elements: Attribute): Array<PIWebAttribute> {
    let writtenValues = new Array<PIWebAttribute>();

    writtenValues.push(elements.firstSelection);

    writtenValues = writtenValues.concat(
      elements.list.filter(
        (el) =>
          // el.visible
          // &&
          (el.mode == EnumModeAttribute.Escrita ||
            el.mode == EnumModeAttribute['Leitura/Escrita'])
      )
    );

    return writtenValues;
  }
}

export function hasChildren(piwebObj: PIWebObject) {
  return piwebObj.HasChildren;
}

export function isResult(r: any) {
  return (
    r['Status'] == 200 &&
    r['Content'] &&
    r['Content']['Items'] &&
    Array.isArray(r['Content']['Items'])
  );
}

export function firstOrNull() {
  return true;
}

export function createBatch(
  items: Array<PIWebObject>,
  type: string,
  date?: string
) {
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
  if (type == 'update') {
    selectedFieldsParam = '';
    type = 'Value';
  }

  if (type == 'ChildrenValue') {
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
        Value: value,
      });
    }
  });
  return batchItem;
}

export function distinct(value, index, self) {
  return self.indexOf(value) === index;
}

export function compoundBatches(batch1, batch2) {
  for (let key of Object.keys(batch2)) {
    if (key in batch1) {
      let b1Key = Object.keys(batch1).length.toString();
      batch1[b1Key] = batch2[key];
    } else {
      batch1[key] = batch2[key];
    }
  }

  return batch1;
}
