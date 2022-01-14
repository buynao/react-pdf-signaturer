
import * as React from "react";
import { ISignPosition, ICanvasPosition, UpdateSignList } from 'MyTypes';
import { getDiffOffset, clearSignTool,
    drawMoveCanvas, getTouchPosition, 
    getSignPosition, getPointInImage } from "./util";
import { clearSignToolPosition } from "../../../util/canvasTool";
import { getMoveEvent } from "../../../util/help";

const moveEvent = getMoveEvent();
const { useEffect, useRef, useState } = React;

export interface IProps {
  pdfReadBuffer: ArrayBuffer;
  scale?: number;
  pdfViewerRef: any;
  pdfFileRef: any;
  signList: ISignPosition[];
  updateSignList: UpdateSignList;
  saveCurPdfCanvas: (canvas: HTMLCanvasElement) => void;
  curPdfCanvas: HTMLCanvasElement;
  saveSelectSign: (sign: ISignPosition | undefined) => void;
  pdfBeginLoaded: (bol: boolean) => void;
  triggerCanvasLoad: React.Dispatch<React.SetStateAction<number>>
  uploadPdf: (e: any) => Promise<void>
};

export const useHandleCanvasEvent = (
  props: IProps,
  pdfRef: React.RefObject<HTMLDivElement>) => {
    const {
        curPdfCanvas, saveCurPdfCanvas, signList,
        updateSignList, triggerCanvasLoad,
        saveSelectSign, scale
    } = props;
    const touchStartEventRef = useRef<any>();
    const touchMoveEventRef = useRef<any>();
    const touchEndEventRef = useRef<any>();
    const isMoveRef = useRef(false);
    const signPositions = useRef<ISignPosition[]>([]);
    const selectSignRef = useRef<ISignPosition>({} as ISignPosition);
    const newOffset = useRef<ICanvasPosition>({} as ICanvasPosition);
    const oldOffset = useRef<ICanvasPosition>({} as ICanvasPosition);
    const signMoveRef = useRef(false);

    // canvas 元素事件
    const touchStartEvent = (e: any, canvas: HTMLCanvasElement) => {
        const c = canvas;
        signPositions.current = getSignPosition(c, signList);
        const ctx = c.getContext('2d');
        if (!signPositions.current.length || !ctx) return;
        const touchPosition = getTouchPosition(e, scale);
        const curImage = getPointInImage(touchPosition, signPositions.current);

        if (!!curImage.id) {
            isMoveRef.current = true;
            selectSignRef.current = curImage;
        }
        // 选中中，如果是图像增加辅助框，且只增加一次
        if (isMoveRef.current) {
            // 储存当前的选择区
            saveSelectSign(curImage);
            // 清除之前所选择的辅助线
            clearSignTool(curImage, signList, updateSignList);
            // 设置移动初始值
            newOffset.current = oldOffset.current = {
                x: touchPosition.x,
                y: touchPosition.y
            }
        } else {
            // 将之前的辅助线移除
            const newSignList = clearSignToolPosition(signList);
            updateSignList([...newSignList]);
            saveSelectSign(undefined);
        }
    }
    // 移动画布
    const touchMoveEvent = (e: any, canvas: HTMLCanvasElement) => {
        if (isMoveRef.current) {
            e.preventDefault();
            const c = canvas;
            const ctx = c.getContext('2d');
            if (!ctx) return;
            // 当前鼠标的移动位置
            newOffset.current = getTouchPosition(e, scale);
            const diffOffset = getDiffOffset(newOffset.current, oldOffset.current);

            // 清除画布
            ctx.clearRect(0, 0, c.width, c.height);
            // ctx.putImageData(curCanvasInit.imageData, 0, 0);
            ctx.beginPath();
            // 开始重绘
            drawMoveCanvas(ctx, signList, selectSignRef.current, diffOffset, true);
        }
    }
    const touchEndEvent = (e: any, canvas: HTMLCanvasElement) => {
        const c = canvas;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        if (isMoveRef.current) {
            const diffOffset = getDiffOffset(newOffset.current, oldOffset.current);
            const newList = drawMoveCanvas(ctx, signList, selectSignRef.current, diffOffset, false)
            updateSignList(newList as ISignPosition[]);
            isMoveRef.current = false;
        }
    }
    // 事件监听处理
    useEffect(() => {
        const $pdf = pdfRef.current;
        if (!$pdf) return;
        // canvaswrap 点击事件
        function pdfHandledClick (e: any) {
            // 选中canvas元素时，禁止事件冒泡
            if (signMoveRef.current) return;
            const canvas = e.target as any;
            if (!canvas || !canvas.getContext) return;
            if (canvas.getAttribute('aria-label')) {
                triggerCanvasLoad((num: number) => ++num);
                return;
            }
            // 添加交互样式
            const childrens = $pdf?.children as unknown as Element[];
            [...childrens].forEach((ele) => {
                ele.className  = 'page';
            })
            canvas.parentNode.parentNode.className = 'page active';
            // 保存当前画布
            saveCurPdfCanvas(canvas);
            const newSignList = clearSignToolPosition(signList);
            updateSignList([...newSignList]);
        }
        function canvasAddClick() {
            if (!curPdfCanvas) return;
            touchStartEventRef.current = (e: any) => {
                signMoveRef.current = true;
                touchStartEvent(e, curPdfCanvas);
            };
            touchMoveEventRef.current = (e: any) => {
                touchMoveEvent(e, curPdfCanvas);
            };
            touchEndEventRef.current = (e: any) => {
                touchEndEvent(e, curPdfCanvas);
                setTimeout(() => {
                    signMoveRef.current = false;
                }, 100);
            };
            curPdfCanvas.addEventListener(moveEvent.start, touchStartEventRef.current, true);
            curPdfCanvas.addEventListener(moveEvent.move, touchMoveEventRef.current, true);
            curPdfCanvas.addEventListener(moveEvent.end, touchEndEventRef.current, true);
        }
        function canvasRemoveClick() {
            // 移除之前的事件监听
            if(touchStartEventRef.current) {
                curPdfCanvas.removeEventListener(moveEvent.start, touchStartEventRef.current, true);
                curPdfCanvas.removeEventListener(moveEvent.move, touchMoveEventRef.current, true);
                curPdfCanvas.removeEventListener(moveEvent.end, touchEndEventRef.current, true);
            }
        }
        canvasAddClick();
        $pdf.addEventListener('click', pdfHandledClick);
        return () => {
            canvasRemoveClick();
            $pdf.removeEventListener('click', pdfHandledClick)
        }
    }, [curPdfCanvas, signList]);
}
