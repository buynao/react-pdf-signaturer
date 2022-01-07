
import * as React from "react";
import { ICanvasPosition } from "MyTypes";
import { drawCircle, drawLine } from "../../../../util/canvasTool";
import { getCanvasStandPosition } from "../../PDFViewer/util";
import { getMoveEvent, isPC } from "../../../../util/help";

const { useEffect, useRef, useState } = React;

interface SignInfo {
  color: string;
  lineWidth: number;
}

interface SvgSize {
  width: number;
  height: number;
}

const moveEvent = getMoveEvent();

export const useSvg = (writeSign: any, svgSize: SvgSize, writePath: any): React.RefObject<HTMLDivElement> =>  {
    const divRef = useRef<HTMLDivElement>(null);
    const oldOffset = useRef<ICanvasPosition>({} as ICanvasPosition);
    const newOffset = useRef<ICanvasPosition>({} as ICanvasPosition);
    const touchStartEventRef = useRef<any>();
    const touchMoveEventRef = useRef<any>();
    const touchEndEventRef = useRef<any>();
    const isMoveRef = useRef(false);

    let x = 0;
    let y = 0;
    let path = "";
    let minX = Infinity;
    let maxX = 0;
    let minY = Infinity;
    let maxY = 0;
    let paths = [];
    let drawing = false;
    // 开始画
    const touchStartEvent = (e: any) => {
      console.log(e.target)
      console.log(e)
      // if (e.target !== divRef.current) {
      //   return (drawing = false);
      // }
      drawing = true;
      const { x, y } = getCanvasStandPosition(e);
      console.log(x, y)
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      paths.push(["M", x, y]);
      path += `M${x},${y}`;
      writePath(path);
    }
    // 移动画
    const touchMoveEvent = (e: any) => {
      if (!drawing) return;
      const { x, y } = getCanvasStandPosition(e);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      paths.push(["L", x, y]);
      path += `L${x},${y}`;
      console.log(path);
      writePath(path);
    }
    // 结束画
    const touchEndEvent = (e: any) => {
      drawing = false;
    }
    // 添加事件监听
    function addCanvasEvent() {
      const $c = divRef.current;
      if (!$c) return;
      touchStartEventRef.current = (e: any) => {
          touchStartEvent(e);
          e.preventDefault();
      };
      touchMoveEventRef.current = (e: any) => {
          touchMoveEvent(e);
          e.preventDefault();
      };
      touchEndEventRef.current = (e: any) => {
          touchEndEvent(e);
          e.preventDefault();
      };
      $c.addEventListener(moveEvent.start, touchStartEventRef.current);
      $c.addEventListener(moveEvent.move, touchMoveEventRef.current);
      $c.addEventListener(moveEvent.end, touchEndEventRef.current);
    }
    // 移除事件监听
    function canvasRemoveClick() {
      const $c = divRef.current;
      if (!$c) return;
        // 移除之前的事件监听
        if(touchStartEventRef.current) {
          $c.removeEventListener(moveEvent.start, touchStartEventRef.current);
          $c.removeEventListener(moveEvent.move, touchMoveEventRef.current);
          $c.removeEventListener(moveEvent.end, touchEndEventRef.current);
        }
    }

    useEffect(() => {
      if (!divRef.current) return;
      console.log(`当前canvas大小：${JSON.stringify(svgSize)}`)
      divRef.current.style.width = isPC ? '100%' : svgSize.width + 'px';
      divRef.current.style.height = svgSize.height + 'px';
      
      addCanvasEvent();
      return () => {
        canvasRemoveClick();
      }
    }, [svgSize]);
  
    return divRef;
}
