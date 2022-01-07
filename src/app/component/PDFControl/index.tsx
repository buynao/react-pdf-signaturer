import * as React from "react";
import "./index.less";
import { useAlert } from 'react-alert';
import { ISignPosition, AddSignInCanvas } from "MyTypes";
import { initSignCanvasSize } from "../../../util/canvasTool";
import { DEFAULT_SCALE_VALUE } from "../../constants/index";
import zoomOutIcon from "../../assets/zoomOut.png";
import zoomInIcon from "../../assets/zoomIn.png";
import deleteIcon from "../../assets/delete.png";
import downloadIcon from "../../assets/download.png";
import editdIcon from "../../assets/edit.png";
import textIcon from "../../assets/text.png";
import pdfIcon from "../../assets/pdfIcon.png";
import pictureIcon from "../../assets/picture.png";

interface Props {
  signApiList: ISignPosition[];
  signList: ISignPosition[];
  updateSignList: React.Dispatch<React.SetStateAction<ISignPosition[]>>
  saveSelectSign: (sign: ISignPosition | undefined) => void;
  selectSign: ISignPosition;
  curPdfCanvas: HTMLCanvasElement;
  showSignWrritePannel: () => void;
  addSignInCanvas: AddSignInCanvas;
  deleteSignInCanvas: () => void;
  isShowAllPdfs: boolean;
  pdfViewerRef: any;
}

const SignModal = React.memo((props: Props) => {
  const alert = useAlert()
  const [pdfScale, setPdfScale] = React.useState<any>(DEFAULT_SCALE_VALUE);
  const { signList, pdfViewerRef, curPdfCanvas, showSignWrritePannel, isShowAllPdfs,
     addSignInCanvas, deleteSignInCanvas, selectSign } = props;


  // 显示签名面板
  const showSignWritePannel = () => {
    showSignWrritePannel();
  }

  // 重新设置pdf尺寸
  const setPdfView = (scaleValue: number) => {
    pdfViewerRef.current.currentScaleValue = scaleValue;
    setPdfScale(scaleValue);
    initSignCanvasSize();
  }

  return <div className="pdf-tool-wrap">
      <h3 className="pdf-tool-title">PDF Signaturer</h3>
      <ul className="pdf-tool-list">
        <li className="tool-item zoom-out"onClick={() => setPdfView(pdfViewerRef.current._currentScale * 1.1)}>
          <img className="item-icon" src={zoomOutIcon} alt="zoomout" />
        </li>
        <li className="tool-item zoom-out" onClick={() => {
              if (pdfScale !== DEFAULT_SCALE_VALUE) {
                setPdfView(pdfViewerRef.current._currentScale / 1.1);
              }
          }}>
          <img className="item-icon zoom-in" src={zoomInIcon} alt="zoomin" />
        </li>
        <li className="tool-item zoom-out" onClick={() => {
              if (curPdfCanvas) {
                showSignWritePannel();
              }
          }}>
          <img className="item-icon zoom-in" src={editdIcon} alt="edit" />
        </li>
        <li className="tool-item zoom-out" onClick={() => {
              if (curPdfCanvas) {
                showSignWritePannel();
              }
          }}>
          <img className="item-icon zoom-in" src={deleteIcon} alt="clean" />
        </li>
      </ul>
          {/* <p onClick={() => setPdfView(pdfViewerRef.current._currentScale * 1.1)}
            className="zoom zoom-out">
              <img src={zoomOutIcon} alt="放大" />
          </p>
          <span className="line">|</span>
          <p onClick={() => {
              if (pdfScale !== DEFAULT_SCALE_VALUE) {
                setPdfView(pdfViewerRef.current._currentScale / 1.1);
              }
          }} className={`zoom zoom-in ${pdfScale === DEFAULT_SCALE_VALUE ? 'disable' : ''}`}>
          <img src={zoomInIcon} alt="缩小" />
          </p>
            <button className="button saveSignPosition" onClick={showSignWritePannel}>添加签名</button>
            <span className="line">|</span>
            <button className="button saveSignPosition" onClick={deleteSignInCanvas}>清除签名</button> */}

    </div>
})

export default SignModal;