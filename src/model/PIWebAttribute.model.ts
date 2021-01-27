import { PIWebObject } from './PIWebObject.model';
import { PIWebValue } from './PIWebValue.model';

export class PIWebAttribute extends PIWebObject {
  Type: string;
  TypeQualifier: string;
  DefaultUnitsName: string;
  DataReferencePlugIn: string;
  ConfigString: string;
  IsConfigurationItem: boolean;
  IsExcluded: boolean;
  IsHidden: boolean;
  IsManualDataEntry: boolean;
  HasChildren: boolean;
  Step: boolean;
  TraitName: string;
  Value?: PIWebValue;
  ValueString: string;
  Selected: any;
  config: Array<PIWebObject>;
  visible: boolean;
  mode: EnumModeAttribute;
  color: string;
}

export enum EnumModeAttribute {
  'Leitura/Escrita' = 'LeituraEscrita',
  'Escrita (Constante)' = 'EscritaConstante',
  'Leitura/Escrita (Constante)' = 'LeituraEsConst',
  Leitura = 'Leitura',
  Escrita = 'Escrita',
  Data = 'Data'

}
