import * as React from "react";
import download from 'downloadjs';
import "./global.less";
import PdfViewComponent from "./component/PDFViewer";
import PDFcontrol from "./component/PDFControl";
import SignWritePannel from "./component/SignWritePannel";
import { genSignInitState, createImage, isPC } from "../util/help";
import { drawImage, drawRect } from "../util/canvasTool";
import { useCloneSignCanvas } from "./hooks/";
import pdfIcon from "./assets/pdf.png";
import { ISignPosition, PositionType } from "MyTypes";
import { useAlert } from "react-alert";
import { PDFDocument } from "pdf-lib";

const { useEffect, useState, useCallback, useRef } = React;
const noop = () => {};
// 强制pc&web渲染比例一致，pdfjs底层使用
window.devicePixelRatio = 3;

function ProtocolPage() {
  const alert = useAlert();
  const pdfFileRef = useRef<any>();
  const pdfViewerRef = useRef<any>();
  const isPdfEndLoadRef = useRef<boolean>(false);
  const isShowAllPdfsRef = useRef(false);
  const [ isShowAllPdfs, toogleShowAllPdfs ] = useState(false);
  const [ isPdfBeginLoad, pdfBeginLoaded ] = useState(false);
  const [ pdfCanvasNeedLoad, triggerCanvasLoad ] = useState(0);
  const [ selectSign, saveSelectSign ] = useState<ISignPosition | undefined>();

  // 添加渲染层
  useCloneSignCanvas(pdfCanvasNeedLoad, isPdfBeginLoad, isPdfEndLoadRef);
  // 签名list集合
  const [ signList, updateSignList] = useState<ISignPosition[]>([]);
  // 当前选中的canvas
  const [ curPdfCanvas, saveCurPdfCanvas ] = useState<HTMLCanvasElement | null>(null);
  const [ showSignWritePannelState, toggleShowSignWritePannel ] = useState(false);
  const [ pdfReadBuffer, savePdfReadBuffer ] = useState<ArrayBuffer | null>(null);

  // 根据signList签名列表进行绘画
  useEffect(() => {
    async function drawSign(showAllPdfs?: boolean) {
      // 1、清空画板开始绘画
      if (curPdfCanvas) {
        // 当前绘制case
        const ctx = curPdfCanvas?.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, curPdfCanvas.width, curPdfCanvas.height);
      } else {
        const $pages = document.querySelectorAll('.page');
        [...$pages].forEach(page => {
            const pdfCanvas = page.children[0].children[1] as HTMLCanvasElement;
            // 当前绘制case
            const ctx = pdfCanvas?.getContext("2d");
            if (!ctx) return;
            ctx.beginPath();
            ctx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
        });
      }

      let drawSignList = [...signList];
      const isDrawAll = !curPdfCanvas || showAllPdfs;
      if (!isDrawAll) {
        drawSignList = drawSignList.filter((sign) => sign.pdfCanvas === curPdfCanvas)
      }
      for (let sign of drawSignList) {
        const { pdfCanvas, image } = sign;
        if (!pdfCanvas) continue;
        const ctx = pdfCanvas.getContext("2d") as CanvasRenderingContext2D;
        if (!isDrawAll) {
          ctx.beginPath();
        }
        if (image) {
            drawImage(ctx, sign);
        } else {
            drawRect(ctx, sign);
        }
        if (!isDrawAll) {
          ctx.closePath();
        }
      }
    }
    console.log(signList);
    if(isPdfEndLoadRef.current && !isShowAllPdfsRef.current) {
      toogleShowAllPdfs(true);
      isShowAllPdfsRef.current = true;
      drawSign(isShowAllPdfsRef.current);
    } else {
      drawSign()
    }
  }, [signList, curPdfCanvas]);

  // 添加签名
  const addSignInCanvas = useCallback((
    signSrc: string,
    w: number,
    h: number
  ) => {
    if (!curPdfCanvas) return;
    const image = createImage(signSrc);
    const signPosition = genSignInitState() as ISignPosition;
    let newSignList = [...signList]
    newSignList.push({
      ...signPosition,
      image,
      pdfCanvas: curPdfCanvas,
      signSrc,
      w,
      h,
      pageIndex: +(curPdfCanvas.getAttribute('pageindex') as string),
      signType: 'image'
    });
    updateSignList([...newSignList]);
  }, [signList, curPdfCanvas, selectSign]);
  // 删除签名
  const deleteSignInCanvas = useCallback(() => {
      if (!selectSign) {
        alert.error("请先选择要删除的签名");
        return;
      }
      const deleteSignList = signList.filter((sign) => {
          const isDelete = sign.id === selectSign.id;
          if (isDelete) {
            return !isDelete;
          }
          return sign.signType !== 'rectTool';
      });
      console.log(signList);
      console.log(deleteSignList);
      updateSignList(deleteSignList);
      alert.success("clean success");
  }, [selectSign, signList]);
  // 唤起签名弹窗
  const showSignWritePannel = useCallback(() => {
    if (curPdfCanvas) {
      toggleShowSignWritePannel(true);
    }
  }, [curPdfCanvas]);
  // 隐藏签名弹窗
  const hideSignWritePannel = useCallback(() => {
    toggleShowSignWritePannel(false);
  }, []);
  // 下载pdf
  const downloadPdf =async () => {
    const newPdfDoc = await PDFDocument.load(pdfReadBuffer as ArrayBuffer);
    const pagesProcesses = newPdfDoc.getPages().map(async (page, pageIndex) => {
      const ph = page.getHeight();
      const pw = page.getWidth();
      const rate = 1925 / pw;
      const signs = signList.filter((sign) => sign.pageIndex === pageIndex);
      const drawIntoPageTask = signs.map(async (sign) => {
          let { signSrc, x, y, w, h } = sign;
          const ex = x / rate;
          const ey = y / rate;
          try {
            let img = await newPdfDoc.embedPng(signSrc as string);
            return () => page.drawImage(img, {
                x: ex,
                y: ph - ey - h / rate,
                width: w / rate,
                height: h / rate,
              });
          } catch (e) {
            console.log('Failed to embed image.', e);
            return noop;
          }
      });
      const drawProcesses = await Promise.all(drawIntoPageTask);
      drawProcesses.forEach((p) => p());
    });
    await Promise.all(pagesProcesses);
    const pdfBytes = await newPdfDoc.save();
    download(pdfBytes, 'name', 'application/pdf');
  }
  // 上传pdf
  const uploadPdf = async (e: any) => {
      if (e.target.files) {
        const file = e.target.files[0];
        const arrayBuffer = await file.arrayBuffer();
        savePdfReadBuffer(arrayBuffer);
      }
  }
  return <div className={`${isPC ? 'pcMode' : ''}`}>
  <div className={`pdf-wrap`}>
    <PDFcontrol
        uploadPdf={uploadPdf}
        downloadPdf={downloadPdf}
        pdfViewerRef={pdfViewerRef}
        isShowAllPdfs={isShowAllPdfs}
        saveSelectSign={saveSelectSign}
        updateSignList={updateSignList}
        selectSign={selectSign as ISignPosition}
        deleteSignInCanvas={deleteSignInCanvas}
        curPdfCanvas={curPdfCanvas as HTMLCanvasElement}
        showSignWritePannel={showSignWritePannel}
        signList={signList}
        signApiList={[]}
      />
    { !pdfReadBuffer ? 
      <div className="upload-pdf">
        <input type="file" accept="pdf" title="上传PDF" onChange={uploadPdf} />
        <img src={pdfIcon} title="上传PDF" alt="上传PDF"/>
      </div> :
      <PdfViewComponent
        pdfFileRef={pdfFileRef}
        pdfViewerRef={pdfViewerRef}
        pdfReadBuffer={pdfReadBuffer as ArrayBuffer}
        signList={signList}
        triggerCanvasLoad={triggerCanvasLoad}
        updateSignList={updateSignList}
        curPdfCanvas={curPdfCanvas as HTMLCanvasElement}
        saveCurPdfCanvas={saveCurPdfCanvas}
        saveSelectSign={saveSelectSign}
        pdfBeginLoaded={pdfBeginLoaded}
      />
    }
      <SignWritePannel
      showSignWritePannelState={showSignWritePannelState}
      hideSignWritePannel={hideSignWritePannel}
      addSignInCanvas={addSignInCanvas}
    />
  </div>
  </div>
}
export default ProtocolPage;