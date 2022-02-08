## 背景

现在越来越流行电子签约，简单来说，就是一些合同不再需要当面签署，比如新人入职，人事合同，采购相关的业务。直接生成在线合同，当事人打开链接，通过身份认证即可签署。

最近做了一个简单版的电子合同，现在把这个项目中的一部分功能，做了一个demo版本的PDF在线预览 - 签名 - 下载。

现在就项目过程中的一些心得和坑，分享一下

## 功能

- 在线预览
- 在线签名
- 支持下载导出，且下载之后的pdf格式仍然保留，并不是全部转化成图片
- 放大缩小
- 兼容PC & H5
- No Server

## 技术方案和一些坑

这个demo主要涉及三个环节，也就是`PDF预览 - 签名 - 导出`。

现在就这三个环节和大家简单分享一下其中的技术要点。

## 1. 第一个环节 - PDF预览

这里主要是用`pdfjs`解决了pdf预览问题，这个库也是目前pdf预览应用最多的一个了，介绍`pdfjs`的文章有很多，这里就不再做过多介绍了，尽管它的文档实在是比较晦涩，好在用的够多，网上示例也够多，摸索摸索pdf的预览也就出来了，文章里就不贴代码了；

> pdfjs官网：https://pdfjs.express/

我遇到的，涉及`pdfjs`的问题有这么几个：

### PC&H5的渲染比例不一致

之前项目有个功能点，签名状态可以保留。即合同需要两个人签署，如果一个人在移动端签名，放到PC端签名的位置会出现偏差；同理，PC端的签名放到移动端去看也会有差异。

分析问题：
  签名的数据，是会统一放到`signPositionList`里，上传数据库并进行保存。

```
// 大概的签名数据信息
interface ISignPosition {
    id: string;
    x: number; // 相对pdf渲染的偏移值x
    y: number; // 偏移值y
    w: number; // 签名宽
    h: number; // 签名高
    signSrc: string; // 签名图片
    isSelect?: boolean;
    innerPdfIndex?: number
 }
 type SignList = ISignPosition[];
```

上传的时候，会把签名的偏移值进行存储，预览的时候，获取签名的偏移值进行定位预览。

在看下签名偏移值`x,y`是怎么储存的：

```
// 返回签名相对于pdf canvas视口的偏移值
export const getTouchPosition = (e: any, scale: number) => {
  const event = getEvent(e);
  const target = event.target;
  const rect = target.getBoundingClientRect();
  const x = event.pageX - rect.left;
  const y = event.pageY - rect.top;
  // scale = canvas容器宽度 / pdf渲染出来的canvas真实宽度
  return {
    x: x / scale,
    y: y / scale
  }
}
```


通过分析排查，问题的关键点就在于`scale`，主要原因是在PC和移动端两种不同环境下，`pdfjs`所渲染出来的`容器宽度`不一样.

贴下当时手里的测试机，在两个环境中，签名的pdf宽高对比：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f0b55d6b919b4c59a6596fef1461adfa~tplv-k3u1fbpfcp-watermark.image?)

定位出问题以后，就开始分析解决，最终有了两种解决方案：

#### 第一种解决方案，强制让pdfjs渲染时，两端保持一致的渲染宽高。

通过分析`pdfjs`源码可以得知，在`pdfjs`渲染时，除了当时浏览器宽度，其中有根据两个参数来控制的：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7de32cc98c09464c88bc7a3e43f76559~tplv-k3u1fbpfcp-watermark.image?)

`devicePixelRatio`大家应该不陌生了，随着各种显示器设备的不断升级，这个值也在慢慢不断升级。
值1表示经典96 DPI（在某些平台上为76 DPI）显示，而对于HiDPI / Retina显示屏则期望值为2。 在异常低分辨率的显示器中，或更常见的是，当屏幕的像素深度比简单地将96或76 DPI的标准分辨率提高一倍时，可能还会返回其他值。

`maxCanvasPixels`字面意义就是当前pdf可以渲染的最高像素数，这个值在`pdfjs`源码里可以进行配置，如下图：
```
const MAX_CANVAS_PIXELS = _viewer_compatibility.viewerCompatibilityParams.maxCanvasPixels || 16777216;

class PDFPageView {
  constructor(options) {
    const container = options.container;
    const defaultViewport = options.defaultViewport;
    this.maxCanvasPixels = options.maxCanvasPixels || MAX_CANVAS_PIXELS;
    ...
  }
```

如果想让`pdfjs`保持两端一致的渲染比例，可以对`devicePixelRatio`和`maxCanvasPixels`这两个值进行如下赋值：

```
window.devicePixelRatio = 3;
const pdfViewer = new pdfjsViewer.PDFViewer({
    container: containerRef.current,
    eventBus: eventBusRef.current,
    linkService,
    maxCanvasPixels: 5242880,
    l10n: pdfjsViewer.NullL10n,
    useOnlyCssZoom: USE_ONLY_CSS_ZOOM,
    textLayerMode: TEXT_LAYER_MODE
});
```

