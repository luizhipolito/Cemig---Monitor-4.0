import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { from, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { Arvore, StorageArvoreService } from './storage-arvore.service';
import { AppUtils, firstSelection } from 'src/utils/app.utils';
import { Device } from '@ionic-native/device/ngx';
import { ItemContentItemAtributo, ResponseBatch } from 'src/model/ResponseBatch.model';
import { Atributo, AtributoModel, Elemento, Link, SubAtributo, Value, ValueObj } from 'src/model/Elemento.model';
import { LoadProgress } from 'src/app/entrada-manual/entrada-manual.component';

declare var cordova:any;

const prefix = 'https://';
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

  httpOptionsCordova = {
    'Content-Type': 'application/json'
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

    this.httpOptionsCordova['Authorization'] = `Basic ${token}`;
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


  post(url: string, data: any, params?: HttpParams, bypassError: boolean = false) {
    url = url.trim();
    this.showLoader();
    let reqOptions = this.httpOptions;

    if (params) {
      reqOptions['params'] = params;
    }

    let observable = window.hasOwnProperty("cordova") ? 
      from(this.postPromise(url, data)) : 
      this.http.post<any>(url, JSON.stringify(data), reqOptions);

    observable = observable.pipe(timeout(10000));

    if(bypassError) {
      return observable;
    } else {
      return observable
      .pipe(catchError(this.handleError.bind(this)));
    }
  }

  postPromise(url: string, data: any): Promise<any>{
    return new Promise((resolve, reject) => {

      const options = {
        method: "post",
        headers: this.httpOptionsCordova,
        data,
        serializer: "json"
      };
  
      cordova.plugin.http.sendRequest(url, options, (response) => {
        resolve(JSON.parse(response.data));
        }, (response) => {
          reject(response);
      });
    });
  }

  put(url: string, data: any) {
    let options = this.httpOptions;

    this.showLoader();

    const observable = window.hasOwnProperty("cordova") ? 
      from(this.putPromise(url, data)) : 
      this.http.put<any>(url, JSON.stringify(data), options);

    return observable
      .pipe(catchError(this.handleError.bind(this)));
  }

  putPromise(url, data): Promise<any>{
    return new Promise((resolve, reject) => {

      const options = {
        method: "put",
        headers: this.httpOptionsCordova,
        data,
        serializer: "json"
      };
  
      cordova.plugin.http.sendRequest(url, options, (response) => {
        resolve(JSON.parse(response.data));
        }, (response) => {
          console.log(response);
          reject(response);
      });
    });
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
    url = url.trim();
    this.showLoader();

    const observable = window.hasOwnProperty("cordova") ? 
      from(this.getPromise(url)) : 
      this.http.get(url, { ...this.httpOptions, params: params });

    return observable
      .pipe(catchError(this.handleError.bind(this)));
  }

  getPromise(url: string): Promise<any>{
    return new Promise((resolve, reject) => {

      const options = {
        method: "get",
        headers: this.httpOptionsCordova,
        serializer: "json"
      };
  
      cordova.plugin.http.setServerTrustMode('nocheck', function() {
        cordova.plugin.http.sendRequest(url, options, (response) => {
          resolve(JSON.parse(response.data));
          }, (response) => {
          reject(response);
        });
      }, function(error) {
        reject(error);
      });
    });
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

      let msgErrorMessage = error.message ? error.message : "";
      let msgErrorError = error.error ? error.error : "";
      let msgErro = msgErrorMessage ? `${msgErrorMessage} - ${msgErrorError}` : msgErrorError;

      errorMessage =
        `Código do erro: ${error.status}, ` + `mensagem: ${msgErro}`;
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

  async getElements(url, webId, categoryNameElement, categoryNameAttr, pathSearch, loadProgress: LoadProgress, instrumentosPorBatch: number){
    const data = await this.get(this.getUrlCount(url, webId, categoryNameElement)).toPromise();
    const count = data?.Items?.length ? data?.Items?.length : 0;
    loadProgress.setTotal(count);

    const intervals = this.splitEachInstrumentosPorBatch(count, instrumentosPorBatch);
    let results = [];

    for(let interval of intervals) {
      const body = this.getDataBatch(interval.start, interval.end - interval.start, url, webId, categoryNameElement, categoryNameAttr);
      let result = await this.post(`${url}/batch`, body, null, true).toPromise().catch(e => e);

      if(!this.checkResponseOk(result)) {
        result = await this.retry(`${url}/batch`, body, 1);
      } else {
        this.checkTooManyRequest(result);
      }
      loadProgress.setCurrent(interval.end);
      results.push(result);
    }

    let resultParse = await this.parseResult(results, pathSearch, url);
    return resultParse;
  }

  waitBetweenRequests(): Promise<any>{
    return new Promise(r => setTimeout(r, 2000));
  }

  checkResponseOk(response: any): boolean{
    return  response && response.Elementos && response.Atributos && response.SubAtributos && response.ValoresAtributos && response.ValoresSubAtributos;
  }

  checkTooManyRequest(result){
    let some429 = false;
    let msg429;
    let some409 = false;
    let msg409;

    for(let key in result) {
      if(result[key].Status == 429) {
        some429 = true;
        msg429 = result[key].Content;
      }
      if(result[key].Status == 409) {
        some409 = true;
        msg409 = result[key].Content;
      }
    }

    if(some429) {
      this.handleError({status: 429, error: msg429} as any);
    }
    if(some409){
      this.handleError({status: 409, error: msg409} as any);
    }
  }

  async retry(url, body, count) {
    if(count == 10) {
      await this.waitBetweenRequests();
      let result = await this.post(url, body, null).toPromise();
      return result;
    }

    await this.waitBetweenRequests();
    let result = await this.post(url, body, null, true).toPromise().catch(e => e);

    if(!this.checkResponseOk(result)) {
      result = await this.retry(url, body, count + 1);
    }

    return result;
  }

  checkObservation(attr: ItemContentItemAtributo, observations: Array<ObservationAttrModel>, elIndex: number) {
    if(attr.Name == 'Observação') {
      observations.push({
        webId: attr.WebId,
        index: elIndex
      });
    }
  }

  async parseResult(result: Array<ResponseBatch>, pathSearch: string, url: string) {
    let elements: Array<Elemento> = [];

    let observations: Array<ObservationAttrModel> = [];
    let indexElement = 0;
    
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
          this.checkObservation(attr, observations, indexElement);

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
            Value: this.getAttributeValue(itemResult, attributoCount, attr.DefaultUnitsNameAbbreviation, attr.Name),
            Selected: null,
            color: null,
            ValueString: null,
            Links: this.getLinks(url, attr.WebId)
          };

          // here will fill Selected, color and ValueString
          this.utils.fillAttrProp(_attr);

          if(attr.Name == firstSelection) {
            firstSelectionAttr = _attr;
          } else {
            attributes.push(_attr);
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
          usina: this.getUsina(el.Path),
          name: el.Name,
          AplicacaoID: el.WebId,
          relativePath: relativePath,
          Caminho: relativePath.split("\\").filter(x => x),
          atributos: atributo
        });

        indexElement++;
      });
    });

    await this.fillObservationsValues(url, elements, observations);

    return elements;
  }

  async fillObservationsValues(url: string, elements: Array<Elemento>, observations: Array<ObservationAttrModel>) {
    let observationsValues = await this.buildBatchObservation(url, observations);

    elements.forEach((el, index) => {
      el.observacoes = observationsValues[`obs${index}`].Content?.Items;
    });
  }

  getUsina(path: string) {
    const nodes = path.split("\\")
    const index = nodes.indexOf("Usinas");
    return nodes[index + 1];
  }

  getAttributeValue(itemResult: ResponseBatch, attributoCount: number, uom: string, attrName: string): Value  {

    if(attrName == "Relatos de Operação e Manutenção") {
      return {
        Value: ""
      } as any;
    }

    const itemValue = itemResult?.ValoresAtributos?.Content?.Items[attributoCount];
    const valueResponse = itemValue?.Content?.Value as any;
    return this.commonGetValue(valueResponse, itemValue?.Status, uom);
  }

  getLinks(url: string, webId: string): Link {
    return {
      Value: `${url}/streams/${webId}/value`
    }
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

  splitEachInstrumentosPorBatch(qnt: number, splitEachInstrumentosPorBatch: number){

    let intervals = [];
    let start = 0;
    let end = 0;

    do {
      end += splitEachInstrumentosPorBatch;
      end = end < qnt ? end : qnt;
      intervals.push({
        start,
        end
      });

      start = end;
    } while(end < qnt);

    return intervals;
  }

  async buildBatchObservation(url: string, observations: Array<ObservationAttrModel>){
    let objBody = {};

    observations.forEach(obs => {
      objBody[`obs${obs.index}`] = {
        "Method": "GET",
        "Resource": `${url}/streams/${obs.webId}/recorded?startTime=*&endTime=-3y&maxCount=3`
      };
    });

    let result = await this.post(`${url}/batch`, objBody, null, false).toPromise();

    return result;
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

class ObservationAttrModel {
  webId: string;
  index: number;
}