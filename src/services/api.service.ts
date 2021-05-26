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
import { AppUtils, firstSelection } from 'src/utils/app.utils';
import { Device } from '@ionic-native/device/ngx';
import { ResponseBatch } from 'src/model/ResponseBatch.model';
import { Atributo, AtributoModel, Elemento, SubAtributo, Value, ValueObj } from 'src/model/Elemento.model';
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

  async getElements(url, webId, categoryNameElement, categoryNameAttr, pathSearch){
    const data = await this.get(this.getUrlCount(url, webId, categoryNameElement)).toPromise();
    const count = data?.Items?.length ? data?.Items?.length : 0;

    var intervals = this.splitEachHundred(count);

    let promises: Array<Promise<ResponseBatch>> = intervals.map(interval => {
      const body = this.getDataBatch(interval.start, interval.end - interval.start, url, webId, categoryNameElement, categoryNameAttr);
      return this.http.post<ResponseBatch>(`${url}/batch`, JSON.stringify(body), this.httpOptions).toPromise();
    })

    var result = await Promise.all(promises);
    return this.parseResult(result, pathSearch);
  }

  parseResult(result: Array<ResponseBatch>, pathSearch: string): Array<Elemento> {
    let elements: Array<Elemento> = [];
    
    result.forEach(itemResult => {
      let elementos = itemResult?.Elementos?.Content?.Items;
      elementos = elementos ? elementos : [];
      let attributoCount = 0;
      let subAttributoCount = 0;

      elementos.forEach((el, index) => {
        let attributos = itemResult?.Atributos?.Content?.Items[index]?.Content?.Items;
        attributos = attributos ? attributos : [];
        let attributes: Array<AtributoModel> = [];
        let firstSelectionAttr = new AtributoModel();

        attributos.forEach(attr => {
          const path = `${el.Path}|${attr.Name}`;
          const subAttrResponse = this.getSubAttributes(itemResult, attributoCount, subAttributoCount, path, attr.DefaultUnitsNameAbbreviation);
          subAttributoCount = subAttrResponse.subAttributoCount;

          let _attr: AtributoModel  = {
            WebId: attr.WebId,
            Name: attr.Name,
            Description: attr.Description,
            Path: path,
            Type: attr.Type,
            TypeQualifier: attr.TypeQualifier,
            TraitName: null,
            config: subAttrResponse.subAttributes,
            mode: this.utils.getModeSubAtributo(subAttrResponse.subAttributes),
            Value: this.getAttributeValue(itemResult, attributoCount, attr.DefaultUnitsNameAbbreviation),
            Selected: null,
            color: null,
            ValueString: null
          };

          // here will fill Selected, color and ValueString
          this.utils.fillAttrProp(_attr);

          attributes.push(_attr);

          if(attr.Name == firstSelection) {
            firstSelectionAttr = _attr;
          }

          attributoCount++;
        });

        attributes.sort((a, b) => {
          let indexA = a.config.find(i => i.Name == 'Indexe');
          let indexB = b.config.find(i => i.Name == 'Indexe');

          if (indexA && indexB && indexA.Value && indexB.Value)
            return indexA.Value.Value < indexB.Value.Value ? -1 : 1;
          return 1;
        });

        const relativePath = el.Path.replace(pathSearch, "");

        let atributo: Atributo = {
          WebId: el.WebId,
          RelativePath: relativePath,
          firstSelection: firstSelectionAttr,
          list: attributes
        };

        elements.push({
          name: el.Name,
          AplicacaoID: el.WebId,
          relativePath: relativePath,
          Caminho: relativePath.split("\\").filter(x => x),
          atributos: atributo
        });
      });

      console.log(attributoCount);
      console.log(subAttributoCount);
      console.log("*********");
    });

    return elements;
  }
  getAttributeValue(itemResult: ResponseBatch, attributoCount: number, uom: string): Value  {
    const itemValue = itemResult?.ValoresAtributos?.Content?.Items[attributoCount];
    const valueResponse = itemValue?.Content?.Value as any;
    return this.commonGetValue(valueResponse, itemValue?.Status, uom);
  }

  commonGetValue(valueResponse, status: number, uom: string): Value{
    let attrValue = new Value();
    const isGood = status == 200 || status == 207;

    if(valueResponse && valueResponse.hasOwnProperty("Value")) {
      let _valueResponse = valueResponse as ValueObj;
      attrValue = {
        Timestamp: null,
        Value: _valueResponse,
        UnitsAbbreviation: uom,
        Good: isGood
      }
    } else {
      attrValue = {
        Timestamp: null,
        Value: valueResponse,
        UnitsAbbreviation: uom,
        Good: isGood
      }
    }

    return attrValue;
  }

  getSubAttributes(itemResult: ResponseBatch, attributoCount: number, subAttributoCount: number, pathParent: string, uom: string): {subAttributes: Array<SubAtributo>, subAttributoCount: number}{
    let subAttributes = itemResult?.SubAtributos?.Content?.Items[attributoCount]?.Content?.Items;
    subAttributes = subAttributes ? subAttributes : [];
    let subAttributos = new Array<SubAtributo>();

    subAttributes.forEach(subAttr => {
      subAttributos.push({
        WebId: subAttr.WebId,
        Name: subAttr.Name,
        Description: null,
        Path: `${pathParent}|${subAttr.Name}`,
        Type: subAttr.Type,
        TypeQualifier: subAttr.TypeQualifier,
        TraitName: subAttr.TraitName,
        Value: this.getSubAttributeValue(itemResult, subAttributoCount, uom)
      });

      subAttributoCount++;
    });


    return {
      subAttributes: subAttributos,
      subAttributoCount
    };
  }

  getSubAttributeValue(itemResult: ResponseBatch, subAttributoCount: number, uom: string): Value {
    const itemValue = itemResult?.ValoresSubAtributos?.Content?.Items[subAttributoCount];
    const valueResponse = itemValue?.Content?.Value as any;
    return this.commonGetValue(valueResponse, itemValue.Status, uom);
  }

  splitEachHundred(qnt: number){

    let intervals = [];
    let start = 0;
    let end = 0;

    do {
      end += 100;
      end = end < qnt ? end : qnt;
      intervals.push({
        start,
        end
      });

      start = end;
    } while(end < qnt);

    return intervals;
  }

  getUrlCount(url: string, webId: string, categoryName: string){
    return `${url}/elements/${webId}/elements?searchFullHierarchy=true&selectedFields=Items.Name&maxCount=100000&categoryName=${categoryName}`;
  }

  getDataBatch(startIndex: number, maxCount: number, url: string, webId: string, categoryNameElement: string, categoryNameAttr: string){
    return {
      "Elementos": {
      "Method": "GET",
      "Resource": `${url}/elements/${webId}/elements?searchFullHierarchy=true&selectedFields=Items.Name;Items.Path;Items.WebId;Items.Links.Attributes&categoryName=${categoryNameElement}&startIndex=${startIndex}&maxCount=${maxCount}`
      },
      "Atributos" : {
      "Method": "GET",
      "RequestTemplate": {
      "Resource": `{0}?selectedFields=Items.Links.Value;Items.Name;Items.Description;Items.Links.Attributes;Items.DefaultUnitsNameAbbreviation;Items.WebId;Items.Type;Items.TypeQualifier;&categoryName=${categoryNameAttr}&maxCount=1000`
      },
      "Parameters": ["$.Elementos.Content.Items[*].Links.Attributes"],
      "ParentIds": [
      "Elementos"
      ]
      },
      "SubAtributos" : {
      "Method": "GET",
      "RequestTemplate": {
      "Resource": "{0}?selectedFields=Items.TraitName;Items.Links.Value;Items.Name;Items.WebId;Items.Type;Items.TypeQualifier&maxCount=1000"
      },
      "Parameters": ["$.Atributos.Content.Items[*].Content.Items[*].Links.Attributes"],
      "ParentIds": [
      "Atributos"
      ]
      },
      "ValoresAtributos" : {
      "Method": "GET",
      "RequestTemplate": {
      "Resource": "{0}?selectedFields=Value&maxCount=1000"
      },
      "Parameters": ["$.Atributos.Content.Items[*].Content.Items[*].Links.Value"],
      "ParentIds": [
      "Atributos"
      ]
      },
      "ValoresSubAtributos" : {
      "Method": "GET",
      "RequestTemplate": {
      "Resource": "{0}?selectedFields=Value&maxCount=1000"
      },
      "Parameters": ["$.SubAtributos.Content.Items[*].Content.Items[*].Links.Value"],
      "ParentIds": [
      "SubAtributos"
      ]
      }
      };
  }
}
