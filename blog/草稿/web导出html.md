## 方案1 - https://www.zhangxinxu.top/wordpress/2017/07/js-text-string-download-as-html-json-file/

css和js没有下载下来

// 下载文件方法
var funDownload = function (content, filename) {
    var eleLink = document.createElement('a');
    eleLink.download = filename;
    eleLink.style.display = 'none';
    // 字符内容转变成blob地址
    var blob = new Blob([content]);
    eleLink.href = URL.createObjectURL(blob);
    // 触发点击
    document.body.appendChild(eleLink);
    eleLink.click();
    // 然后移除
    document.body.removeChild(eleLink);
};
const newChild = document.createElement('button')
newChild.innerText='download'
document.body.insertBefore(newChild,document.body.firstChild);  
var eleButton = document.querySelector('input[type="button"]');
newChild.addEventListener('click', function () {
        funDownload(document.documentElement.outerHTML, 'test.html');    
    });

## FileSaver.js - 文本文件没有样式（好像没有样式）

## 方案3 将html保存为pdf，支持多页情况 - https://segmentfault.com/a/1190000016810944