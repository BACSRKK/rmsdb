import * as React from 'react';
import styles from './Rmsdb.module.scss';
import { IRmsdbProps } from './IRmsdbProps';
import { IActions, IRmsdbStates, IItems } from './IRmsdbStates';
import "@pnp/sp/items/list";
import { SPHttpClient, } from '@microsoft/sp-http';
import { IColumn, IconButton, DefaultButton, IButtonStyles, 
         ILabelStyles, Label, IIconProps, TooltipHost, IIconStyles,
         DetailsList, DetailsListLayoutMode, IDetailsHeaderStyles,
         Dropdown, IDropdownStyles, IDropdownOption } 
        from '@fluentui/react';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { Pagination } from '@pnp/spfx-controls-react/lib/pagination';

// IMPORTED ICONS
const viewDocIcon: IIconProps = { iconName: 'View' };
const RFCIcon: IIconProps = { iconName: 'ChangeEntitlements' };

////////////////////////////////////////////////// EDIT THE STRING BELOW TO MATCH THE DOCUMENT LIBRARY NAME
const encodedTitle = encodeURIComponent("Document Information List");

// CUSTOM DESIGNS FOR BUILT-IN ELEMENTS
const searchResultLabelStyles: Partial<ILabelStyles> = {
  root: {
    backgroundColor: '#E7F5FE',
    fontFamily: 'Arial',
    color: 'black',
    marginTop: 0,
    marginBottom: 10,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
  }
};

const iconStyles: Partial<IIconStyles> = {
  root: {
    color: '#1A608F',
  }
};

const topTitleLabelStyles: Partial<ILabelStyles> = {
  root: {
    backgroundColor: '#E6E6E6',
    fontFamily: 'Arial',
    color: 'black',
    marginTop: 20,
    marginBottom: 10,
    padding: 8,
  }
};

//this is tested
const subTitleLabelStyles: Partial<ILabelStyles> = {
  root: {
    fontFamily: 'Arial',
    paddingLeft: 8,
    paddingBottom: 15,
    paddingTop: 10,
  }
};

const subTitleDropdownStyles: Partial<IDropdownStyles> = {
  root: {
    fontFamily: 'Arial',
    paddingBottom: 10,
    borderColor: "#323130",
    width: 178,
  }
};

const buttonStyles: Partial<IButtonStyles> = {
  root: {
    marginTop: 0,
    marginLeft: 4,
    backgroundColor: '#4EBDE5',
    borderRadius: 5,
    borderColor: 'transparent',
    color: "white",
    padding: 3,
  }
};

const headerStyle: Partial<IDetailsHeaderStyles> = {
  root: {
    color: 'white',
    backgroundColor: '#4EBDE5',
    borderColor: 'white',
    border: 'solid',
    borderWidth: 1,
  }
};

// MAIN CLASS
export default class RMSDashboard extends React.Component<IRmsdbProps, IRmsdbStates> {
  private columns : IColumn[];
  public itemCount: number = 0;
  
////////////////////////////////////////////////// EDIT HERE TO MATCH ACCORDINGLY TO THE PROPS/STATES ON OTHER TS FILE
  constructor(props: IRmsdbProps, state: IRmsdbStates) {
    super(props);

    this.state = {
      loading: true,
      listItems: [], // set empty list item
      tempList: [], // set temp list for search filter
      actionLink: [],
      paginatedItems: [],
      pageSize: 20,
      _fid: 0,
      _fref: '',
      _fdocType: '',
      _fdocName: '',
      _fdept: '',
      _fauthorid: 0,
      _fauthorTitle: '',
      _rowNum: 0,
      _docTypeValueOption: [],
    };

////////////////////////////////////////////////// EDIT HERE TO MATCH ACCORDINGLY TO THE DOCUMENT LIBRARY COLUMNS
    // Use this https://xml.onlineviewer.net/ or https://codebeautify.org/xmlviewer to check the exact column name
    // key: unique key identify column
    // name: Title that displays on Output Table
    // fieldName: match with the classname in list's XML
    this.columns = [
      { styles: headerStyle, key: 'ReferenceCode', name: 'Reference Code', fieldName: 'ReferenceCode', minWidth: 110, maxWidth: 200, isResizable: true },
      { styles: headerStyle, key: 'DocumentName', name: 'Document Name', fieldName: 'DocumentName', minWidth: 150, maxWidth: 300, isResizable: true },
      { styles: headerStyle, key: 'DocumentType', name: 'Document Type', fieldName: 'DocumentType', minWidth: 110, maxWidth: 150, isResizable: true },
      { styles: headerStyle, key: 'Department', name: 'Department', fieldName: 'ol_Department', minWidth: 90, maxWidth: 120, isResizable: true },
      { styles: headerStyle, key: 'CreatedBy', name: 'Created By', fieldName: 'authorDetails.Title', minWidth: 80, maxWidth: 200, isResizable: true },
      { styles: headerStyle, key: 'Action', name: 'Action', fieldName: 'Action', minWidth: 80, maxWidth: 100, isResizable: true },
    ];    
  };
  