这种方法比较hack，简单粗暴，改动最小。

但是随着智能手机的升级，以后可能会产生其他风险。不建议使用。

#### 第二种解决方案：PC -> H5之间的转换计算

算出签名偏移值在 PC -> H5之间的转换公式:

其实只要转成绝对定位就好理解了，偏移值毕竟始终局限在canvas的宽高里，一开始被scale给误导了挺长时间。

```
// 推导公式
h5.x = h5.width * (pc.x / pc.width)
h5.y = h5.height * (pc.y / pc.height)
```


第一步，保存签名数据时，增加签名相对canvas容器的绝对百分比定位值：
```
// 修改签名的数据信息，增加百分比偏移值
interface ISignPosition {
    id: string;
    xPercent: number; // 相对canvas真实宽度的百分比位移
    yPercent: number; // 相对canvas真实高度的百分比位移
    ...
}
const requestSignList = signList.map((sign) => {
    return {
        ...sign,
        xPercent: sign.x / trueWidth,
        yPercent: sign.y / trueHeight,
    }
})
```

第二步，在预览时，接口返回签名数据后，从百分比转成绝对值：

```
const signList = apiSignList.map((sign) => {
    return {
        ...sign,
        x: trueWidth * xPercent, // 真实偏移值 / 当前比例
        y: trueHeight * yPercent,
    }
})
```

这里只是贴些伪代码，实际要改的其实还挺多。

### pdfjs的渲染时机问题

`pdfjs`在渲染pdf时，有个`pagesloaded`事件，在这个事件触发时，通常开始执行pdf渲染成功后的业务，如初始化pdf的缩放大小。
```
eventBusRef.current.on("pagesloaded", function () {
    pdfViewerRef.current.currentScaleValue = DEFAULT_SCALE_VALUE;
});
```
但是如果你的pdf页数有点多，其实`pdfjs`会出于性能问题考虑，进行懒加载，如果这个时候，你想在`pdfjs`上层增加一个`canvas渲染层`，就不能监听到该事件就一起给加了，这个时候其实还有很多pdf并没有开始渲染。

想要等到`pdfjs`全部渲染完毕，就需要你自己额外去监听下页面的滚动事件进行相关判断了。

至于为什么要在pdf上增加一个`canvas渲染层`，下节就会说到。

## 2. 第二个环节：PDF 签名

pdf在浏览器中，应用canvas的地方有很多，如书写签名，签名交互以及签名的合成计算...

首先介绍一下，这个项目涉及`canvas`的使用，主要有三处：

第一个canvas，是`pdfjs`渲染pdf生成的`pdfCanvas`，这里也就是pdf本身内容；

第二个canvas，是和`pdfCanvas`重叠生成的`pdfSignCanvas`，前边已经说过`pdfSignCanvas`是出于性能考虑的，主要是在执行签名的生成和交互时，这一层的`canvas`会频繁进行绘制，如果这个时候只有一层`canvas`，那么每次在`pdfCanvas`上开始拖拽签名进行交互时，将会频繁的重新绘制整个`pdf`的内容，这里的性能开销就非常大了。这一层canvas也是一开始的时候没有加，等到测试的时候，发现低端手机，各种花屏，卡顿，才给加上的。

第三个canvas，也就是`signPannelCanvas`，主要是用来绘制签名的一个画板。关于怎么实现签名画板，网上介绍文章很多，本文就不再进行详细介绍了。

---
canvas本身是没什么坑的，也就是api比较多，使用门槛相比其他库有点高...

所以这个章节，就没什么坑要说了，主要分享一下canvas在这个demo里的一些小心得。


关于`canvas`的一些使用技巧：
先看一下，签名画板部分`signPannelCanvas`：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a94e6e27a1424561bc1c2f8e58146349~tplv-k3u1fbpfcp-watermark.image?)


### 裁剪合适的签名大小填充至pdf中

你可以在这个白色面板上进行签名/绘画，点击保存时，在将`signPannelCanvas`与`signCanvas`进行合并。以便将签名保存到pdf的画布中进行预览。如果按照传统做法，直接合并的话，那签名的区域会出现很多空白，毕竟你不可能把整个画布签满。

优化方案就是，我在两个canvas将要合并的时候，加了一个裁剪的过程：
1. 绘制签名的时候，将签名的minX,minY,maxX,maxY进行保存记录。
2. 通过minX,minY,maxX,maxY,得出签名的真实宽高
```
  const w = maxX - minX + 15; // 留点空白
  const h = maxY - minY + 15;
  saveClipSize({
    w, h, x: minX - 5, y: minY - 5 // 留点空白间距
  });
```
3. 通过签名的真实宽高以及x，y，将签名图片进行裁剪
```
// 裁剪的大小，位移
type ClipData = {
  w: number;
  h: number;
  x: number;
  y: number;
}
/**
* 裁剪canvas，并生成裁剪后的图片
* canvas : 需要裁剪的canvas
* clipData: 需要裁剪的尺寸，位移
* return Promise<string>: 裁剪后的图片
*/
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
```
4. 裁剪后的图片填充至`signCanvas`

