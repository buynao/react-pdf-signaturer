import * as React from "react";
import "./SignPannelTool.less";
import { AddSignInCanvas } from "MyTypes";
import bold1 from "./images/bold1.png";
import bold2 from "./images/bold2.png";
import bold3 from "./images/bold3.png";
import classnames from "classnames";
import { createImage, isPC } from "../../../../util/help";

interface Props {
  addSignInCanvas: AddSignInCanvas;
  hideSignWritePannel: () => void;
}
type ClipData = {
  w: number;
  h: number;
  x: number;
  y: number;
}
function clipCanvas(canvas: HTMLCanvasElement, clipData: ClipData): Promise<string> {
  return new Promise((resolve, reject) => {
    const { x, y, w, h } = clipData;
    let image: HTMLImageElement | null = new Image();
    let clipCanvas: HTMLCanvasElement | null = document.createElement('canvas');
    const clipCtx = clipCanvas.getContext('2d') as CanvasRenderingContext2D;
    clipCanvas.width = clipData.w;
    clipCanvas.height = clipData.h;

    const MIME_TYPE = "image/png";
    const imgUrl = canvas.toDataURL(MIME_TYPE);

    image.src = imgUrl;
    image.onload = function () {
      if (image && clipCanvas) {
        clipCtx.drawImage(image, x, y, w, h, 0, 0, w, h);
        resolve(clipCanvas.toDataURL(MIME_TYPE))
      }
      clipCanvas = null;
      image = null;
    }
  });
}
function SignPannelTool(props: any) {
  const { canvas, clipSize, isWrite, addSignInCanvas, hideSignWritePannel,
    lineWidth, color, writeSign, setColor, setLineWidth } = props;

  // 保存
  const saveSign = async () => {
    if (!canvas) return;
    if (isWrite) {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const imgData = await clipCanvas(canvas, clipSize);
      // 横屏保存
      if (isPC || window.orientation === 90) {
        addSignInCanvas(imgData, clipSize.w, clipSize.h);
        hideSignWritePannel();
      } else {
        // 竖屏状态 - 翻转图像进行保存
        ctx.clearRect(0, 0, width, height);
        canvas.width = clipSize.h;
        canvas.height = clipSize.w;
  
        const img = createImage(imgData)
        img.onload = function () {
          // 反向翻转绘制图片
          ctx.save();
          ctx.translate(clipSize.h / 2, clipSize.w / 2);
          ctx.rotate(-90 * Math.PI/180);
          ctx.translate(-clipSize.h / 2, - clipSize.w / 2);
          ctx.drawImage(img, clipSize.h / 2 - img.width / 2, clipSize.w / 2 - img.height / 2);
          ctx.restore();
          setTimeout(async () => {
            const url = canvas.toDataURL('image/png');
            addSignInCanvas(url, canvas.width, canvas.height);
            hideSignWritePannel();
          })
        }
      }
    }
  }

  // 清除
  const clearSign = () => {
    const $c = canvas;
    if (!$c) return;
    const ctx = $c.getContext("2d") as CanvasRenderingContext2D;
    if (isWrite) {
      ctx?.clearRect(0, 0, $c.width, $c.height);
      writeSign(false)
    } else {
      hideSignWritePannel();
    }
  }
  // 画笔粗细 class
  const bold3Cls = classnames('bold', {
    select: lineWidth === 3
  });
  const bold7Cls = classnames('bold', {
    select: lineWidth === 7
  });
  const bold11Cls = classnames('bold', {
    select: lineWidth === 11
  });

  // 画笔颜色 class
  const colorRedCls = classnames('color', 'red' , {
    select: color === 'red'
  });
  const colorBlackCls = classnames('color', 'black',{
    select: color === 'black'
  });
  const colorBlue1Cls = classnames('color', 'blue', {
    select: color === 'blue'
  });

  return <><div className="canvas-write-tool">
        <div className="bold-wrap">
          <img className={bold3Cls} src={bold1} onClick={() => setLineWidth(3)} alt="bold3" />
          <img className={bold7Cls} src={bold2} onClick={() => setLineWidth(7)} alt="bold7" />
          <img className={bold11Cls} src={bold3} onClick={() => setLineWidth(11)} alt="bold11" />
        </div>
        <div className="button-wrap">
          <button className="button clear" onClick={clearSign} >clean</button>
          <button className="button save" onClick={saveSign} >save</button>
        </div>

        <div className="color-wrap">
          <span className={colorRedCls} onClick={() => setColor('red')} />
          <span className={colorBlackCls} onClick={() => setColor('black')} />
          <span className={colorBlue1Cls} onClick={() => setColor('blue')} />
        </div>
    </div>
    <div className="canvas-write-title">
        <img src="https://buynao.oss-cn-beijing.aliyuncs.com/iep/close.png"
        className="canvas-write-tool-span return"
        onClick={() => hideSignWritePannel()} />
        <div className="title-box">
          <p>D</p>
          <p>r</p>
          <p>a</p>
          <p>w</p>
          <p>S</p>
          <p>i</p>
          <p>g</p>
          <p>n</p>
        </div>
    </div>
    </>
}

export default SignPannelTool;