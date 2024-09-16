export class ResponseBatch {
    Elementos: Elemento;
    ValoresAtributos: ValorAtributo;
    Atributos: Atributo;
    SubAtributos: SubAtributo;
    ValoresSubAtributos: ValorAtributo;
}

class Elemento {
    Status: number;
    Content: ContentElemento;
}

class ContentElemento {
    Items: Array<Item>;
}

class Item {
    Name: string;
    Path: string;
    WebId: string;
}

class ValorAtributo {
    Status: number;
    Content: ContentValorAtributo;
}

class ContentValorAtributo {
    Total: number;
    Items: Array<ItemValorAtributo>;
}

export class ItemValorAtributo {
    Status: number;
    Content: ContentValor;
}

class ContentValor {
    Value: ValueResponse | number | string;
}

export class ValueResponse {
    Name: string;
    Value: any;
    IsSystem: boolean;
}

class Atributo {
    Status: number;
    Content: ContentAtributo;
}

class ContentAtributo {
    Total: number;
    Items: Array<ItemAtributo>;
}

class ItemAtributo {
    Status: number;
    Content: ContentItemAtributo;
}

class ContentItemAtributo {
    Items: Array<ItemContentItemAtributo>;
}

export class ItemContentItemAtributo {
    Name: string;
    Description: string;
    Type: string;
    TypeQualifier: string;
    DefaultUnitsNameAbbreviation: string;
    WebId: string;
}

///

class SubAtributo {
    Status: number;
    Content: ContentSubAtributo;
}

class ContentSubAtributo {
    Total: number;
    Items: Array<ItemSubAtributo>;
}

class ItemSubAtributo {
    Status: number;
    Content: ContentItemSubAtributo;
}

class ContentItemSubAtributo {
    Items: Array<ItemContentItemSubAtributo>;
}

class ItemContentItemSubAtributo {
    WebId: string;
    Name: string;
    TraitName: string;
    Type: string;
    TypeQualifier: string;
}