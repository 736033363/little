// window不是js的关键字
// 提高内部访问window和undefined的效率
(function(window, undefined) {

var doc = document,
    aaronExtension = {}, // aaron扩展
    aaronFnExtension = {}, // aaron扩展
    _aaron = window.aaron, // aaron变量被别人用了，保留原始值
    _$ = window.$; // aaron变量被别人用了，保留原始值

window.aaron = window.$ = aaron; // 将我的库名导出

/*
多库共享
$.noConflict()
var _ = $.noConflict(true)
 */
function noConflict(bDeep){
  window.$ = _$;
  if (bDeep){
    window.aaron = _aaron;
  }
  return aaron;
}

/*
核心函数
$('.class')
$('.class', document.body)
$(callback)
$('p', $('div'))
$(document.body)
$('<p>content</p>')
$([1,2,3])
 */
function aaron(selector, context){
  selector = selector || doc; // 确保selector总有值
  var quickExpr = /^[^<]*(<(.|\s)+>)[^>]*$|^#(\w+)$/, // 一个简单的方法来检查HTML字符串或ID字符串
      dom = [],
      dom2,
      match;

  // deal: $(document.body)
  if (selector.nodeType){
    dom.push(selector);
    selector = '';
  // deal: $('.class') or $('<div>content</div>')
  } else if (typeof selector === 'string'){
    match = quickExpr.exec(selector);

    if (match && (match[1] || !context) ){ // no context 针对选择器
      // deal: $('<p class="p4" id="4">p4</p><p class="p4" id="5">p4</p>')
      if (match[1]){
        box = doc.createElement('div'); // box 需要回收吗？
        box.innerHTML = match[1];
        while(box.firstChild){
          dom.push(box.removeChild(box.firstChild));
        }
      } else if (match[3]){
        dom.push(doc.getElementById(match[3]));
      }
    } else { // deal: $(expr, [context])
      dom2 = aaron(context);
      return dom2.find(selector);
    }
  } else if (typeof selector === 'function'){
    aaron._ready(selector, Boolean(context));
    selector = '';
  }
  if (Array.isArray(selector)){
    dom = selector;
    selector = selector.selector;
  }
  return _DomArray(dom, selector);
}

function _DomArray(dom, selector){
  dom = dom || [];
  dom.selector = selector;
  dom.__proto__ = _DomArray.prototype;
  return dom;
}
_DomArray.prototype = aaron.fn = [];

/*
对象扩展
$.extend({}) 扩展到$，返回$
$.fn.extend({}) 扩展到$.fn，返回$.fn
$.extend({},{},{}) 返回第一个对象
$.extend({},{},{},false) 返回第一个对象，不覆盖
 */
aaron.extend = aaron.fn.extend = function(oTarget, oSource){
  var oArgs = [].slice.call(arguments),
      bCover = typeof oArgs[oArgs.length - 1] === 'boolean' ? Boolean(oArgs.pop()) : true,
      nI = 1;

  (oArgs.length === 1) && oArgs.unshift((oTarget = this));
  while( oSource = oArgs[nI++] ){
    _extend(oTarget, oSource, bCover);
  }
  return oTarget;
}

function _extend(oTarget, oSource, bCover){
  bCover = bCover === undefined ? true : bCover;
  for (var sKey in oSource){
    if (bCover || (!bCover && !(sKey in oTarget))){
      oTarget[sKey] = oSource[sKey];
    }
  }
  return oTarget;
}

function _ready(fnListener, bIsLoad){
  if (doc.readyState === 'complete'){
    fnListener();
    return;
  }
  if (!bIsLoad){
    doc.addEventListener('DOMContentLoaded', fnListener);
  } else {
    window.addEventListener('load', fnListener);
  }
}

/*
$.toArray({0:'z',1:'a',2:'b',length:3}) => ["z", "a", "b"]
 */
function toArray(oNodeList, iStart, iEnd){
  return [].slice.call(oNodeList, iStart, iEnd);
}

// 缺陷：id 不支持数字
function _query(selector, content){
  content = content || doc;
  var oRet = [];
  try{
    oRet = toArray(content.querySelectorAll(selector));
  }catch(error){}
  return oRet;
}

/*
body.find('#1') => [p#1.p1, selector: "#1"]
body.find('#1.p1') => [p#1.p1, selector: "#1.p1"]
body.find('.p1,.p3') => [p#1.p1, p#1.p3, selector: ".p1,.p3"]
body.find('#id2,p') => [p#1.p1, p#id2.p2, p#1.p3, selector: "#id2,p"]
PS: queryselectorAll不支持id以数字开头 body.find('#1,p') => [selector: "#1,p"]
 */
function find(selector){
  var ret = [],
      reg = /#(\d\w*)/,
      match = reg.exec(selector),
      el;
  try{
    if (match){ // querySelectorAll 不支持 #1
      el = doc.getElementById(match[1]);
      if (el && (!(match = selector.replace(match[0], '')) || el.matches(match)) ){
        ret.push(el);
      }
    } else {
      this.forEach(function(item){
        ret.push(_query(selector, item));
      });
    }
    ret = [].concat.apply([], ret);
  }catch(error){}
  return _DomArray(ret, selector);
}

// Polyfill
if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.matchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.oMatchesSelector ||
    Element.prototype.webkitMatchesSelector ||
    function(s) {
      var matches = (this.document || this.ownerDocument).querySelectorAll(s),
          i = matches.length;
      while (--i >= 0 && matches.item(i) !== this) {}
      return i > -1;
    };
}

// $.addEvent 注册事件：oOptions 是 对象或布尔
function addEvent(oTarget, sType, fnListener, oOptions){
  oTarget.addEventListener(sType, fnListener, oOptions);
}

// $.removeEvent 移除事件
function removeEvent(oTarget, sType, fnListener, bUseCapture){
  oTarget.removeEventListener(sType, fnListener, bUseCapture);
}

/*
body.on('click',function(){})
body.on('click',{a: 1},function(e){$.log(e.data.a);}) => 1
body.on('click', 'p',function(e){})
body.on('click', '.p1, #id2, .p4.p5, #4.p6', {a: 1},function(e){$.log(e.data.a);}); => 1 （点击.p1的子元素也生效）

on()相对addEvent()有些局限性，例如on()默认是冒泡
 */
function on(type, selector, data, callback){
  var typeSelector = typeof selector,
      typeData = typeof data;
  if (typeSelector === 'function'){
    callback = selector;
    selector = undefined;
    _addEvt(this);
  } else if (typeSelector === 'object'){
    if (typeData === 'function'){
      callback = data;
      data = selector;
      selector = '';
    }
    _addEvt(this);
  } else if (typeSelector === 'string'){
    if (typeData === 'function'){
      callback = data;
      data = null;
    }
    _addEvt(this);
  }
  function _addEvt(els){
    els.forEach(function(el){
      if (!el.evtOverview){
        el.evtOverview = {};
      }
      if (!el.evtOverview[type]){
        el.evtOverview[type] = {};
      }
      addEvent(el, type, (el.evtOverview[type][callback] = _delegate(el, selector, data, callback)));
    });
  }
  return this;
}

/*
p.off() 移除p元素上所有事件
p.off('click', f1)
p.off('click')
 */
function off(type, fn){
  // 注销所有事件 deal: .off()
  if (!arguments.length){
    this.forEach(function(el){
      for(type in el.evtOverview){
        for(var fnName in el.evtOverview[type]){
          removeEvent(el, type, el.evtOverview[type][fnName]);
        }
      }
    });
  // deal: .off('click', fn)
  } else if (typeof fn === 'function'){
    this.forEach(function(el){
      removeEvent(el, type, el.evtOverview[type][fn]);
    });
  // deal: .off('click')
  } else if (typeof type === 'string'){
    this.forEach(function(el){
      var fns = el.evtOverview[type];
      for(var pro in fns){
        removeEvent(el, type, fns[pro]);
      }
    });
  }
  return this;
}

function _delegate(registerElem, rules, data, callback){
  return function(e){
    var target = e.target;
    if (_isDelegate(registerElem, target, rules)){
      e.data = data || {};
      callback.call(this, e);
    }
  };
}

// 是发出委托的元素或子元素吗
function _isDelegate(registerElem, target, rules){
  var flag = false;
  rules = (rules || '').replace(/\s+/g, '').split(',');
  rules.forEach(function(rule){
    var el = aaron(rule, registerElem); // 发出委托的元素
    if (~el.indexOf(target) || ~el.find('*').indexOf(target)){
      flag = true;
      return false; // 中断
    }
  });
  return flag;
}

function fireEvent(el, type, args){
  var event = doc.createEvent('HTMLEvents');
  event.initEvent(type, true, true);
  for(var key in args){
    event[key] = args[key];
  }
  // dispatchEvent?
  el.dispatchEvent(event);
}

// p.trigger('click')
function trigger(type){
  this.forEach(function(el){
    fireEvent(el, type);
  });
  return this;
}

/*
p.click(function(){})
p.click({a:1},function(e){$.log(e.data.a);}) => 1
p.click()
 */
function click(data, callback){
  if (!arguments.length){
    return this.trigger('click');
  }
  if (typeof data === 'function'){
    callback = data;
    data = null;
  }
  return this.on('click', '', data, callback);
}

// p.eq(999) => [selector: "empty"]
function eq(n){
  // deal: p.get(999) => [document, selector: ""]
  return aaron(this[n] || 'empty');
};

// $.log('a=%s b=%s',1,2) => a=1 b=2
function log(){
  console.log.apply(null, arguments)
}

/*
取得或设置样式
p.css('background-color','red') => [p#1.p1, p#id2.p2, p.p4.p5, p#4.p4.p8, selector: "p"]
p.css('background-color','rgb(255,0,0)')
p.css({'background-color':'red',border: '1px solid blue'})
p.css('background-color') => "rgb(0, 0, 255)" 针对第一个元素
 */
function css(sProperty, sValue){
  var sKey;
  if (typeof sProperty === 'object'){
    for (sKey in sProperty){
      this.forEach(function(el){
        el.style.setProperty(sKey, sProperty[sKey]);
      });
    }
    return this;
  }
  if (sValue === undefined){
    return window.getComputedStyle(this[0], null).getPropertyValue(sProperty);
  }
  this.forEach(function(el){
    el.style.setProperty(sProperty, sValue);
  });
  return this;
}

// p.offset() => {left: 8, top: 53} 获取第一个元素相对文档的位置
function offset(){
  var el = this[0];
  return {
    left: el.getBoundingClientRect().left + window.pageXOffset,
    top: el.getBoundingClientRect().top + window.pageYOffset
  };
}

// p.position() => {left: 0, top: 0} 获取元素相对父元素（offsetParent）的偏移
function position(){
  var el = this.eq(0),
      sO,
      pO;
  try{
    sO = el.offset();
    pO = aaron(el[0].offsetParent).offset();
    return {
      left: sO.left - pO.left,
      top: sO.top - pO.top
    };
  }catch(e){
    return false;
  }
}

// noop
function noop(){}

// 添加url参数
function addUrlParam(sUrl, sName, sValue){
  sUrl += ( (sUrl.indexOf('?')) === -1 ? '?' : '&');
  sUrl += encodeURIComponent(sName) + '=' + encodeURIComponent(sValue);
  return sUrl;
}

// 是否是空对象
function isEmptyObject(oObj) {
  for ( var sName in oObj ) {
    return false;
  }
  return true;
}

/*
$.ajax({url:'aaronv110.js',success: function(data){$.log(data)}})
$.ajax({url:'aaronv110.js',data:{a:'aaron',b:'lijing'},success: function(data){$.log(data)}})
$.ajax{method:'post',url:'aaronv110.js',success: function(data){$.log(data)}} 无法测试
 */
function ajax(oOptions){
  var oXhr = new XMLHttpRequest(),
      // 默认配置
      oConfig = {
        url: '',
        data: {},
        method: 'GET',
        bNoCache: true, // 解决get缓存问题（能否解决post的缓存？）
        sSend: null,
        bAsync: true, // 一般情况下无需改为false
        sContentType: 'application/x-www-form-urlencoded', // post 情况下使用
        fnBeforeOpen: null, // onprogress必须在 open() 执行之前
        fnAfterOpen: null, // timeout 最好在 open() 与 send() 之间
        fnJson: null, // 返回json
        success: null, // 与fnJson互斥
        fnError: null, // oXhr.readyState === 4 ajax报错
        fnComplete: null // oXhr.readyState === 4 就会执行
      },
      method,
      data,
      prop;

  if (typeof oOptions !== 'object'){
    return false;
  }
  aaron.extend(oConfig, oOptions);

  method = oConfig.method.toUpperCase();
  data = oConfig.data;
  // 模拟表单 POST 提交
  if (method === 'POST'){
    oXhr.setRequestHeader('Content-type', oConfig.sContentType);
  }
  oXhr.onreadystatechange = onreadystatechange;
  oConfig.fnBeforeOpen && oConfig.fnBeforeOpen.call(oXhr);

  // GET、POST 请求处理数据
  if ( (~['GET','POST'].indexOf(method)) && !isEmptyObject(data) ){
    for(prop in data){
      oConfig.url = addUrlParam(oConfig.url, prop, data[prop]);
    }
    if (method === 'POST'){
      oConfig.sSend = oConfig.url.split('?')[1];
      oConfig.url = oConfig.url.split('?')[0];
    }
  }

  oXhr.open(method, oConfig.url, oConfig.bAsync);
  oXhr.setRequestHeader('X-AARON-Ajax-Request','AjaxRequest');
  oConfig.fnAfterOpen && oConfig.fnAfterOpen.call(oXhr);
  // POST 请求模仿表单提交（参考：JavaScript 高级程序设计）
  if (method === 'POST'){
    oXhr.setRequestHeader('Content-type', oConfig.sContentType);
  }
  if ( (method === 'GET') && oConfig.bNoCache){
    oXhr.setRequestHeader("Cache-Control","no-cache");
  }
  oXhr.send(oConfig.sSend);

  function onreadystatechange(){
    var bSuccess,
        sJson;

    if (oXhr.readyState !== 4){return;}
    try{
      bSuccess = (oXhr.status >= 200 && oXhr.status < 300) || oXhr.status === 304;
      if (!bSuccess){
        oConfig.fnFail && oConfig.fnFail.apply(oXhr, arguments);
        return;
      }
      if (oConfig.fnJson){
        try{
          sJson = JSON.parse(oXhr.responseText);
        }catch(e){
          sJson = false;
        }
        oConfig.fnJson.call(oXhr, json);
      } else {
        oConfig.success && oConfig.success.call(oXhr, oXhr.responseText);
      }
    }catch(e){
      log('Response Error: ' + e);
      oConfig.fnError && oConfig.fnError.apply(oXhr);
    }finally{
      oConfig.fnComplete && oConfig.fnComplete.call(oXhr);
    }
  }
}

/*
p.addClass("  selected1    ").addClass("  selected1 selected2   ") => [p#1.p1.selected1.selected2, p#2.p2.selected1.selected2, p#1.p1.selected1.selected2, selector: "p"]
 */
function addClass(sClass){
  sClass = (sClass || '').trim().replace(/\s{2,}/g, ' ').split(' '); // '   aaaa    bb    ccc    ' => ["aaaa", "bb", "ccc"]
  this.forEach(function(el){
    sClass.forEach(function(aclass){
      if ((' ' + el.className + ' ').indexOf(' ' + aclass + ' ') === -1){
        el.className += ' ' + aclass;
      }
    })
  });
  return this;
}

// p.removeClass("  selected1 ,selected2   ")
function removeClass(sClass){
  sClass = (sClass || '').replace(/\s+/g, '').split(',');
  this.forEach(function(el){
    var classArray = el.className.trim().split(/\s+/);
    el.className = diff(classArray, sClass).join(' ');
  });
  return this;
}

// p.hasClass("  selected1 ,selected2   ") 一个匹配上即可
function hasClass(sClass){
  sClass = (sClass || '').replace(/\s+/g, '').split(',');
  return this.some(function(el){
    var name = (' ' + el.className + ' ');
    var flag = false;
    sClass.forEach(function(aclass){
      if (~name.indexOf(' ' + aclass + ' ')){
        flag = true;
        return false;
      }
    });
    return flag;
  });
}

/*
p.attr('title') => "title"
p.attr('title','title') => [p#1.p1, p#id2.p2, p.p4.p5, p#4.p4.p8, selector: "p"]
p.attr({'title': 'title2', 'class': 'c1'}) => [p#1.c1, p#id2.c1, p.c1, p#4.c1, selector: "p"]
 */
function attr(name, val){
  // 设置
  if (typeof name === 'object'){
    for(var pro in name){
      this.forEach(function(el){
        el.setAttribute(pro, name[pro]);
      });
    }
    return this;
  }
  // 获取
  if (val === undefined){
    return this[0].getAttribute(name);
  }
  // 设置
  this.forEach(function(el){
    el.setAttribute(name, val);
  });
  return this;
}

// p.removeAttr('title')
function removeAttr(name){
  this.forEach(function(el){
    el.removeAttribute(name);
  });
  return this;
}

/*
input.prop('checked') => false
input.prop('checked', true) => [input, input, input, selector: "input"]
input.prop({class:'c8',checked: false}) => [input.c8, input.c8, input.c8, selector: "input"]
 */
function prop(name, val){
  var propFix = {
    class: 'className',
    for: 'htmlFor'
  };

  // 设置
  if (typeof name === 'object'){
    for(var pro in name){
      this.forEach(function(el){
        el[propFix[pro] || pro] = name[pro];
      });
    }
    return this;
  }
  name = propFix[name] || name;
  // 获取
  if (val === undefined){
    return this[0][name];
  }
  // 设置
  this.forEach(function(el){
    el[name] = val;
  });
  return this;
}

// input.removeProp('checked') => [input, input, input, selector: "input"]
function removeProp(name){
  this.forEach(function(el){
    el[name] = undefined;
    delete el[name];
  });
  return this;
}

/*
从arr1中取出arr2中没有的值，返回数组
$.diff([1,2,3],2) => [1, 3]
$.diff([1,2,3],[1,2]) => [3]
 */
function diff(arr1, arr2){
  if (!Array.isArray(arr1)){
    return false;
  }
  if (!Array.isArray(arr2)){
    arr2 = [arr2];
  }
  return arr1.filter(function(mixValue){
    return arr2.indexOf(mixValue) === -1;
  });
}

// 类
var Class = {
  create: function(){
    return function(){
      this.init.apply(this, arguments);
    }
  }
};

// p.empty() 清空节点
function empty(){
  this.forEach(function(el){
    while(el.firstChild){
      el.removeChild(el.firstChild);
    }
  });
  return this;
}

// p.remove() 从dom中删除所有匹配的元素，并删除绑定事件
function remove(){
  this.forEach(function(el){
    if (el.parentNode){
      aaron(el).off();
      el.parentNode.removeChild(el);
    }
  });
  return this;
}

/*
支持 string、aaron、element
p.append('<span>span</span>') => [p#1.p1, p#id2.p2, p.p4.p5, p#4.p4.p8, selector: "p"]
p.append(span) => [p#1.p1, p#id2.p2, p.p4.p5, p#4.p4.p8, selector: "p"]
p.append(span[0]) => [p#1.p1, p#id2.p2, p.p4.p5, p#4.p4.p8, selector: "p"]
 */
function append(content){
  if (typeof content === 'string'){
    this.forEach(function(el){
      el.insertAdjacentHTML('beforeend', content);
    });
  } else if (content.nodeType){
    this.forEach(function(el, i){
      el.appendChild(i === 0 ? content : content.cloneNode(true));
    });
  // p.append(span[2]) 第一个是
  } else if(content.aaron){
    this.forEach(function(el, i){
      content.forEach(function(el2){
        el.appendChild(i === 0 ? el2 : el2.cloneNode(true));
      });
    });
  }
  return this;
}

/*
span.eq(0).appendTo(p) => [p#1.p1, p#id2.p2, p.p4.p5, p#4.p4.p8, selector: "p"]
$('<span>span</span>').appendTo(p)
 */
function appendTo(content){
  return aaron(content).append(this);
}

/*
$.each({a:'a', b:'b'},function(item){console.log(item)}); => a b {a: "a", b: "b"}
$.each(['a','b'],function(item){console.log(item)}); => a b ["a", "b"]
p.each(function(el){console.log(el.nodeName)}); => P P P P [p#1.p1, p#id2.p2, p.p4.p5, p#4.p4.p8, selector: "p"]
 */
function each(els, callback){
  if (typeof els === 'object'){
    for(var prop in els){
      callback.call(els[prop], els[prop], prop);
    }
  } else {
    if (typeof els === 'function'){ // deal: $('p').each(fn(n,i,source))
      callback = els;
      els = this;
    }
    // deal: $.each(array/obj, fn(n,i,source))
    els.forEach(function(el, i, source){
      callback.call(el, el, i, source);
    });
  }
  return els;
}

// $.htmlEncode('<') => &lt;
function htmlEncode(value){
  return !value ? value : String(value).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27");
}

// $.htmlDecode('&lt;') => <
function htmlDecode(value){
  return !value ? value : String(value).replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&#x27/g, "'").replace(/&amp;/g, "&");
}

/*
var pInfo={
  name:'大漠穷秋',
  age:18,
  tel:'133',
  places:[
    {count:4,go:true,name:'衡山'},
    {count:9999,go:false,name:'泊头'},
    {count:1,go:true,name:'苏州'},
    {count:9999,go:false,name:'华山'},
    {count:9999,go:!false,name:'黄山'},
    {count:9999,go:true,name:'峨眉山'}
  ]
};

var html=`
<p>姓名：{name}</p>
<tpl if="age===18">
<p>我 18 岁</p>
</tpl>
<tpl if="~tel.indexOf('133')">
<p>我的电话号码包含"133"</p>
</tpl>
<tpl for="places">
  <tpl if="count&gt;3">
    <tpl if="go">
<p>我去过次数大于等于3次，且还想去的地方有：{name}</p>
    </tpl>
  </tpl>
</tpl>`;

$('body').append($.template(html, pInfo));

PS: 1. {}和if应该不容易出错；if...if、for...if...if可能存在未知的bug；
    2. age===18 不能用单引号；count&gt;3 必须用字符实体；html中若使用的没有的属性或其他情况，统一报错，需要自己排查
 */
function template(html, data) {
  var VALUES = 'values',
      RETURN = 'return ',
      WITHVALUES = 'with(values){ ';
      id = 0, // 子模板计数器
      tpls = [], // 模板栈
      re = /\{([\w-]+)(?:\:([\w\.]*)(?:\((.*?)?\))?)?\}/g, // 替换html中{}中内容
      reTpl = /<tpl\b[^>]*>((?:(?=([^<]+))\2|<(?!tpl\b[^>]*>))*?)<\/tpl>/, // 听说是非常强大的正则，用来玻璃<tpl>
      ifRe = /<tpl\b[^>]*?if="(.*?)"/, // 匹配if标签
      forRe = /^<tpl\b[^>]*?for="(.*?)"/; // 匹配for标签

  html = ['<tpl>', html, '</tpl>'].join(''); // 一句容错处理，设计非常精巧

  // 解析大模板，从最里面开始解析为一个一个小模板，将小模板压入模板栈
  while((m=html.match(reTpl))){
    var m0=m[0],
        m3=m0.match(ifRe),
        m2=m0.match(forRe),
        varName=m2&&m2[1]?m2[1]:"", //提取for="skills"中的skills属性名
        exp=null,
        fn=null;

    //匹配到了if标签
    if(m3){
      exp=m3&&m3[1]?m3[1]:null;
      if(exp){
        fn = new Function(VALUES,WITHVALUES + RETURN +(htmlDecode(exp))+'; }');
      }
    }
    //匹配到了for标签
    if(m2){
      varName = new Function('values', 'with(values){ return '+varName+'; }');
    }
    tpls.push({
      test: fn,
      target:varName, //为处理for标签
      body: m[1]||''
    });
    html=html.replace(m[0],'{xtpl'+id+'}');
    ++id;
  }

  try {
    // 从栈顶开始解析
    return analysis(tpls[tpls.length - 1].body, data);
  } catch(e){$.log('template error')}

  function analysis(_html, _data){
      return _html.replace(re,function(m, name){
        var index = name.replace(/[^\d+]/g,''),
            sub = tpls[index],
            arr;

        if(sub && sub.target && Array.isArray( arr = sub.target(_data))){ // deal: for
          var val = '';
          arr.forEach(function(item){
            var sub = tpls[index];
            val +=  analysis(sub.body, item);
          });
          return val;
        } else if (~name.indexOf('xtpl')){ // deal: if
          if (sub.test(_data)){ // 满足条件
            return analysis(sub.body,_data); // deal: if嵌套if
          }
          return ''; // 条件不满足
        }
        return _data[name]; // deal: {name}
    });
  }
}
// 接口导出
('toArray,noConflict,addEvent,removeEvent,fireEvent,log,noop,addUrlParam,isEmptyObject,ajax,diff,Class,each,htmlEncode,htmlDecode,template').split(',').forEach(function(item){
  aaronExtension[item] = eval(item);
});
('find,on,off,click,trigger,eq,offset,position,css,addClass,removeClass,hasClass,attr,removeAttr,prop,removeProp,empty,remove,append,appendTo,each').split(',').forEach(function(item){
  aaronFnExtension[item] = eval(item);
});
aaron.extend(aaronExtension);
aaron.fn.extend(aaronFnExtension);
aaron.fn.extend({
  aaron: '1.1.0'
});
// 参考 underscore
if (typeof define === 'function' && define.amd) {
  define('aaron', [], function() {
    return aaron;
  });
}
})(window);