import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'RmsdbWebPartStrings';
import Rmsdb from './components/Rmsdb';
import { IRmsdbProps } from './components/IRmsdbProps';

export interface IRmsdbWebPartProps {
  description: string;
}

export default class RmsdbWebPart extends BaseClientSideWebPart<IRmsdbWebPartProps> {

  public render(): void {
    const element: React.ReactElement<IRmsdbProps> = React.createElement(
      Rmsdb,
      {
        description: this.properties.description,
        webURL:this.context.pageContext.web.absoluteUrl,
        spHttpClient: this.context.spHttpClient,
        currentSiteUrl: this.context.pageContext.web.absoluteUrl,
        siteurl: this.context.pageContext.web.absoluteUrl,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