  // LOADING ALL THE DROPDOWN OPTION FOR SEARCHING & ICONS FUNCTION LINK TO DISPLAY AND EDIT
  protected ddlLoad(): void {
    this.getActionItems()
      .then((spListItemRSVP: IActions[]) => {
        this.setState({ actionLink: spListItemRSVP })
      });

////////////////////////////////////////////////// EDIT HERE TO MATCH THE MASTERLIST OF DOCUMENT TYPE/s
    this.ddDocTypeValueOption('[Masterlist]Document Type')
      .then((valueOptions: IDropdownOption[]) => {
        this.setState({ _docTypeValueOption: valueOptions });
      });
  };

  // RETRIEVE DROPDOWN DATA
  public async ddDocTypeValueOption(list: string): Promise<IDropdownOption[]> {
    const url = `${this.props.currentSiteUrl}/_api/lists/getbytitle('${list}')/items?`;
    return new Promise<IDropdownOption[]>(async (resolve, reject) => {
      const valueOptions: IDropdownOption[] = [];
      const response = await this.props.spHttpClient.get(url, SPHttpClient.configurations.v1);
      const jsonResponse = await response.json();

        for (let index = 0; index < jsonResponse.value.length; index++) {
          const item = jsonResponse.value[index];
          const documentType = item.DocumentType;
          const documentTypeCode = item.DocumentTypeCode;

          // PUSH THE RETRIEVE DATA INTO DROPDOWN
          valueOptions.push({ 
            key: documentTypeCode, 
            text: documentType,
          });
        }

      //// UNCOMMENT THIS to check the retrieved document types
      // console.log("Retrieved Document Type:", valueOptions);
      resolve(valueOptions);
    });
  }

 // RETRIEVE ACTION LINKS
  public async getActionItems(): Promise<IActions[]> {
    const url = `${this.props.currentSiteUrl}/_api/lists/getbytitle('[DashboardMaster]Action Links')/items?$top=1`;
    return new Promise<IActions[]>(async (resolve, reject) => {
      const spListItemRSVP: IActions[] = [];
      const response = await this.props.spHttpClient.get(url, SPHttpClient.configurations.v1);
      const jsonResponse = await response.json();

        for (let index = 0; index < jsonResponse.value.length; index++) {
          const item = jsonResponse.value[index];

          // PUSH THE RETRIEVE ACTION LINKS
          spListItemRSVP.push({
            viewDP: item.View_Document,
            RequestFC: item.Request_For_Change,
          });
        }

      //// UNCOMMENT BELOW LINE to check the retrieved action links
      // console.log("Retrieved Actions:", spListItemRSVP);
      resolve(spListItemRSVP);
    });
  }

  // DEFAULT FUNCTION TO RUN THE REQUIRED METHODS
  public async componentDidMount(): Promise<void> {
    const defaultUrl = `${this.props.currentSiteUrl}/_api/lists/getbytitle('${encodedTitle}')/items?$top=5000`;

    //// UNCOMMENT THIS to check the SharePoint List Link
    // console.log("SharePoint List Link:", defaultUrl);

    await this.getListItems(defaultUrl)
      .then((spListItemRSVP: IItems[]) => {
        // console.log("Test: " + spListItemRSVP.slice(0, this.state.pageSize));
        this.setState({
          paginatedItems: spListItemRSVP.slice(0, this.state.pageSize),
        });
      });

    const countUrl = `${this.props.currentSiteUrl}/_api/lists/getbytitle('${encodedTitle}')/ItemCount`;
    this.getListCount(countUrl);
    this.ddlLoad();
  }

