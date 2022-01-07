
import * as React from "react";
import { ICanvasPosition } from "MyTypes";
import { drawCircle, drawLine, setCanvas } from "../../../../util/canvasTool";
import { getCanvasStandPosition } from "../../PDFViewer/util";
import { getMoveEvent } from "../../../../util/help";

const { useEffect, useRef, useState } = React;

interface SignInfo {
  color: string;
  lineWidth: number;
}

interface CanvasSize {
  width: number;
  height: number;
}

const moveEvent = getMoveEvent();

export const useCanvas = (writeSign: any, signInfo: SignInfo, canvasSize: CanvasSize): React.RefObject<HTMLCanvasElement> =>  {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const oldOffset = useRef<ICanvasPosition>({} as ICanvasPosition);
    const newOffset = useRef<ICanvasPosition>({} as ICanvasPosition);
    const touchStartEventRef = useRef<any>();
    const touchMoveEventRef = useRef<any>();
    const touchEndEventRef = useRef<any>();
    const isMoveRef = useRef(false);
    // 开始画
    const touchStartEvent = (e: any, canvas: HTMLCanvasElement) => {
      const c = canvas;
      const ctx = c.getContext('2d');
      if(!ctx) return;
      const canvasPosition = getCanvasStandPosition(e);
      isMoveRef.current = true;;
      drawCircle(ctx, canvasPosition.x, canvasPosition.y, 0);
      newOffset.current = oldOffset.current = {
        x: canvasPosition.x,
        y: canvasPosition.y
      }
    }
    // 移动画
    const touchMoveEvent = (e: any, canvas: HTMLCanvasElement) => {
        if (isMoveRef.current) {
            const c = canvas;
            const ctx = c.getContext('2d');
            if (!ctx) return;            // 当前鼠标的移动位置
            newOffset.current = getCanvasStandPosition(e);
            drawLine(ctx, oldOffset.current.x, oldOffset.current.y, newOffset.current.x, newOffset.current.y);
            oldOffset.current = {
              x: newOffset.current.x,
              y: newOffset.current.y
            };
        }
    }
    // 结束画
    const touchEndEvent = (e: any, canvas: HTMLCanvasElement) => {
        const c = canvas;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        if (isMoveRef.current) {
          isMoveRef.current = false;
          writeSign(true);
        }
    }
    // 添加事件监听
    function addCanvasEvent() {
      const $c = canvasRef.current;
      if (!$c) return;
      touchStartEventRef.current = (e: any) => {
          touchStartEvent(e, $c);
          e.preventDefault();
      };
      touchMoveEventRef.current = (e: any) => {
          touchMoveEvent(e, $c);
          e.preventDefault();
      };
      touchEndEventRef.current = (e: any) => {
          touchEndEvent(e, $c);
          e.preventDefault();
      };
      $c.addEventListener(moveEvent.start, touchStartEventRef.current);
      $c.addEventListener(moveEvent.move, touchMoveEventRef.current);
      $c.addEventListener(moveEvent.end, touchEndEventRef.current);
    }
    // 移除事件监听
    function canvasRemoveClick() {
      const $c = canvasRef.current;
      if (!$c) return;
        // 移除之前的事件监听
        if(touchStartEventRef.current) {
          $c.removeEventListener(moveEvent.start, touchStartEventRef.current);
          $c.removeEventListener(moveEvent.move, touchMoveEventRef.current);
          $c.removeEventListener(moveEvent.end, touchEndEventRef.current);
        }
    }

    useEffect(() => {
      if (!canvasRef.current) return;
      console.log(`当前canvas大小：${JSON.stringify(canvasSize)}`)
      canvasRef.current.width = canvasSize.width;
      canvasRef.current.height = canvasSize.height;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      addCanvasEvent();
      return () => {
        canvasRemoveClick();
      }
    }, [canvasSize]);
    useEffect(() => {
        if (!canvasRef.current) return;
        setCanvas(canvasRef.current, signInfo)
    }, [signInfo]);
  
    return canvasRef;
}
