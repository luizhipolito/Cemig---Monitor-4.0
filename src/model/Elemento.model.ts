export class Elemento {
    name: string;
    relativePath: string;
    AplicacaoID: string;//WebId do elemento
    atributos: Atributo;
    Caminho: Array<string>;
    usina: string;
}

export class Atributo {
    WebId: string;//WebId do elemento
    RelativePath: string;
    firstSelection: AtributoModel;
    list: Array<AtributoModel>
}

export class AtributoModel {
    WebId: string;//WebId do atributo
    Name: string;
    Description: string;
    Path: string;
    Type: string;
    TypeQualifier: string;
    TraitName: string;
    config: Array<SubAtributo>;
    mode: string;
    Value: Value;
    Selected: any;
    color: string;
    ValueString: string;
    Links: Link;
}

export class Link {
    Value: string;
}

export class SubAtributo{
    WebId: string;//WebId do Subatributo
    Name: string;
    Description: string;
    Path: string;
    Type: string;
    TypeQualifier: string;
    TraitName: string;
    Value: Value;
}

export class Value {
    Timestamp: any;
    Value: any | ValueObj;
    UnitsAbbreviation: string;
    Good: boolean;
}

export class ValueObj {
    Value: any;
    IsSystem: boolean;
    Name: string;
}