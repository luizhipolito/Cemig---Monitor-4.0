import { PIWebLink } from './PIWebLink.model';

export class PIWebObject {
  CategoryNames: Array<string>;
  Description: string;
  ExtendedProperties: object;
  HasChildren: boolean;
  Id: string;
  Links: PIWebLink;
  Name: string;
  Path: string;
  TemplateName: string;
  WebId: string;
  relativePath: string;
  values: string;
  valuesSets?: Array<PIWebObject>;
}
