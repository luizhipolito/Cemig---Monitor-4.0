import { PIWebLink } from './PIWebLink.model';

export class PIWebObject {
  CategoryNames: Array<string>;
  Description: string;
  Selected: string;
  ExtendedProperties: object;
  HasChildren: boolean;
  Id: string;
  Links: PIWebLink;
  Name: string;
  Path: string;
  TraitName: string;
  TemplateName: string;
  WebId: string;
  relativePath: string;
  values: string;
  valuesSets?: Array<PIWebObject>;
  mode: string;
}