**整体优化流程：**

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/42f4fbd73c204e16b8314c8faad09a45~tplv-k3u1fbpfcp-watermark.image?)
### 签名画板的横竖屏兼容

这个项目的落地页是需要兼容PC和H5的，好在页面设计不是很复杂，没有太多需要特殊兼容的部分。

需要特殊处理的，就是签名画板的部分。因为手机的屏幕尺寸显然不如web宽敞，为了让用户有个较好的签名体验，需要将整个画布进行横向展示。

无论用户有没有开启手机的自动旋转，都要让用户横着手机进行签名。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fc86c00d376a42028ea3041d1c3297c8~tplv-k3u1fbpfcp-watermark.image?)

手机的自动旋转，可以直接加个监听事件，重新设置`signPannelCanvas`的宽高.

```
  const getCanvasSize = (): Promise<CanvasSize>  => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (window.orientation === 90) {
          resolve({
            width: window.innerWidth,
            height: window.innerHeight- TITLE_MAP,
          })
        } else {
          resolve({
            width: window.innerWidth - TITLE_MAP,
            height: window.innerHeight,
          })
        }
      }, 500)
    })
  }

  const handleCanvasSize = async () => {
      const size = await getCanvasSize();
      updateCanvasSize(size);
  };

  useEffect(() => {
    // 加载签名模板，获取初始化大小
    handleCanvasSize();
    window.addEventListener("orientationchange", handleCanvasSize);
    return () => {
      window.removeEventListener("orientationchange", handleCanvasSize);
    }
  }, []);
```


最后一点，需要注意的是，移动端在强制横屏后，`signPannelCanvas`的宽高与手机的宽高是相反的。

所以在保存签名的时候，我们需要在把`signPannelCanvas`的签名翻转一下，才行。不然直接保存的话，签名也就跟着是反的。

```
    // 竖屏状态 - 翻转图像进行保存
    const ctx = signPannelCanvas.getContext('2d');
    
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
      // canvas有个重绘的过程，不能直接进行保存
      setTimeout(async () => {
        // 翻转后的正确签名
        const signImage = canvas.toDataURL('image/png');
        addSignInCanvas(signImage, canvas.width, canvas.height);
      })
    }
```




## 3. 最后一个环节：pdf 的导出/下载

pdflib - 支持原汁原味的pdf下载，这个库很方便，浏览器和服务端都可以用。

说到html -> pdf转换，网上有很多方案，大都是将htmlToCanvas，imgToCanvas，toPdf。总之生成的pdf内部大都是图片，已经不是原汁原味的pdf了，这个库可以让你在原汁原味的pdf上额外添加`图片，svg，文字等等`...

> pdflib官网：https://pdf-lib.js.org/

这里比较折腾的是，如何把`signCanvas`上的图片，准确无误的添加到`pdf`文件指定的区域中。
这里就直接贴代码了。和上面 pc -> h5 的方案思路一致。

```
// 将链接转换成buffer，如果是本地读取的pdf文件的话，读取后可以直接转arrayBuffer
const pdfBuffer = await fetch(pdfLink).then((res) => res.arrayBuffer())
const newPdfDoc = await PDFDocument.load(pdfBuffer);

const pagesProcesses = newPdfDoc.getPages().map(async (page, pageIndex) => {
  const { width, height } = page.getSize(); // 
  const signs = newSignList.filter((sign) => sign?.canvasIndex == pageIndex + 1);
  const drawIntoPageTask = signs.map(async (sign) => {
      let { signSrc, x, y, w, h, pdfCanvas } = sign; // 签名图片的相关信息
      const scale = pdfCanvas.width / width;
      const ex = x / scale;
      const ey = y / scale;
      try {
        let img = await newPdfDoc.embedPng(await transformPNG(signSrc as string));
        return () => page.drawImage(img, {
            x: ex,
            y: height - ey - h / scale,
            width: w / scale,
            height: h / scale,
          });
      } catch (e) {
        console.log(e);
        return () => {};
      }
  });
  const drawProcesses = await Promise.all(drawIntoPageTask);
  drawProcesses.forEach((p) => p());
});
await Promise.all(pagesProcesses);

// 如果直接浏览器下载可以用newPdfDoc.save();
const pdfBytes = await newPdfDoc.save()；
download(pdfBytes, 'download', 'application/pdf')

// 如果需要上传到服务器，可以用saveAsBase64转base64
const pdfBase64 = await newPdfDoc.saveAsBase64()
await uploadPdf(pdfBase64);
```


## 结尾

以上就是在做这个demo的一些心得和分享。

其中涉及`canvas`的内容，上面没有讲太多，比如签名的绘制，交互，拖拽，变形等等...这些内容网上已经有很多相关的介绍了，就不再赘述。
