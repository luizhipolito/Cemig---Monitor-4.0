import { PIWebObject } from './PIWebObject.model';

export class PIWebAttribute extends PIWebObject {
  Type: string
  TypeQualifier: string
  DefaultUnitsName: string
  DataReferencePlugIn: string
  ConfigString: string
  IsConfigurationItem: boolean
  IsExcluded: boolean
  IsHidden: boolean
  IsManualDataEntry: boolean
  HasChildren: boolean
  Step: boolean;
  TraitName: string
}


