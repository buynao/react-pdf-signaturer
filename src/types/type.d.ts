declare module 'react-alert-template-basic';
declare module '*.gif';
declare module '*.png';
declare module 'MyTypes' {


  // 1 专家顾问签署区域，2 企业员工签署区域，3 全部
  export type PositionType = 0 | 1 | 2 | 3;
  export type SignType = 'rectTool' | 'image' | 'rectPos';
  type ControlType = 'lt' | 'lc' | 'lb' | 'rt' | 'rc' | 'rb' | 'move';
  type CustomImageType = {
    isload?: boolean;
  }
  type CustomImageElement = HTMLImageElement & CustomImageType;

  // 签名列表
  export interface ISignPosition {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    pdfCanvas: HTMLCanvasElement;
    signSrc?: string;
    image?: CustomImageElement;
    signType: SignType;
    controlId: string;
    controlType: ControlType;
    isSelect?: boolean;
    isExpertSign?: boolean;
    isCompanySign?: boolean;
    isWrite?: boolean;
    canvasIndex?: number
  }


  export interface InitCanvasImageData {
    pdfCanvas: HTMLCanvasElement;
    imageData: any;
  }
  export type TooglePdfLoading = React.Dispatch<React.SetStateAction<{
    pdfLoading: boolean;
    desc: string;
  }>>;
  export interface IProtocolInfo {
    tplLink: string;
    signContents: any;
    signState: boolean;
    id: string;
    signPdfBuffer?: string;
  }
  export interface ITemplateInfo {
    dateTime: string;
    fileName: string;
    keyText: string;
    pathName:  string;
    signPositions: string;
    tplId:  string;
    tplLink:  string;
  }
  export interface ICanvasPosition {
    x: number;
    y: number;
  }
  export type UpdateSignList = (value: React.SetStateAction<ISignPosition[]>) => void;
  export type SignState = {
    expertSignState?: boolean,
    companySignState?: boolean,
    isWrite?: boolean
  }
  export type AddSignInCanvas = (signSrc: string, width?: number, height?: number) => void;
}

  interface HTMLCanvasElement {
    isCatchFirstImage?: boolean
  }