import { SPHttpClient } from "@microsoft/sp-http";//get the httpclient

export interface IRmsdbProps {
  description: string;
  webURL: string;
  spHttpClient: SPHttpClient;
  currentSiteUrl: string;
  siteurl: string;
}
