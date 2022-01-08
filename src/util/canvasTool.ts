
import { ISignPosition, InitCanvasImageData, ICanvasPosition } from "MyTypes";
import { v4 } from "uuid";
import { RECT_TOOL_SIZE } from "../app/constants";

const rect = RECT_TOOL_SIZE;

export const drawImage = (ctx: CanvasRenderingContext2D, sign: ISignPosition) => {
  const {  isSelect, image, w, h } = sign;
  let x = Math.floor(sign.x);
  let y = Math.floor(sign.y);
  if (!image) {
    return;
  };
  // ctx.save();
  if (isSelect) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  // 如果加载过直接渲染
  if (image.complete) {
    ctx.drawImage(image, x, y, w, h);
    // ctx.restore();
  } else {
    // 渲染数据
    image.onload = function () {
      ctx.drawImage(image, x, y, w, h);
      // ctx.restore();
    }
  }
}

export const drawRect = (ctx: CanvasRenderingContext2D, sign: ISignPosition) => {
  const { w,h } = sign;
  let x = Math.floor(sign.x);
  let y = Math.floor(sign.y);
  ctx.save();
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.clearRect(x + 1, y + 1, w - 2, h - 2);
  ctx.restore();
}
export const drawFirstImage = (initImageDatas: InitCanvasImageData[], curPdfCanvas: HTMLCanvasElement | null) => {
  if (!initImageDatas.length) return;
  if (curPdfCanvas) {
    const drawCanvas = initImageDatas.filter(images => images.pdfCanvas === curPdfCanvas);
    const ctx = drawCanvas[0].pdfCanvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.clearRect(0, 0, drawCanvas[0].pdfCanvas.width, drawCanvas[0].pdfCanvas.height);
    ctx.putImageData(drawCanvas[0].imageData, 0, 0);
  } else {
    initImageDatas.forEach((image) => {
      if (!image.pdfCanvas) return;
      const ctx = image.pdfCanvas.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.clearRect(0, 0, image.pdfCanvas.width, image.pdfCanvas.height);
      ctx.putImageData(image.imageData, 0, 0);
    });
  }
}
export const getSignToolPositon = (sign: ISignPosition) => {
  const { x, y, id, pdfCanvas, w, h } = sign;
  // 左上
  const lt: ISignPosition = {
    x: x - rect,
    y: y - rect,
    w: rect,
    h: rect,
    signType: 'rectTool',
    id: v4().slice(0, 8),
    controlId: id,
    controlType: 'lt',
    pdfCanvas,
  };
  // 左中
  const lc: ISignPosition = {
      x: x - rect,
      y: y + h / 2 - rect / 2,
      w: rect,
      h: rect,
      signType: 'rectTool',
      id: v4().slice(0, 8),
      controlId: id,
      controlType: 'lc',
      pdfCanvas,
  };
  // 左下
  const lb: ISignPosition = {
      x: x - rect,
      y: y + h,
      w: rect,
      h: rect,
      signType: 'rectTool',
      id: v4().slice(0, 8),
      controlId: id,
      controlType: 'lb',
      pdfCanvas,
  };
  // 右上
  const rt: ISignPosition = {
      x: x + w,
      y: y - rect,
      w: rect,
      h: rect,
      signType: 'rectTool',
      id: v4().slice(0, 8),
      controlId: id,
      controlType: 'rt',
      pdfCanvas,
  };
  // 右中
  const rc: ISignPosition = {
      x: x + w,
      y: y + h/2 - rect/2,
      w: rect,
      h: rect,
      signType: 'rectTool',
      id: v4().slice(0, 8),
      controlId: id,
      controlType: 'rc',
      pdfCanvas
  };
  // 右下
  const rb: ISignPosition = {
      x: x + w,
      y: y + h,
      w: rect,
      h: rect,
      signType: 'rectTool',
      id: v4().slice(0, 8),
      controlId: id,
      controlType: 'rb',
      pdfCanvas
  };
  return [
    lt, lc, lb, rt, rc, rb
  ]
}
// 画点函数
export const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
  window.requestAnimationFrame(() => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  })
}
// 划线函数
export const drawLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
  window.requestAnimationFrame(() => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  })
}
// 设置颜色
export const setCanvas = (canvas: HTMLCanvasElement, signInfo: any) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = 'rgba(255, 255, 255, 0)';
  ctx.strokeStyle = signInfo.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = signInfo.lineWidth;
}
export const clearSignToolPosition = (signList: ISignPosition[]) => {
    // 没有选中，移除辅助框
    const newSignList = signList.filter(sign => {
        sign.isSelect = false;
        // sign.rotate = 0;
        const isToolLine = sign.signType === 'rectTool';
        return !isToolLine;
    });
    return newSignList;
}

export const initSignCanvasSize = () => {
  const signCanvas = document.querySelectorAll('.sign-canvas');
  signCanvas.forEach((sc: any) => {
    const parent = sc.parentElement;
    sc.style.width = parent?.style.width;
    sc.style.height = parent?.style.height;
  })
}