  // RETRIEVE THE USER DETAILS BY ID
  private async getUserDetailsById(authorId: number): Promise<any> {
    const userUrl = `${this.props.currentSiteUrl}/_api/web/getuserbyid(${authorId})`;

    try {
      const response = await this.props.spHttpClient.get(userUrl, SPHttpClient.configurations.v1);
      if (response.ok) {
        const userData = await response.json();
        return userData;
      } else {
        console.error(`Error retrieving user details for authorId ${authorId}: ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.error(`Error retrieving user details for authorId ${authorId}: ${error}`);
      return null;
    }
  }

  // MAIN FUNCTION - RETRIEVE THE LIST ITEM BASED ON THE URL LINK 
  public getListItems(url: string): Promise<IItems[]> {
    return new Promise<IItems[]>(async (resolve, reject) => {
////////////////////////////////////////////////// EDIT HERE TO CHANGE THE ENTITIES OF THE LIBRARY BELOW, CHECK XML CODE FOR EXACT WORDINGS
      url += "&$select=ReferenceCode,DocumentName,DocumentType,ol_Department,AuthorId,CustomParentID,Completed_x0020_Document_x0020_L";
      // const ddlDocTypeOptions: IDropdownOption[] = [];
      // let dtName: any;
      
      this.setState({
        loading: true,
      });

      const response = await this.props.spHttpClient.get(url, SPHttpClient.configurations.v1);
      const jsonResponse = await response.json();
      const spListItemRSVP: IItems[] = [];

          for (let index = 0; index < jsonResponse.value.length; index++) {
            const item = jsonResponse.value[index];

            // if (ddlDocTypeOptions.some(u => u.key === item.DocumentType.substring(0, 40)) === false && item.DocumentType.length !== 0) {
            //   // const dturl = `${this.props.currentSiteUrl}/_api/web/AvailableContentTypes?$filter=StringId%20eq%20'${item.DocumentType.substring(0, 40)}'&$top=1`;
            //   const response = await this.props.spHttpClient.get(url, SPHttpClient.configurations.v1);
            //   const jsonResponse2 = await response.json();
            //   jsonResponse2.value[0] !== undefined && jsonResponse2.value[0].Name !== null ? dtName === jsonResponse2.value[0].Name : {};
            //   ddlDocTypeOptions.push({ key: item.DocumentType.substring(0, 40), text: dtName });
            // }
            // const valueIndex = ddlDocTypeOptions.findIndex(u => u.key === item.DocumentType.substring(0, 40));
            const authorId = item.AuthorId;
            const authorDetails = await this.getUserDetailsById(authorId);

////////////////////////////////////////////////// EDIT HERE TO PUSH ACCORDINGLY TO THE ENTITIES' NAME
            spListItemRSVP.push({
              customParentId: item.CustomParentID,
              // docType: ddlDocTypeOptions[valueIndex].text,
              docType: item.DocumentType,
              refCode: item.ReferenceCode,
              docName: item.DocumentName,
              dept: item.ol_Department,
              authorId: item.AuthorId,
              authorTitle: authorDetails.Title,
              attachmentsLinkURL: item.Completed_x0020_Document_x0020_L,
            });
          };
          resolve(spListItemRSVP);

          //// UNCOMMENT THIS to check the retrieved array data
          // console.log("Retrieve Array Data:", spListItemRSVP);

////////////////////////////////////////////////// SET THE ITEMS INTO ITS CONTAINER     
          this.setState({
            listItems: spListItemRSVP, tempList: spListItemRSVP,
            _fid: 0, _fref: '', _fdocType: '', _fdocName: '', _fdept: '', 
            _fauthorid: 0, _fauthorTitle: '',
          });
    });
  }

  // RETRIEVE THE SEARCHED LIST ITEM.
  private getFilterListItems(url: string): Promise<IItems[]>{
    return new Promise<IItems[]>(async (resolve, reject) => {
//////////////////////////////////////////////////EDIT HERE TO CHANGE THE ENTITIES OF THE LIBRARY BELOW, CHECK XML CODE FOR EXACT WORDINGS
      url+="&select=ID,ReferenceCode,DocumentName,DocumentType,ol_Department,AuthorId,CustomParentID,Completed_x0020_Document_x0020_L";
      // const ddlDocTypeOptions: IDropdownOption[] = [];
      // let dtName: any;

      this.setState({
        loading: true,
      });

      const response = await this.props.spHttpClient.get(url, SPHttpClient.configurations.v1);
      const jsonResponse = await response.json();
      const spListItemRSVP: IItems[] = [];

          for (let index = 0; index < jsonResponse.value.length; index++) {
            const item = jsonResponse.value[index];

            // if (ddlDocTypeOptions.some(u => u.key === item.DocumentType.substring(0, 40)) === false && item.DocumentType.length !== 0) {
            //   // const dturl = `${this.props.currentSiteUrl}/_api/web/AvailableContentTypes?$filter=StringId%20eq%20'${item.DocumentType.substring(0, 40)}'&$top=1`;
              
            //   const response = await this.props.spHttpClient.get(url, SPHttpClient.configurations.v1);
            //   const jsonResponse2 = await response.json();
            //   jsonResponse2.value[0] !== undefined && jsonResponse2.value[0].Name !== null ? dtName === jsonResponse2.value[0].Name : {};
            //   ddlDocTypeOptions.push({ key: item.DocumentType.substring(0, 40), text: dtName });
            // }
            // const valueIndex = ddlDocTypeOptions.findIndex(u => u.key === item.DocumentType.substring(0, 40));
            const authorId = item.AuthorId;
            const authorDetails = await this.getUserDetailsById(authorId);

////////////////////////////////////////////////// EDIT HERE TO PUSH ACCORDINGLY TO THE ENTITIES' NAME
            spListItemRSVP.push({
              customParentId: item.CustomParentID,
              // docType: ddlDocTypeOptions[valueIndex].text,
              docType: item.DocumentType,
              refCode: item.ReferenceCode,
              docName: item.DocumentName,
              dept: item.ol_Department,
              authorId: item.AuthorId,
              authorTitle: authorDetails.Title,
              attachmentsLinkURL: item.Completed_x0020_Document_x0020_L,
            });
          }
          resolve(spListItemRSVP);

          //// UNCOMMENT THIS to check the searched array data
          // console.log("Search Array Data:", spListItemRSVP);

//////////////////////////////////////////////////SET THE ITEMS INTO ITS CONTAINER
          this.setState({
            listItems: spListItemRSVP, tempList: spListItemRSVP,
          });
    });
  }

  // RETRIEVE THE TOTAL ITEM FROM THE SEARCH
  public async getListCount(url: string): Promise<void> {
    const response = await this.props.spHttpClient.get(url, SPHttpClient.configurations.v1);
    const jsonResponse = await response.json();
    //// UNCOMMENT THIS to check the Total Retrieved Data
    // console.log("Total Retrieved Data:", jsonResponse.value);
    this.setState({ _rowNum: jsonResponse.value });
  }

  // MANAGE THE ITEM IN EACH PAGE
  private getPage(page: number) {
    // round a number up to the next largest integer.
    const roundupPage = Math.ceil(page) - 1;
    console.log(this.state.listItems.slice(roundupPage * this.state.pageSize, (roundupPage * this.state.pageSize) + this.state.pageSize));
    this.setState({
      paginatedItems: this.state.listItems.slice(roundupPage * this.state.pageSize, (roundupPage * this.state.pageSize) + this.state.pageSize)
    });
  }

  // RESET THE CURRENT DATA
  public ResetData = () => {
    window.location.reload();
    const defaultUrl = `${this.props.currentSiteUrl}/_api/lists/getbytitle('${encodedTitle}')/items?$top=5000`;

    this.getListItems(defaultUrl)
      .then((spListItemRSVP: IItems[]) => {
        this.setState({
          listItems: spListItemRSVP, tempList: spListItemRSVP, _fid: 0, 
          _fref: '', _fdocType: '', _fdocName: '', _fdept: '', _fauthorid: 0, 
          _fauthorTitle:'', paginatedItems: spListItemRSVP.slice(0, this.state.pageSize),
        });
      });

    const countUrl = `${this.props.currentSiteUrl}/_api/lists/getbytitle('${encodedTitle}')/ItemCount`;
    this.getListCount(countUrl);
  }

  // USED TO GENERATE THE SEARCH LINK AFTER USER CLICK ON SEARCH
  // THE FUNCTION CONTAINS IS CALL SUBSTRINGOF
  // REPLACING OF & TO A DIFFERENT & IS REQUIRED BECAUSE ACTUALLY THIS 2 & ARE DIFFERENT IN ASCII TABLE
  public SearchData = async () => {
    let searchUrl = `${this.props.currentSiteUrl}/_api/lists/getbytitle('${encodedTitle}')/items?$filter=(`;
    let orderBy;
    let count = 0;

    if (this.state._fdocName !== "") {
      count > 0 ? searchUrl += `and%20` : '';
      searchUrl += `substringof('${this.state._fdocName}',DocumentName)`;
      orderBy = 'DocumentName';
      count++;
    }

    if (this.state._fdocType !== "") {
      count > 0 ? searchUrl += `and%20` : '';
      const encodedValue = encodeURI(this.state._fdocType).replace("&", "＆");;
      searchUrl += `substringof('${encodedValue}',DocumentType)`;
      orderBy = 'DocumentType';
      count++;
    }

    if (this.state._fref !== "") {
      count > 0 ? searchUrl += `and%20` : '';
      searchUrl += `substringof('${this.state._fref}',ReferenceCode)`;
      orderBy = 'ReferenceCode';
      count++;
    }

    searchUrl += `)&$orderby=+${orderBy}+desc`;

    // PASS THE SEARCH URL GENERATED TO GETSEARCHLISTCOUNT AND GETLISTITEMS TO GET THE COUNT OF THE SEARCH AND THE ITEM
    this.getSearchListCount(searchUrl);
    searchUrl += '&$top=5000';
    let searchCount = 0

    await this.getFilterListItems(searchUrl)
      .then((spListItemRSVP: IItems[]) => {
        searchCount = spListItemRSVP.length;

        this.setState({
          listItems: spListItemRSVP, tempList: spListItemRSVP, paginatedItems: spListItemRSVP.slice(0, this.state.pageSize)
        });
      });

    if(searchCount === 0){
      this.setState({
        loading: false
      })
    }
  }

  // GET TOTAL ITEM FROM SEARCHED 
  public async getSearchListCount(url: string): Promise<void> {
    url+='&$top=5000';
    //// UNCOMMENT THIS to check the SharePoint Searched List Link
    // console.log("Searched List Link:", url);

    try {
      const response = await this.props.spHttpClient.get(url, SPHttpClient.configurations.v1);
      const jsonResponse = await response.json();
      //// UNCOMMENT THIS to check the Searched Data
      // console.log("Total Searched Data:", jsonResponse.value.length);
      this.setState({ _rowNum: jsonResponse.value.length });
    } catch (error) {
      console.log(error);
    }
  }

////////////////////////////////////////////////// EDIT HERE TO PUSH ACCORDINGLY TO THE ENTITIES' KEY, USED TO ASSIGN COLUMN KEYS TO BE DISPLAYED AS TABLE COLUMNS
  private renderItemColumn = (item: IItems, index: number, column: IColumn): JSX.Element | string => {
    this.itemCount++;
    switch (column.key) {
      case 'DocumentType': {
        return (
          <span>{item.docType}</span>
        );
      }

      case 'DocumentName': {
        return (
          <span><a href="#" onClick={() => window.open(this.props.currentSiteUrl+item.attachmentsLinkURL)}>{item.docName}</a></span>
        );
      }

      case 'ReferenceCode': {
        return (
          <span>{item.refCode}</span>
        );
      }

      case 'Department': {
        return (
          <span>{item.dept}</span>
        );
      }

      case 'CreatedBy': {
        return (
          <span>{item.authorTitle}</span>
        );
      }

      case 'Action': {
        return (
          <div>
            <TooltipHost
              content="View Document Property"
            >
              <IconButton iconProps={viewDocIcon} styles={iconStyles} onClick={() => window.open(this.state.actionLink[0].viewDP + item.customParentId)} />
            </TooltipHost>
            &nbsp;
            <TooltipHost
              content="Request For Change / Return Document"
            >
              <IconButton iconProps={RFCIcon} styles={iconStyles} onClick={() => window.open(this.state.actionLink[0].RequestFC + item.customParentId)} />
            </TooltipHost>
            &nbsp;
          </div>
        );
      }
    }
    
    if (this.itemCount === this.state.paginatedItems.length || this.state.paginatedItems.length > 1) {
      this.setState({
        loading: false
      });
    }

    return (
        <span>In Progress</span>
    );
  }

  // DEFAULT RENDERING FUNCTION FOR DISPLAY, EDIT HERE OBVIOUSLY
  public render(): React.ReactElement<IRmsdbProps> {
    return (
      <div className={styles.Rmsdb}> 
        <h1>
          Record Management Dashboard
        </h1>
        <div className="ms-Grid">
          <div className="ms-Grid-row">
            <div className='ms-Grid-col ms-lg4'>
              <Label styles={topTitleLabelStyles}>Document Filter</Label>
            </div>
          </div>
          {/*  LOCATION OF DOCUMENT FILTERS */}
          <div className="ms-Grid-row">
            <div className="ms-Grid-col ms-lg6">
              <div className="ms-Grid-row">
                <div className='ms-Grid-col ms-lg4'>
                  <Label styles={subTitleLabelStyles}>Document Type</Label>
                </div>
                <div className='ms-Grid-col'>
                  <Dropdown
                    styles={subTitleDropdownStyles}
                    placeholder="Select Document Type"
                    id="ddlDocType"
                    options={this.state._docTypeValueOption}
                    onChange={(e, selectedOption) => {
                      if (selectedOption) {
                        this.setState({ _fdocType: selectedOption.text })
                      }
                    }}
                    calloutProps={{calloutWidth: 300,}}
                  />
                </div>
              </div>
              <div className="ms-Grid-row">
                <div className='ms-Grid-col ms-lg4'>
                  <Label styles={subTitleLabelStyles}>Document Name</Label>
                </div>
                <div className='ms-Grid-col'>
                  <input
                    className={styles.txtStyles}
                    placeholder="Enter Document Name"
                    id='txtDocName'
                    value={this.state._fdocName}
                    onChange={(e) => this.setState({ _fdocName: e.target.value })}
                  />
                </div>
              </div>
              <div className="ms-Grid-row">
                <div className='ms-Grid-col ms-lg4'>
                  <Label styles={subTitleLabelStyles}>Reference Code</Label>
                </div>
                <div className='ms-Grid-col'>
                  <input
                    className={styles.txtStyles}
                    placeholder="Enter Reference Code"
                    id='txtRefCode'
                    value={this.state._fref}
                    onChange={(e) => this.setState({ _fref: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/*  LOCATION OF NUMBER OF SEARCH RESULTS & BUTTONS */}
        <div className="ms-Grid">
          <div className="ms-Grid-row">
            <div className="ms-Grid-col ms-lg10">
              <Label styles={searchResultLabelStyles}>Search Results: {this.state._rowNum.toString()}</Label>
            </div>
            <div className="ms-Grid-col ms-lg2">
                <DefaultButton styles={buttonStyles} className="ms-depth-8" text="Reset" onClick={this.ResetData}/>
                <DefaultButton styles={buttonStyles} className="ms-depth-8" text="Search" onClick={this.SearchData} />
            </div>
          </div>
        </div>
        
        {/*  LOCATION OF DISPLAY RESULTS */}
        <div className="ms-Grid-row">
          <div className="ms-Grid-col ms-lg12">
            {
              this.state.paginatedItems.length <= 0 && this.state.loading &&
              <>
                <Spinner label="Loading items..." size={SpinnerSize.large} />
              </>
            }
            {
              this.state.paginatedItems.length <=0 && this.state.loading === false &&
              <>
                <Spinner label="No Items Found..." size={SpinnerSize.large} />
              </>
            }
            {
              this.state.paginatedItems.length > 0 &&
              <>
                <DetailsList
                  items={this.state.paginatedItems}
                  columns={this.columns}
                  selectionMode={0}
                  layoutMode={DetailsListLayoutMode.justified}
                  onRenderItemColumn={this.renderItemColumn}
                />
                <Pagination 
                  currentPage={1}
                  totalPages={(this.state.listItems.length / this.state.pageSize)}
                  onChange={(page) => this.getPage(page)}
                  hideFirstPageJump={false}
                  limiter={3} 
                />
              </>
            }
          </div>
        </div>
      </div>
    );
  }
}