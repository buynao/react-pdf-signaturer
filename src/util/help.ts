
import { v4 } from "uuid";
import { SIGN_INIT_POSITION } from "../app/constants";

export const genUid = () => {
  return v4().slice(0, 8)
}
export const genSignInitState = () => {
  return {
    ...SIGN_INIT_POSITION,
    id: genUid(),
    signType: 'image',
    controlId: '',
    controlType: 'move'
  }
}

export const createImage = (signSrc: string) => {
  if (signSrc) {
    const image = new Image();
    image.crossOrigin = '';
    image.src = signSrc.indexOf('http') !== -1 ? signSrc + `?t=${+new Date()}` : signSrc;
    return image;
  }
  throw Error('图片地址为空')
}

export const debounce = (fn: Function, wait: number) => {
  let timeout = null as any;
  return function() {
      if(timeout !== null) clearTimeout(timeout);
      timeout = setTimeout(fn, wait);
  }
}

/*
    节流函数
    @param fn function
    @param wait number
    @param maxTimeLong number
    @return function
*/
export const throttling = (fn: Function, wait: number, maxTimelong: number) => {
  let timeout = null as any;
  let startTime = +new Date();

  return function() {
      if(timeout !== null) clearTimeout(timeout);
      var curTime = +new Date();
      if(curTime-startTime>=maxTimelong) {
          fn();
          startTime = curTime;
      } else {
          timeout = setTimeout(fn, wait);
      }
  }
}


const isPCFun = () => { //是否为PC端
  var userAgentInfo = navigator.userAgent;
  var Agents = ["Android", "iPhone",
              "SymbianOS", "Windows Phone",
              "iPad", "iPod"];
  var flag = true;
  for (var v = 0; v < Agents.length; v++) {
      if (userAgentInfo.indexOf(Agents[v]) > 0) {
          flag = false;
          break;
      }
  }
  return flag;
}

export const isPC = isPCFun();

export const getEvent = (e:any) => {
  return isPC ? e : e.targetTouches[0]
};

export const getMoveEvent = () => {
  return isPC ? {
    start: 'mousedown',
    move: 'mousemove',
    end: 'mouseup'
  } : {
    start: 'touchstart',
    move: 'touchmove',
    end: 'touchend'
  }
}

export const noop = () => {};