import { Injectable } from '@angular/core';

import { Attribute } from 'src/model/Attribute.model';
import { AtributoModel, SubAtributo, ValueObj } from 'src/model/Elemento.model';
import {
  EnumModeAttribute,
  PIWebAttribute,
} from 'src/model/PIWebAttribute.model';
import { PIWebObject } from 'src/model/PIWebObject.model';

export const templateType: string = 'Tipo';
export const firstSelection: string = 'Observação';

@Injectable({
  providedIn: 'root',
})
export class AppUtils {
  constructor() { }

  propFocous: PIWebAttribute;
  minimo: any;
  minimoAlerta: any;
  minimoAtencao: any;
  maximoAtencao: any;
  maximoAlerta: any;
  maximo: any;

  templateRangeScalling = {
    LimitMinimum: 'red',
    'LimitLoLo': 'red',
    'LimitLo': 'yellow',
    'LimitHi': 'white',
    'LimitHiHi': 'yellow',
    LimitMaximum: 'red',
    Over: 'red',
  };

  public isCollapsed: boolean = false;

  saveStorage(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getStorage(key: string) {
    let value = localStorage.getItem(key);
    return JSON.parse(value || null);
  }

  getRandom() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }

  formatDateTimeHours = (d: Date) => {
    var dateStr =
      ('00' + d.getDate()).slice(-2) +
      '/' +
      ('00' + (d.getMonth() + 1)).slice(-2) +
      '/' +
      d.getFullYear() +
      ' Horário: ' + d.getHours() + ':' + ('00' + (d.getMinutes() + 1)).slice(-2);

    return dateStr;
  };

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
            el.mode == EnumModeAttribute['Leitura/Escrita'] ||
            el.mode == EnumModeAttribute['Leitura'] ||
            el.mode == EnumModeAttribute['Leitura/Escrita (Constante)']) ||
          (el.mode == EnumModeAttribute['Escrita (Constante)'] && el.Selected)
      )
    );

    return writtenValues;
  }

  getMode(config: PIWebAttribute[]): EnumModeAttribute {
    let type = config.find((c) => c.Name == templateType);
    if (
      type &&
      type.Value &&
      type.Value.Good &&
      type.Value.Value &&
      type.Value.Value.Name &&
      EnumModeAttribute[type.Value.Value.Name]
    ) {
      return EnumModeAttribute[type.Value.Value.Name];
    }
    return EnumModeAttribute.Leitura;
  }
  
  getModeSubAtributo(config: Array<SubAtributo>): EnumModeAttribute {
    let type = config.find((c) => c.Name == templateType);
    const name = (type?.Value?.Value as ValueObj)?.Name;
    return name && EnumModeAttribute[type.Value.Value.Name] ? EnumModeAttribute[type.Value.Value.Name] : EnumModeAttribute.Leitura;
  }
  
  fillAttrProp(att: AtributoModel){
    let attValue = att.Value;
    let attValueString = '';
    att.Value = attValue;
    if (attValue && attValue.Value) {
      let hasNoData = attValue.Value.Name
      if (attValue.Value.Value) {
        attValueString = attValue.Value.Value;
      } else {
        attValueString = new String(attValue.Value).toString();
      }
      if (hasNoData == 'No Data' || hasNoData == 'Pt Created') {
        attValueString = ''
      }
      if (att.mode == EnumModeAttribute['Leitura/Escrita']) {
        att.Selected = attValueString;
        att.color = this.getColorScalling(att as any);
      }
      if (att.mode == EnumModeAttribute['Leitura/Escrita (Constante)']) {
        att.Selected = attValueString;
        att.color = this.getColorScalling(att as any);
      }
  
  
      if (attValue.UnitsAbbreviation && (attValueString || attValueString == '0')) {
        attValueString = attValueString + ' ' + attValue.UnitsAbbreviation;
      }
    }
    att.ValueString = attValueString;
  }

  getColorScalling(propFocous: PIWebAttribute): string {
    let selectedValue = new Number(propFocous.Selected).valueOf();
    let colorClass = 'black';
    let valueSK = Number.MAX_VALUE;
    this.getAlerts(this.propFocous)
    for (let k of Object.keys(this.templateRangeScalling)) {
      let sk = this.templateRangeScalling[k];
      let config = propFocous.config.find((c) => c?.TraitName == k) as PIWebAttribute;
      if (config && config.Value) {
        valueSK = new Number(config.Value.Value).valueOf();
        // if ((selectedValue <= valueSK) || (valueSK > selectedValue)) {
        //   console.log(sk)
        //   sk = 'green';
        //   return sk;
        // }
      }
      if (this.minimo || this.minimo == 0) {
        if (selectedValue <= this.minimo) {
          console.log(this.minimo)
          sk = 'red';
          return sk;
        }
      }
      if (!this.minimoAtencao && this.minimoAlerta) {
        if (selectedValue <= this.minimoAlerta) {
          console.log(this.minimoAlerta)
          sk = 'red';
          return sk;
        }
      }
      if (this.minimoAtencao && !this.minimoAlerta) {
        if (selectedValue <= this.minimoAtencao) {
          console.log(this.minimoAtencao)
          sk = 'yellow';
          return sk;
        }
      }
      if (this.minimoAtencao && this.minimoAlerta) {
        if (selectedValue > this.minimoAlerta && selectedValue <= this.minimoAtencao) {
          sk = 'yellow';
          return sk;
        }
      }
      if (selectedValue > this.minimo && selectedValue <= this.minimoAlerta) {
        sk = 'red';
        return sk;
      }
      if (this.maximo) {
        if (selectedValue >= this.maximo) {
          sk = 'red';
          return sk;
        }
      }
      if (this.maximoAtencao && this.maximoAlerta) {
        if (selectedValue >= this.maximoAtencao && selectedValue < this.maximoAlerta) {
          sk = 'yellow';
          return sk;
        }
      }

      if (this.maximoAlerta) {
        if (selectedValue >= this.maximoAlerta && selectedValue < this.maximo) {
          sk = 'red';
          return sk;
        }
      }
      if (this.maximoAlerta && !this.maximo) {
        if (selectedValue >= this.maximoAlerta) {
          sk = 'red';
          return sk;
        }
      }
      if (this.maximoAtencao && !this.maximoAlerta) {
        if (selectedValue >= this.maximoAtencao) {
          sk = 'yellow';
          return sk;
        }
      }
    }
    // if (selectedValue >= valueSK && valueSK > 0) {
    //   return this.templateRangeScalling.Over;
    // }
    return colorClass;
  }

  getAlerts(propFocous: PIWebAttribute) {
    this.maximo = null;
    this.maximoAlerta = null;
    this.maximoAtencao = null;
    this.minimo = null;
    this.minimoAlerta = null;
    this.minimoAtencao = null;
    for (let k of Object.keys(this.templateRangeScalling)) {
      if (propFocous) {
        let config = propFocous.config.find((c) => c?.TraitName == k) as PIWebAttribute;
        if (config && config.Name && !config.Value.Value.Name) {
          if (config.TraitName === 'LimitMinimum') {
            this.minimo = config.Value.Value;
          }

          if (config.TraitName === 'LimitLoLo') {
            this.minimoAlerta = config.Value.Value;
          }

          if (config.TraitName === 'LimitLo') {
            this.minimoAtencao = config.Value.Value;
          }

          if (config.TraitName === 'LimitHi') {
            this.maximoAtencao = config.Value.Value;
          }

          if (config.TraitName === 'LimitHiHi') {
            this.maximoAlerta = config.Value.Value;
          }

          if (config.TraitName === 'LimitMaximum') {
            this.maximo = config.Value.Value;
          }
        }

      }
    }
  }
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
  date?: string,
) {
  let batchItem = {};
  let method = type == 'update' ? 'PUT' : 'GET';

  let selectedFieldsParam =
    '?selectedFields=Items.WebId;Items.Description;Items.Name;Items.Path;Items.Type;Items.TypeQualifier;Items.HasChildren;Items.Links.Attributes;Items.Links.Value;Items.TraitName';

  if (type == 'Value') {
    selectedFieldsParam =
      '?selectedFields=Items.Description;Items.Name;Items.Value;Items.Path;Items.HasChildren;Items.TraitName';
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
      // var teste = "";
      // if (item.mode == 'Escrita' || item.mode == 'LeituraEscrita') {
      //   batchItem[index]['Method'] = 'POST';
      // } else {
      //   batchItem[index]['Method'] = 'PUT';
      // }

      batchItem[index]['Method'] = 'POST';

      let value =
        item['Selected'] && item['Selected']['Value']
          ? item['Selected']['Value']
          : item['Selected'];
      // if (!isNaN(value)) {
      //   value = new Number(value).valueOf();
      // }
      if (value == null) {
        // console.log("null");
        // console.log(item);
        value = {
          Name: "No Data",
          Value: 248,
          IsSystem: true
        }
      } else {
        // console.log("not null");
        // console.log(item);
      }
      // console.log(item.mode + " " + teste);
      // console.log("*********");
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

export function b64toBlob(b64Data, contentType='', sliceSize=512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
}