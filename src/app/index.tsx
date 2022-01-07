import * as React from "react";
import "./global.less";
import PdfViewComponent from "./component/PDFViewer";
import PDFcontrol from "./component/PDFControl";
import SignWritePannel from "./component/SignWritePannel";
import { genSignInitState, createImage, isPC } from "../util/help";
import { drawImage, drawRect } from "../util/canvasTool";
import { useGetCanvasFirstImages } from "./hooks/";
import pdfIcon from "./assets/pdf.png";
import { ISignPosition, PositionType } from "MyTypes";
import { useAlert } from "react-alert";

const { useEffect, useState, useCallback, useRef } = React;

// 强制pc&web渲染比例一致，pdfjs底层使用
window.devicePixelRatio = 3;

function ProtocolPage() {
  const alert = useAlert();
  const pdfViewerRef = useRef<any>();
  const isPdfEndLoadRef = useRef<boolean>(false);
  const isShowAllPdfsRef = useRef(false);
  const [ isShowAllPdfs, toogleShowAllPdfs ] = useState(false);
  const [ isPdfBeginLoad, pdfBeginLoaded ] = useState(false);
  const [ pdfCanvasNoLoad, triggerGetCanvasImages ] = useState(0);
  const [ selectSign, saveSelectSign ] = useState<ISignPosition | undefined>();

  // 存储当前页面中canvas的第一帧 & 添加渲染层
  useGetCanvasFirstImages(pdfCanvasNoLoad, isPdfBeginLoad, isPdfEndLoadRef);
  // 签名list集合
  const [ signList, updateSignList] = useState<ISignPosition[]>([]);
  // 当前选中的canvas
  const [ curPdfCanvas, saveCurPdfCanvas ] = useState<HTMLCanvasElement | null>(null);
  const [ showSignWritePannel, toggleShowSignWritePannel ] = useState(false);
  const [ pdfBuffer, savePdfBuffer ] = useState<ArrayBuffer | null>(null);

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
      // 2、过滤当前角色所观察到的辅助线
      let drawSignList = signList;
      const isDrawAll = !curPdfCanvas || showAllPdfs;
      if (!isDrawAll) {
        drawSignList = drawSignList.filter((sign) => sign.pdfCanvas === curPdfCanvas)
      }
      for (let sign of drawSignList) {
        const { pdfCanvas, image, signType } = sign;
        if (!pdfCanvas) continue;
        const ctx = pdfCanvas.getContext("2d");
        if (!ctx) continue;
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
    // 逻辑判断区
    if (signList.length) {
      if(isPdfEndLoadRef.current && !isShowAllPdfsRef.current) {
        toogleShowAllPdfs(true);
        isShowAllPdfsRef.current = true;
        drawSign(isShowAllPdfsRef.current)
        console.log('绘全局')
      } else {
        drawSign()
      }
    } else if(curPdfCanvas) {
      console.log('清空');
        // 当前绘制case
        const ctx = curPdfCanvas?.getContext("2d");
        if (!ctx) return;
        // ctx.clearRect(0, 0, curPdfCanvas.width, curPdfCanvas.height);
    }
  }, [signList, curPdfCanvas])

  const addSignInCanvas = useCallback((
    signSrc: string,
    signW?: number,
    signH?: number
  ) => {
    if (!curPdfCanvas) return;
    const ctx = curPdfCanvas?.getContext("2d");
    let newSignList = [...signList]
    if (!curPdfCanvas || !ctx) return;
    const image = createImage(signSrc);
    const signPosition = genSignInitState() as ISignPosition;
    if (selectSign) {
      newSignList = newSignList.map((sign) => {
          const { w, h, x, y } = sign; // 签署区的宽高
          if (sign.id === selectSign.id) {
            let endW = w;
            let endH = h;
            let endX = x;
            let endY = y;
            if (signW && signH) { // 签名的宽高
              const signScale = signH / signW;
              const posScale = h / w;
              if (signScale < posScale) {
                endH = endW * signScale
                endY = y + h /2 - endH / 2;
              } else {
                endW = endH * signW / signH;
                endX = x + w / 2 - endW / 2;
              }
            }
            return {
              ...selectSign,
              w: endW,
              h: endH,
              x: endX,
              y: endY,
              image,
              signSrc,
              signType: 'image',
              isWrite: true
            };
          }
          return sign;
      })
    } else {
      newSignList.push({
        ...signPosition,
        image,
        pdfCanvas: curPdfCanvas,
        signSrc,
        signType: 'image',
        isWrite: true
      });
    }

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
      updateSignList(deleteSignList);
      alert.success("删除成功");
  }, [selectSign, signList])

  // 唤起签名弹窗
  const showSignWrritePannel = () => {
      toggleShowSignWritePannel(true);
  }
  // 隐藏签名弹窗
  const hideSignWritePannel = useCallback(() => {
      toggleShowSignWritePannel(false);
  }, []);
  return <div className={`${isPC() ? 'pcMode' : ''}`}>
  <div className={`pdf-wrap`}>
    <PDFcontrol
        pdfViewerRef={pdfViewerRef}
        isShowAllPdfs={isShowAllPdfs}
        saveSelectSign={saveSelectSign}
        updateSignList={updateSignList}
        selectSign={selectSign as ISignPosition}
        deleteSignInCanvas={deleteSignInCanvas}
        addSignInCanvas={addSignInCanvas}
        curPdfCanvas={curPdfCanvas as HTMLCanvasElement}
        showSignWrritePannel={showSignWrritePannel}
        signList={signList}
        signApiList={[]}
      />
    {
    !pdfBuffer ? 
      <div className="upload-pdf">
        <input type="file" accept="pdf" title="上传PDF" onChange={async (e) => {
          if (e.target.files) {
            const file = e.target.files[0];
            const arrayBuffer = await file.arrayBuffer();
            savePdfBuffer(arrayBuffer);
          }
        }} />
        <img src={pdfIcon} title="上传PDF" alt="上传PDF"/>
      </div> : 
      <><PdfViewComponent
        pdfViewerRef={pdfViewerRef}
        pdfBuffer={pdfBuffer as ArrayBuffer}
        signList={signList}
        triggerGetCanvasImages={triggerGetCanvasImages}
        updateSignList={updateSignList}
        curPdfCanvas={curPdfCanvas as HTMLCanvasElement}
        saveCurPdfCanvas={saveCurPdfCanvas}
        saveSelectSign={saveSelectSign}
        pdfBeginLoaded={pdfBeginLoaded}
      />
      {showSignWritePannel ? <SignWritePannel
          hideSignWritePannel={hideSignWritePannel}
          addSignInCanvas={addSignInCanvas}
        /> : null}
      </>
    }
  </div>
  </div>
}

export default ProtocolPage;