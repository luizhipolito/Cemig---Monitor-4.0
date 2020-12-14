import { PIWebAttribute } from './PIWebAttribute.model';

export class Attribute {
  WebId: string;
  list: Array<PIWebAttribute>;

  firstSelection: PIWebAttribute;
  RelativePath: string;
}
