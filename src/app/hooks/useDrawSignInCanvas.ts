
import * as React from "react";
import { ISignPosition } from "MyTypes";
import { drawImage, drawRect } from "../../util/canvasTool";

const { useEffect, useRef } = React;

export const useDrawSignInCanvas = (
  curPdfCanvas: HTMLCanvasElement,
  signList: ISignPosition[],
  isPdfEndLoadRef: React.MutableRefObject<boolean>) =>  {
  const isShowAllPdfsRef = useRef(false);

  const cleanCurCanvas = () => {
    if (curPdfCanvas) {
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
  }

  // 根据signList签名列表进行绘画
  useEffect(() => {
    async function drawSign(showAllPdfs?: boolean) {
      cleanCurCanvas();

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
    if(isPdfEndLoadRef.current && !isShowAllPdfsRef.current) {
      // toogleShowAllPdfs(true);
      isShowAllPdfsRef.current = true;
      drawSign(isShowAllPdfsRef.current);
    } else {
      drawSign()
    }
  }, [signList, curPdfCanvas]);
}
