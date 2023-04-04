export interface Onsheet {
  getSheetDefaultRendererAddress(): Promise<string>;
  getSheetClassHash(): Promise<string>;
  getSheets(): Promise<string[]>;
}
