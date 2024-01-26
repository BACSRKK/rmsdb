import { IDropdownOption } from "office-ui-fabric-react";

export interface IRmsdbStates {
  loading: boolean,
  listItems:  IItems[];
  tempList : IItems[];
  actionLink: IActions[];
  paginatedItems: IItems[];
  pageSize: number;
  _fid: number;
  _fref: string;
  _fdocType: string;
  _fdocName: string;
  _fdept: string;
  _fauthorid: number;
  _fauthorTitle: string;
  _rowNum: number;
  _docTypeValueOption: IDropdownOption[];
}

export interface IActions{
  viewDP: string;
  RequestFC: string;
}

export interface IItems{
  customParentId: number;
  refCode: string;
  docName: string;
  docType: string;
  dept: string;
  authorId: number;
  authorTitle: string;
  attachmentsLinkURL: string;
}
