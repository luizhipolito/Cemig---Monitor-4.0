import { Data } from '@angular/router';

export class PIWebValue {
  Value: { Value: any; Name: string; IsSystem: boolean };
  Good: boolean;
  Questionable: boolean;
  Substituted: boolean;
  Timestamp: string;
  UnitsAbbreviation: string;
}
