
import * as React from "react";
import { ISignPosition } from "MyTypes";
import { drawImage, drawRect } from "../../util/canvasTool";
import { genSignInitState, createImage, isPC, noop } from "../../util/help";
import { PDFDocument } from "pdf-lib";
import download from 'downloadjs';

const { useCallback, useState } = React;

export const useEditPdf = (
  curPdfCanvas: HTMLCanvasElement,
  isPdfEndLoadRef: React.MutableRefObject<boolean>) =>  {
  const [ selectSign, saveSelectSign ] = useState<ISignPosition | undefined>();
  const [ signList, updateSignList] = useState<ISignPosition[]>([]);
  const [ pdfReadBuffer, savePdfReadBuffer ] = useState<ArrayBuffer | null>(null);
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
      const deleteSignList = signList.filter((sign) => {
          if (selectSign) {
            const isDelete = sign.id === selectSign.id;
            if (isDelete) {
              return !isDelete;
            }
            return sign.signType !== 'rectTool';
          }
          return false;
      });
      updateSignList(deleteSignList);
  }, [selectSign, signList]);
  // 下载pdf
  const downloadPdf = useCallback(async () => {
    const newPdfDoc = await PDFDocument.load(pdfReadBuffer as ArrayBuffer);
    const pagesProcesses = newPdfDoc.getPages().map(async (page, pageIndex) => {
      const { width, height } = page.getSize();
      const signs = signList.filter((sign) => sign.pageIndex === pageIndex);
      const drawIntoPageTask = signs.map(async (sign) => {
          let { signSrc, x, y, w, h, pdfCanvas } = sign;
          const scale = pdfCanvas.width / width;
          const ex = x / scale;
          const ey = y / scale;
          try {
            let img = await newPdfDoc.embedPng(signSrc as string);
            return () => page.drawImage(img, {
                x: ex,
                y: height - ey - h / scale,
                width: w / scale,
                height: h / scale,
              });
          } catch (e) {
            return noop;
          }
      });
      const drawProcesses = await Promise.all(drawIntoPageTask);
      drawProcesses.forEach((p) => p());
    });
    await Promise.all(pagesProcesses);
    const pdfBytes = await newPdfDoc.save();
    download(pdfBytes, 'download', 'application/pdf');
  }, [pdfReadBuffer, signList]);
  // 上传pdf
  const uploadPdf = useCallback(async (e: any) => {
      if (e.target.files) {
        const file = e.target.files[0];
        const arrayBuffer = await file.arrayBuffer();
        savePdfReadBuffer(arrayBuffer);
        isPdfEndLoadRef.current = false;
      }
  }, []);
  return {
    addSignInCanvas, deleteSignInCanvas, downloadPdf, uploadPdf,
    saveSelectSign,
    signList, updateSignList, pdfReadBuffer
  }
}
