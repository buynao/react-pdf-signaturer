import * as React from "react";
import "./index.less";
import { useCanvas } from "./hooks/useCanvas"
import { useSvg } from "./hooks/useSvg"
import SignPannelTool from "./component/SignPannelTool";
import { AddSignInCanvas } from "MyTypes";
import { createImage, isPC } from "../../../util/help";
const { useState, useEffect, useCallback } = React;

interface CanvasSize {
  width: number;
  height: number;
}

interface Props {
  showSignWritePannelState: boolean;
  addSignInCanvas: AddSignInCanvas;
  hideSignWritePannel: () => void;
}

function getCanvasSize(): Promise<CanvasSize> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (window.orientation === 90) {
        resolve({
          width: window.innerWidth,
          height: window.innerHeight- 120,
        })
      } else {
        resolve({
          width: window.innerWidth - 120,
          height: window.innerHeight,
        })
      }
    }, 500)
  })
}

function getInitSize() {
    if (window.orientation === 90) {
      return {
        width: window.innerWidth,
        height: window.innerHeight - 120,
      }
    } else {
      return {
        width: window.innerWidth - 120,
        height: window.innerHeight,
      }
    }
}
const canvasInitSize = getInitSize();

function SignWritePannel(props: Props) {
  const { addSignInCanvas, hideSignWritePannel, showSignWritePannelState } = props;

  if (!showSignWritePannelState) return null;

  const [ clipSize, saveClipSize ] = useState({ // 签名区域大小
    w: 0,
    h: 0,
    x: 0,
    y: 0
  });
  const [ isWrite, writeSign ] = useState(false);
  const [ lineWidth, setLineWidth] = useState(7);
  const [ color, setColor] = useState('black');
  const [ canvasSize, updateCanvasSize] = useState<CanvasSize>(canvasInitSize)
  const canvasRef = useCanvas(writeSign, {lineWidth, color}, canvasSize, saveClipSize);
  // const divRef = useSvg(writeSign, canvasSize, writePath);

  const handleCanvasSize = useCallback(async () => {
      const size = await getCanvasSize();
      updateCanvasSize(size);
  }, []);

  useEffect(() => {
    // 进入画面绘制页面，获取初始化大小
    handleCanvasSize();
    window.addEventListener("orientationchange", handleCanvasSize);
    return () => {
      window.removeEventListener("orientationchange", handleCanvasSize);
    }
  }, []);
  
  return <div className="canvas-write-wrap-bg">
      <div className="canvas-write-wrap" style={{
        width: isPC ? 800 : canvasSize.width,
        height: canvasSize.height
      }}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <SignPannelTool
        clipSize={clipSize}
        writeSign={writeSign}
        isWrite={isWrite}
        color={color}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        setColor={setColor}
        canvas={canvasRef.current}
        addSignInCanvas={addSignInCanvas}
        hideSignWritePannel={hideSignWritePannel}
      />
  </div>
}

export default SignWritePannel;

