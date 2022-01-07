import React, { useRef, useEffect } from 'react';
import { ISignPosition } from 'MyTypes';
import { getDiffOffset, clearSignTool,
    drawMoveCanvas, getTouchPosition, 
    getSignPosition, getPointInImage } from "./util";
import { clearSignToolPosition } from "../../../util/canvasTool";
import { DEFAULT_SCALE_VALUE } from "../../constants";
import { getMoveEvent } from "../../../util/help";

import 'pdfjs-dist/es5/web/pdf_viewer.css';
import './style.css'
import { useAlert } from 'react-alert';
const pdfjs = require('pdfjs-dist');
const pdfjsViewer = require('pdfjs-dist/es5/web/pdf_viewer');
pdfjs.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/es5/build/pdf.worker.entry');

export interface ICanvasPosition {
    x: number;
    y: number;
}
// 显示文字类型 0 不显示 1 显示 2 启用增强
const TEXT_LAYER_MODE = 0;
// 是否通过CSS控制放大缩小 true false
const USE_ONLY_CSS_ZOOM = true;

interface IProps {
    pdfBuffer: ArrayBuffer;
    pdfViewerRef: any;
    signList: ISignPosition[];
    updateSignList: React.Dispatch<React.SetStateAction<ISignPosition[]>>
    saveCurPdfCanvas: (canvas: HTMLCanvasElement) => void;
    curPdfCanvas: HTMLCanvasElement;
    saveSelectSign: (sign: ISignPosition | undefined) => void;
    pdfBeginLoaded: (bol: boolean) => void;
    triggerGetCanvasImages: React.Dispatch<React.SetStateAction<number>>
};

const moveEvent = getMoveEvent();

const PDFViewer = (props: IProps) => {
    const { curPdfCanvas, saveCurPdfCanvas, pdfBuffer, signList,
        updateSignList, pdfViewerRef, triggerGetCanvasImages,
        saveSelectSign, pdfBeginLoaded
    } = props;
    const alert = useAlert()
    const pdfRef = useRef<HTMLDivElement>(null);
    const eventBusRef = useRef<any>(new pdfjsViewer.EventBus());
    const linkServiceRef = useRef<any>();
    const touchStartEventRef = useRef<any>();
    const touchMoveEventRef = useRef<any>();
    const touchEndEventRef = useRef<any>();
    const isMoveRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
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
        const touchPosition = getTouchPosition(e, c.width);
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
            newOffset.current = getTouchPosition(e, c.width);
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


    // 渲染pdf
    useEffect(() => {
        if (pdfBuffer) {
            const linkService = new pdfjsViewer.PDFLinkService({
                eventBus: eventBusRef.current,
              });
            const pdfViewer = new pdfjsViewer.PDFViewer({
                container: containerRef.current,
                eventBus: eventBusRef.current,
                linkService,
                maxCanvasPixels: 5242880,
                l10n: pdfjsViewer.NullL10n,
                useOnlyCssZoom: USE_ONLY_CSS_ZOOM,
                textLayerMode: TEXT_LAYER_MODE
            });

            linkService.setViewer(pdfViewer);
            pdfViewerRef.current = pdfViewer;
            linkServiceRef.current = linkService;
            // 设置初始缩放
            pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
            eventBusRef.current.on("pagesloaded", function () {
                pdfViewerRef.current.currentScaleValue = DEFAULT_SCALE_VALUE;
                pdfBeginLoaded(true);
            });
            // 渲染页面
            const initialViewer = async (url: any) => {
                pdfjs.getDocument(url).promise.then((pdf: any) => {
                    // console.timeEnd(`pdf解析成功：//${pdfUrl}`);
                    if (pdfViewerRef.current) {
                        pdfViewerRef.current.setDocument(pdf);
                        linkServiceRef.current.setDocument(pdf);
                    }
                    return;
                }).catch((err: any) => {
                    return err;
                });
            }

            initialViewer(pdfBuffer)
        }
    }, [pdfBuffer]);
    // 事件监听处理
    useEffect(() => {
        const $pdf = pdfRef.current;
        if (!$pdf) return;
        // canvaswrap 点击事件
        function pdfHandledClick (e: any) {
            // 防止冒泡事件干扰
            if (signMoveRef.current) return;
            const canvas = e.target as any;
            if (!canvas || !canvas.getContext) return;
            if (canvas.getAttribute('aria-label')) {
                alert.error('协议正在加载中...请稍等片刻');
                triggerGetCanvasImages((num) => ++num);
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

    return (
        <div className="viewer">
            <div
                id="viewerContainer"
                className="viewerContainer"
                ref={containerRef}
            >
                <div id="pdf-list" ref={pdfRef} />
            </div>
        </div>
    )
}

export default PDFViewer;