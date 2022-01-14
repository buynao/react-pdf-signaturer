
import { ISignPosition, InitCanvasImageData, UpdateSignList, ICanvasPosition } from "MyTypes";
import { drawRect, drawImage, clearSignToolPosition, getSignToolPositon } from "../../../util/canvasTool";
import { getEvent } from "../../../util/help";


export const clearSignTool = (
  sign: ISignPosition,
  signList: ISignPosition[],
  updateSignList: UpdateSignList
) => {
  if (!sign.isSelect && sign.image) {
    // 将之前的辅助线移除
    const newSignList = clearSignToolPosition(signList);
    const toolsPosition = getSignToolPositon(sign);
    sign.isSelect = true;
    updateSignList([...newSignList, ...toolsPosition]);
  }
}

export const getDiffOffset = (
  newOffset: ICanvasPosition,
  oldOffset: ICanvasPosition
) => {
    return {
      x: newOffset.x - oldOffset.x,
      y: newOffset.y - oldOffset.y
    }
}

export const drawMoveCanvas = (
  ctx: CanvasRenderingContext2D,
  signList: ISignPosition[],
  selectSign: ISignPosition,
  diffOffset: ICanvasPosition,
  isMoving: boolean
) => {
  // 渲染出当前的签名大小宽高
  const newImage = getImageOffset(selectSign, signList, diffOffset);
  // 根据签名获取变形区
  const newSignToolList = getSignToolPositon(newImage);
  // 替换新图片
  const newImageSignList = signList.map(sign => {
    if (sign.id === newImage.id) {
      return newImage;
    }
    return sign;
  });
  // 老工具id删除
  const filterSignList = newImageSignList.filter(sign => sign?.controlId !== newImage.id);
  if (!isMoving) return [...filterSignList, ...newSignToolList];
  const newSignList = [...filterSignList, ...newSignToolList];
  newSignList.forEach(signPos => {
      const { pdfCanvas, image } = signPos;
      // 只渲染当前画布
      if (selectSign.pdfCanvas === pdfCanvas) {
          if (image) {
            drawImage(ctx, signPos);
          } else {
            drawRect(ctx, signPos);
          }
      }
  });
}

// 获取签名图片的大小位置
function getImageOffset(selectSign: ISignPosition,  signList: ISignPosition[], offset: ICanvasPosition) {
    const { controlType, controlId, image } = selectSign;
    if (image) {
      return {
        ...selectSign,
        x: offset.x + selectSign.x,
        y: offset.y + selectSign.y
      }
    }
    const imageSign = signList.filter(sign => sign.id === controlId);
    const { h, w, x, y } = imageSign[0];
    switch (controlType) {
      case 'lt': {
        return {
          ...imageSign[0],
          h: h - offset.y,
          w: w - offset.x,
          x: x + offset.x,
          y: y + offset.y
        }
      }
      case 'lc': {
        return {
          ...imageSign[0],
          w: w - offset.x,
          x: x + offset.x
        }
      }
      case 'lb': {
        return {
          ...imageSign[0],
          w: w - offset.x,
          h: h + offset.y,
          x: x + offset.x
        }
      }
      case 'rt': {
        return {
          ...imageSign[0],
          w: w + offset.x,
          h: h - offset.y,
          y: y + offset.y
        }
      }
      case 'rc': {
        return {
          ...imageSign[0],
          w: w + offset.x
        }
      }
      case 'rb': {
        return {
          ...imageSign[0],
          w: w + offset.x,
          h: h + offset.y
        }
      }
      default: {
        return imageSign[0]
      }
    }
}

// 返回canvas相对于视口的位置
export const getTouchPosition = (e: any, scale: number) => {
  const event = getEvent(e);
  const target = event.target;
  const rect = target.getBoundingClientRect();
  const x = event.pageX - rect.left;
  const y = event.pageY - rect.top;
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
  console.log(`初始位移x:${x}，y:${y}`)
  console.log(`scale:${scale}`)
  console.log(`最终位移:${JSON.stringify({
    x: x / scale,
    y: y / scale
  })}`);
  console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<')
  return {
    x: x / scale,
    y: y / scale
  }
}
// 返回当前的偏移值
export const getCanvasStandPosition = (e: any) => {
  const event = getEvent(e);
  const target = event.target;
  const rect = target.getBoundingClientRect();
  const x = event.pageX - rect.left;
  const y = event.pageY - rect.top;
  return {
    x: x,
    y: y
  }
}
// 获取画布中的所有绘画
export const getSignPosition = (canvas: HTMLCanvasElement, signList: ISignPosition[]) : ISignPosition[] => {
  let signPositions = [] as ISignPosition[];
  signList.forEach((item) => {
      if (item.pdfCanvas === canvas) {
          signPositions.push(item)
      }
  })
  return signPositions;
}
// 获取当前鼠标点击是否选中了对应的画图
export const getPointInImage = (touchPosition: ICanvasPosition, signPositions: ISignPosition[]) => {
  let signImage = {} as ISignPosition;
  signPositions.forEach((signPos) => {
      const { x, y, w, h } = signPos;
      const startX = x;
      const endX = x + w;
      const startY = y;
      const endY = y + h;
      const tx = touchPosition.x;
      const ty = touchPosition.y;
      if (tx < startX || tx > endX  || ty < startY || ty > endY) {
          return false;
      }
      signImage = signPos;
  })
  return signImage;
}
// 获取当前canvas，里边包含初始帧
export const getCurCanvasInitImageData = (canvas: HTMLCanvasElement, imageDataList: InitCanvasImageData[]) : InitCanvasImageData  => {
  let initCurvas = {} as InitCanvasImageData;
  imageDataList.forEach((c) => {
      if (c.pdfCanvas === canvas) {
          initCurvas = c;
      }
  });
  return initCurvas;
}