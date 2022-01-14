
import * as React from "react";
import { InitCanvasImageData } from "MyTypes";
import { throttling } from "../../util/help"

const { useEffect, useState, useRef } = React;

const cloneCanvas = (oldCanvas: HTMLCanvasElement) => {
  //create a new canvas
  var newCanvas = document.createElement('canvas');
  //set dimensions
  newCanvas.className = 'sign-canvas';
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;
  newCanvas.style.width = oldCanvas.style.width;
  newCanvas.style.height = oldCanvas.style.height;
  newCanvas.style.transform = oldCanvas.style.transform;
  const pageIndex  = oldCanvas.getAttribute('aria-label')?.replace('Page ', '') as string;
  newCanvas.setAttribute('pageindex', `${+pageIndex - 1}`);
  return newCanvas;
}

export const useCloneSignCanvas = (
  pdfCanvasNoLoad: number,
  isPdfBeginLoad: boolean,
  isPdfEndLoadRef: React.MutableRefObject<boolean>) =>  {
    const eventRef = useRef<any>(null);
    const scaleRef = useRef(1);
    useEffect(() => {
      const domWrapper = document.querySelector('#viewerContainer') as any;
      function savePdfCanvasFirstImage() {
          const $pages = document.querySelectorAll('.page');
          const isAllLoaded = [...$pages].every((page) => !!page.children[0].children[0]);
          isPdfEndLoadRef.current = isAllLoaded;

          const showPages = [...$pages].filter(page => {
              const canvas = page.children[0].children[0] as HTMLCanvasElement;
              const isLoaded = page.getAttribute('data-loaded');
              return isLoaded && !!canvas && !canvas.isCatchFirstImage;
          });

          if (isAllLoaded && showPages.length === 0) {
            if (eventRef.current) {
              domWrapper?.removeEventListener('scroll', eventRef.current);
            }
            return;
          }

          if (showPages.length) {
            showPages.forEach(($page: any) => {
                const pdfCanvas = $page.children[0].children[0] as HTMLCanvasElement;
                const signCanvas = cloneCanvas(pdfCanvas);
                scaleRef.current = parseInt(pdfCanvas.style.width) / pdfCanvas.width;
                $page.children[0].appendChild(signCanvas);
                pdfCanvas.isCatchFirstImage = true;
            });
          }
      }
      if (isPdfBeginLoad && !isPdfEndLoadRef.current) {
          console.log('savePdfCanvasFirstImage start');
          savePdfCanvasFirstImage();
          if (eventRef.current) {
            domWrapper?.removeEventListener('scroll', eventRef.current);
          }
          eventRef.current = throttling(savePdfCanvasFirstImage, 50, 500);
          domWrapper?.addEventListener('scroll', eventRef.current);
      } else {
        console.log('已经全部渲染完毕');
        if (eventRef.current) {
          domWrapper?.removeEventListener('scroll', eventRef.current);
          eventRef.current = null;
        }
      }
      return () => {
          if (eventRef.current) {
            domWrapper?.removeEventListener('scroll', eventRef.current);
          }
      }
    }, [isPdfBeginLoad, pdfCanvasNoLoad]);
  
  return scaleRef.current;
}
