
(function(){

var 
    // 将window、undefined放入闭包的同名变量中，让内围访问时，作用域不要跑那么远
    window = this,
    undefined,
    // 接下来要用到jQuery、$变量名，先将这两个变量的值存起来，
    // 后面可以通过方法将这两个变量还给window
    _jQuery = window.jQuery,
    _$ = window.$,

    jQuery = window.jQuery = window.$ = function( selector, context ) {
        // 返回一个jQuery对象
        // $()的构造函数其实是jQuery.fn.init，下文会将构造函数的原型指定为jQuery.fn
        // 所以$()就可以访问jQuery.fn上的属性、方法
        return new jQuery.fn.init( selector, context );
    },

    // 判定是否是html字符串与id
    // 是就调用jQuery.clean()方法或document.getElementById()方法
    quickExpr = /^[^<]*(<(.|\s)+>)[^>]*$|^#([\w-]+)$/,
    // 是否是简单选择器
    // 以任何字符开头，后面不跟着: # [ . ,
    // 也就是不跟着id，属性，组，类等
    // p可以，.p可以，a.p不可以
    isSimple = /^.[^:#\[\.,]*$/;

jQuery.fn = jQuery.prototype = {
    // 非常复杂的方法，什么都可以传进来
    init: function( selector, context ) {
        // 如果为空就把document塞进jQuery里
        selector = selector || document;
        // 是dom节点，创建索引，创建类对象
        // 还有css、attr等方法
        // length是给Array.prototype.slice, map, filter等方法准备
        if ( selector.nodeType ) {
            this[0] = selector;
            this.length = 1;
            this.context = selector;
            return this;
        }
        // 如果传入的是string
        if ( typeof selector === "string" ) {
            var match = quickExpr.exec( selector );
            // 是html字符串或id
            if ( match && (match[1] || !context) ) {
                // html对应的是match[1]
                if ( match[1] )
                    // 用字符串创建DOM元素
                    selector = jQuery.clean( [ match[1] ], context );
                // id对应的是match[3]
                else {
                    var elem = document.getElementById( match[3] );

                    if ( elem ){
                        // Handle the case where IE and Opera return items
                        // by name instead of ID
                        if ( elem.id != match[3] )
                            return jQuery().find( selector );

                        var ret = jQuery( elem );
                        ret.context = document;
                        ret.selector = selector;
                        return ret;
                    }
                    selector = [];
                }
            } else
                return jQuery( context ).find( selector );

        // 著名的domReady
        } else if ( jQuery.isFunction( selector ) )
            // $(document).ready(function(){}) 的简写
            // $(function(){})
            return jQuery( document ).ready( selector );

        // Make sure that old selector state is passed along
        if ( selector.selector && selector.context ) {
            this.selector = selector.selector;
            this.context = selector.context;
        }
        // 确保jQuery返回类数组
        // 为什么要返回对象，而不直接返回数组？这里其实是两全其美的解决方案，一方面可以使用jQuery的方法
        // 一方面可以将其做数组使用
        return this.setArray(jQuery.makeArray(selector));
    },

    selector: "",

    jquery: "1.3",

    size: function() {
        return this.length;
    },

    // 返回一个纯数组 or 返回一个纯净的dom对象（根据索引）
    get: function( num ) {
        return num === undefined ?
            jQuery.makeArray( this ) :
            this[ num ];
    },

    // find(),slice(),map(),eq()等常用方法都调用了这个入栈方法
    // end()方法利用了pushStack中的prevObject
    pushStack: function( elems, name, selector ) {
        // 构建一个新的jQuery匹配元素集
        var ret = jQuery( elems );
        // 将旧对象添加到堆栈中
        ret.prevObject = this;
        // context可能是搜索的起点
        ret.context = this.context;
        // 把selector标记成一个特殊的字符串，以后可能在解析成jQuery对象
        if ( name === "find" )
            ret.selector = this.selector + (this.selector ? " " : "") + selector;
        else if ( name )
            ret.selector = this.selector + "." + name + "(" + selector + ")";

        return ret;
    },

    // 把许多元素一起放到jQuery对象中，由于用Array.prototype.push，不用自己维护长度
    setArray: function( elems ) {
        this.length = 0;
        Array.prototype.push.apply( this, elems );

        return this;
    },

    // 类似es中的forEach
    // 用原型方法调用静态方法
    each: function( callback, args ) {
        return jQuery.each( this, callback, args );
    },

    // 类似数组的indexOf
    index: function( elem ) {
        return jQuery.inArray(
            elem && elem.jquery ? elem[0] : elem
        , this );
    },

    // 非常复杂的方法
    // 通过参数类型判定是读方法，还是写方法
    // 下面的css()也调用这里
    attr: function( name, value, type ) {
        var options = name;
        if ( typeof name === "string" )
            if ( value === undefined )
                // 读方法，获取相应的属性
                return this[0] && jQuery[ type || "attr" ]( this[0], name );

            else {
                // 写方法，设置相应属性
                // 一个代理对象
                // 让$(...).attr({id: 'id_value', class: 'class_value'...})也能被统一处理
                options = {};
                options[ name ] = value;
            }

        // 真正工作的是静态方法
        return this.each(function(i){
            for ( name in options )
                jQuery.attr(
                    type ?
                        this.style :
                        this,
                    name, jQuery.prop( this, options[ name ], type, i, name )
                );
        });
    },
    // 可读可写，调用了attr
    css: function( key, value ) {
        // ignore negative width and height values
        if ( (key == 'width' || key == 'height') && parseFloat(value) < 0 )
            value = undefined;
        return this.attr( key, value, "curCSS" );
    },

    // 与attr类似，可读可写
    // 可以用textContent替代，但jQuery有批量操作
    text: function( text ) {
        if ( typeof text !== "object" && text != null )
            return this.empty().append( (this[0] && this[0].ownerDocument || document).createTextNode( text ) );

        var ret = "";
        // text用于递归调用自己
        jQuery.each( text || this, function(){
            jQuery.each( this.childNodes, function(){
                // 不是注释节点
                if ( this.nodeType != 8 )
                    ret += this.nodeType != 1 ?
                        this.nodeValue :
                        jQuery.fn.text( [ this ] );
            });
        });

        return ret;
    },
    // 把匹配的元素组为一个整体用html包裹起来
    // $('p').wrapAll('<div></div>') => <div><p>a</p><p>b</p><p>c</p></div>
    // wrapOutter更合适
    wrapAll: function( html ) {
        if ( this[0] ) {
            var wrap = jQuery( html, this[0].ownerDocument ).clone();
            if ( this[0].parentNode )
                wrap.insertBefore( this[0] );
            // 遍历wrap这个数组，返回jQuery对象，里面是wrap每项的位置（即firstChild.firstChild...）,
            wrap.map(function(){
                var elem = this;
                while ( elem.firstChild )
                    elem = elem.firstChild;

                return elem;
            }).append(this);
        }

        return this;
    },

    // 相当于把匹配的元素取得innerHtml，然后用wrapAll包裹起来
    // $('p').wrapInner('<i></i>') =><p><i>a</i></p><p><i>b</i></p><p><i>c</i></p>
    wrapInner: function( html ) {
        return this.each(function(){
            // contents()，获取元素的子元素，包装为jQuery对象返回
            jQuery( this ).contents().wrapAll( html );
        });
    },

    // 与上面相反，每个匹配的元素都用html包裹
    //$("p").wrap('<div></div>') =>  <div><p>******</p></div><div><p>******</p></div><div><p>******</p></div>
    wrap: function( html ) {
        return this.each(function(){
            jQuery( this ).wrapAll( html );
        });
    },
     // 接下来是append，prepend，before，after
     // append 向匹配的每个元素内部添加内容
     // 相当于
     // insertAdjacentHTML('beforeend', htmlstr)
     // insertAdjacenElement('beforeend', elem)
     // 具有处理复数个dom对象的能力，内部用each
     // 剩余3个都类似
     // 
     // prepend 向匹配的每个元素内部前置内容
     // before 向匹配的每个元素之前添加内容
     // after 向匹配的每个元素之后添加内容
     // 
     // 内部都是调用domManip()，它的价值就是兼容火狐，火狐不兼容ie的insertAdjacentXXX系列
    append: function() {
        // domManip会调用clean来生成节点，然后传入回调函数，最后利用原生接口appendChild来实现append函数
        return this.domManip(arguments, true, function(elem){
            if (this.nodeType == 1)
                this.appendChild( elem );
        });
    },

    prepend: function() {
        return this.domManip(arguments, true, function(elem){
            if (this.nodeType == 1)
                this.insertBefore( elem, this.firstChild );
        });
    },

    before: function() {
        return this.domManip(arguments, false, function(elem){
            this.parentNode.insertBefore( elem, this );
        });
    },

    after: function() {
        return this.domManip(arguments, false, function(elem){
            // 原生接口可以这么使用来实现after接口
            this.parentNode.insertBefore( elem, this.nextSibling );
        });
    },

    // 返回上次的查询的dom
    // 对应pushStack入栈，这里是查找堆栈
    end: function() {
        return this.prevObject || jQuery( [] );
    },

    // For internal use only.
    // Behaves like an Array's .push method, not like a jQuery method.
    push: [].push,

    // jQuery强大的css选择器
    // 真正起作用是jQuery.find()
    // 感觉只留else中的也可以，if可能仅仅只是一种优化
    find: function( selector ) {
        if ( this.length === 1 && !/,/.test(selector) ) {
            var ret = this.pushStack( [], "find", selector );
            ret.length = 0;
            // jQuery.find = Sizzle;
            // 分别为表达式，上下文，新元素集
            // Sizzle = function(query, context, extra, seed){
            jQuery.find( selector, this[0], ret );
            return ret;
        } else {
            var elems = jQuery.map(this, function(elem){
                return jQuery.find( selector, elem );
            });
            // 去除重复元素
            return this.pushStack( /[^+>] [^+>]/.test( selector ) ?
                jQuery.unique( elems ) :
                elems, "find", selector );
        }
    },
    // 先复制dom在复制事件
    clone: function( events ) {
        var ret = this.map(function(){
            // IE会克隆事件，标准的不会克隆事件
            if ( !jQuery.support.noCloneEvent && !jQuery.isXMLDoc(this) ) {
                // IE copies events bound via attachEvent when
                // using cloneNode. Calling detachEvent on the
                // clone will also remove the events from the orignal
                // In order to get around this, we use innerHTML.
                // Unfortunately, this means some modifications to
                // attributes in IE that are actually only stored
                // as properties will not be copied (such as the
                // the name attribute on an input).
                var clone = this.cloneNode(true),
                    container = document.createElement("div");
                container.appendChild(clone);

                // 将字符串转为jQuery对象
                return jQuery.clean([container.innerHTML])[0];
            } else
                return this.cloneNode(true);
        });

        // Need to set the expando to null on the cloned set if it exists
        // removeData doesn't work here, IE removes it from the original as well
        // this is primarily for IE but the data expando shouldn't be copied over in any browser
        // elem[expando]，通过原生的cloneNode克隆的元素是不会有expando属性的
        // 这里andSelf()方法里面会给元素分配expando属性
        var clone = ret.find("*").andSelf().each(function(){
            if ( this[ expando ] !== undefined )
                this[ expando ] = null;
        });

        // 将元素的事件克隆，重新调用event.add方法进行注册
        // event:{
        //     eventType: {
        //         1: fn1
        //         2: fn2
        //         ...
        //     }
        // }
        if ( events === true )
            this.find("*").andSelf().each(function(i){
                if (this.nodeType == 3)
                    return;
                // 取得源元素的事件缓存
                var events = jQuery.data( this, "events" );

                for ( var type in events )
                    for ( var handler in events[ type ] )
                        // 事件源、事件类型、处理函数、数据（数据会放入event中，即通过event.data获取）
                        jQuery.event.add( clone[ i ], type, events[ type ][ handler ], events[ type ][ handler ].data );
            });

        // Return the cloned set
        return ret;
    },
    // 如果参数是函数则用jQuery.grep，否则用jQuery.multiFilter（即Sizzle）
    // jQuery.grep其实类似es中的filter
    filter: function( selector ) {
        return this.pushStack(
            jQuery.isFunction( selector ) &&
            jQuery.grep(this, function(elem, i){
                return selector.call( elem, i );
            }) ||

            jQuery.multiFilter( selector, jQuery.grep(this, function(elem){
                return elem.nodeType === 1;
            }) ), "filter", selector );
    },
    // 筛选离当前元素最近的祖先元素（也可以是当前元素本身）
    // 与原生closest()类似
    closest: function( selector ) {
        // 判断是否用于方位的
        // POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/
        var pos = jQuery.expr.match.POS.test( selector ) ? jQuery(selector) : null;
        // 进一步筛选
        return this.map(function(){
            var cur = this;
            while ( cur && cur.ownerDocument ) {
                if ( pos ? pos.index(cur) > -1 : jQuery(cur).is(selector) )
                    return cur;
                cur = cur.parentNode;
            }
        });
    },
    // 用于反选，过滤元素或过滤通过字符串查询出来的元素
    // 传入字符串其实是调用的Sizzle
    // 内部调用filter
    not: function( selector ) {
        if ( typeof selector === "string" )
            // test special case where just one selector is passed in
            if ( isSimple.test( selector ) )
                // true是not的标记
                return this.pushStack( jQuery.multiFilter( selector, this, true ), "not", selector );
            else
                selector = jQuery.multiFilter( selector, this );
        
        var isArrayLike = selector.length && selector[selector.length - 1] !== undefined && !selector.nodeType;
        return this.filter(function() {
            return isArrayLike ? jQuery.inArray( this, selector ) < 0 : this != selector;
        });
    },
    // 添加新元素，并去重
    // 其中jQuery.unique()会给元素分配一个id，即elem[expando]（分析克隆clone()时带来了困惑）
    add: function( selector ) {
        return this.pushStack( jQuery.unique( jQuery.merge(
            this.get(),
            typeof selector === "string" ?
                jQuery( selector ) :
                jQuery.makeArray( selector )
        )));
    },
    // 类似Array的some()方法
    is: function( selector ) {
        // jQuery.multiFilter简单来说就是一个过滤函数
        return !!selector && jQuery.multiFilter( selector, this ).length > 0;
    },
    // 基于is方法，提供另一个接口
    // !!selector表明作者一个思路，能简单在自己这里解决就不用麻烦别的接口
    hasClass: function( selector ) {
        return !!selector && this.is( "." + selector );
    },
    // 用于获取或设置元素的value属性
    // 与attr类似，可读可写
    // 方法挺长，但不复杂
    val: function( value ) {
        // 读，特殊处理select和option
        if ( value === undefined ) {  
            // 只处理第一个元素          
            var elem = this[0];

            if ( elem ) {
                if( jQuery.nodeName( elem, 'option' ) )
                    // 检查属性是否有指定的值
                    // 如果在文档中设置了属性值，则 specified 属性返回 true
                    return (elem.attributes.value || {}).specified ? elem.value : elem.text;
                
                // We need to handle select boxes special
                if ( jQuery.nodeName( elem, "select" ) ) {
                    var index = elem.selectedIndex,
                        values = [], // 单选返回一个值，多选返回数组
                        options = elem.options,
                        one = elem.type == "select-one";

                    // Nothing was selected
                    if ( index < 0 )
                        return null;

                    // Loop through all the selected options
                    // 选择一个和选择多个统一处理
                    for ( var i = one ? index : 0, max = one ? index + 1 : options.length; i < max; i++ ) {
                        var option = options[ i ];

                        if ( option.selected ) {
                            // Get the specifc value for the option
                            value = jQuery(option).val();

                            // We don't need an array for one selects
                            if ( one )
                                return value;

                            // Multi-Selects return an array
                            values.push( value );
                        }
                    }

                    return values;              
                }

                // Everything else, we just grab the value
                // \r 匹配一个回车符
                return (elem.value || "").replace(/\r/g, "");

            }
            // 没有元素则返回undefined
            return undefined;
        }
        // 数字转为字符串
        if ( typeof value === "number" )
            value += '';
        // 写，特殊处理slelect和radio与checkbox
        // 返回原jQuery对象
        return this.each(function(){
            // 排除非元素
            if ( this.nodeType != 1 )
                return;
            // 例如：$("input").val(["check2", "radio1"]);
            // 值或者name在数组value中，则选中
            if ( jQuery.isArray(value) && /radio|checkbox/.test( this.type ) )
                this.checked = (jQuery.inArray(this.value, value) >= 0 ||
                    jQuery.inArray(this.name, value) >= 0);

            else if ( jQuery.nodeName( this, "select" ) ) {
                // 一个值多个值都统一处理
                var values = jQuery.makeArray(value);

                jQuery( "option", this ).each(function(){
                    // 值或者文本text在数组中，则选中
                    this.selected = (jQuery.inArray( this.value, values ) >= 0 ||
                        jQuery.inArray( this.text, values ) >= 0);
                });

                if ( !values.length )
                    this.selectedIndex = -1;

            } else
                this.value = value;
        });
    },
    // 读，使用innerHTML
    // 写，通过append，也可以用insertAdjacentHTML
    // HTML 5 中指定不执行由 innerHTML 插入的 <script> 标签。但其他执行script的方式是阻止不了的（详见MDN innerHTML）
    html: function( value ) {
        return value === undefined ?
            (this[0] ?
                this[0].innerHTML :
                null) :
            this.empty().append( value );
    },
    // 与实验性方法ChildNode.replaceWith((Node or DOMString)类似
    replaceWith: function( value ) {
        return this.after( value ).remove();
    },

    // 把指定索引的dom对象从jQuery中取出
    eq: function( i ) {
        // 告诉我原生的slice的参数支持字符串，例如[...].slice('3', +('3') + 1 )
        return this.slice( i, +i + 1 );
    },
    // 类似数组的slice，不过这里操作的是jQuery对象
    slice: function() {
        return this.pushStack( Array.prototype.slice.apply( this, arguments ),
            "slice", Array.prototype.slice.call(arguments).join(",") );
    },
    // 与上面类似，相较原生的map，这里会过滤undefined
    map: function( callback ) {
        return this.pushStack( jQuery.map(this, function(elem, i){
            return callback.call( elem, i, elem );
        }));
    },
    // 把之前放入prevObject的DOM元素拿出来，加入到现在的DOM数组中
    andSelf: function() {
        return this.add( this.prevObject );
    },
    // 主要用于生成节点供原型方法append、prepend、before、after使用
    // 调用clean()方法将元素或html转为节点放入文档碎片，若有script元素或生成了script节点，也会去执行该脚本
    domManip: function( args, table, callback ) {
        // 如果jQuery对象有dom，则取其文档，调用其createDocumentFragment方法
        if ( this[0] ) {
            var fragment = (this[0].ownerDocument || this[0]).createDocumentFragment(),
                // args指向arguments（即上面4个方法传入的参数）
                // jQuery.clean生成纯dom元素，会将生成的元素放入fragment中
                // scripts里面放着的是生成的script脚本元素，如果有
                scripts = jQuery.clean( args, (this[0].ownerDocument || this[0]), fragment ),
                first = fragment.firstChild,
                extra = this.length > 1 ? fragment.cloneNode(true) : fragment;

            if ( first )
                for ( var i = 0, l = this.length; i < l; i++ )
                    // callback传入一个元素与一个文档
                    callback.call( root(this[i], first), i > 0 ? extra.cloneNode(true) : fragment );
            // deal: "<script>xxx</script>"
            if ( scripts )
                // 为什么不直接将script元素全部放入<head>中
                // 可能是要删除掉这些script元素——不删除script不行吗
                // 下面这种方式就是执行一个script，然后删除它
                jQuery.each( scripts, evalScript );
        }

        return this;
        // 检测elem是不是table，是就检查tbody是否存在，没有则创建，并返回tbody元素
        function root( elem, cur ) {
            return table && jQuery.nodeName(elem, "table") && jQuery.nodeName(cur, "tr") ?
                (elem.getElementsByTagName("tbody")[0] ||
                // 语法 var child = node.appendChild(child);
                elem.appendChild(elem.ownerDocument.createElement("tbody"))) :
                elem;
        }
    }
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

// jQuery对象第一阶段的能力就告一段落，要不对象体更长。像一个茧，jQuery对象包裹的1个或复数个dom对象，jQuery对象的能力来自其prototype。

// 接下来添加新功能就使用jQuery.extend方法，或者将独立的方法名和方法体作为参数加入目标对象，因为光在对象体中搞，没有私有变量，有时我们需要这些作为胶水连接我们的方法，因此打散有打散写的好处，而且jQuery整个在闭包中，也不用担心变量逃逸到外边去，影响我们的业务代码

/*
执行一个script标签元素
  思路：
    外链，走ajax
    内嵌，走globalEval，将script中的text放入一个新建的script元素，再将新script加入head，最后删除新的script
        ps: 这种方式虽然可以将script插入文档，但不会执行，而globalEval的方式会执行
            var elt = $('<script type="text/javascript">alert(1)</script>')[0];
            document.body.insertBefore( elt, document.body.firstChild );
    删除script
 */ 
function evalScript( i, elem ) {
    if ( elem.src )
        jQuery.ajax({
            url: elem.src,
            async: false,
            dataType: "script"
        });

    else
        jQuery.globalEval( elem.text || elem.textContent || elem.innerHTML || "" );

    if ( elem.parentNode )
        elem.parentNode.removeChild( elem );
}

function now(){
    return +new Date;
}

// jQuery能力扩展的核心函数
// 功能强大，小复杂
// 要求有一个继承者与一个授权者，通常继承者在左，授权者在右，授权者通常是一个属性包
jQuery.extend = jQuery.fn.extend = function() {
    // copy reference to target object
    var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options;
    
    // 如果第一个参数是布尔值，处理deep拷贝
    // $.extend({a:{b:'b'}}, {a:{c:'c'}}) -> {a:{c:'c'}}
    // $.extend(true, {a:{b:'b'}}, {a:{c:'c'}}) -> {a:{b:'b', c:'c'}}
    if ( typeof target === "boolean" ) { 
        deep = target;
        target = arguments[1] || {}; // 设置继承者
        // skip the boolean and the target
        // 从授权者开始
        i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    // 继承者只能是对象或者函数（jQuery就是函数）
    // $.extend(1,{a: 'a'}) => 输出 {a: 'a'}
    if ( typeof target !== "object" && !jQuery.isFunction(target) )
        target = {};

    // 如果没有指定继承能力的对象，则扩展自身
    // 例如 $.extend({})   $.fn.extend(true,{})
    // 通过一个特殊的点来判断
    /*
    输入种类大致分为4种，其中②和③的共性就可以看做是这个特殊点
        ① $.extend(true, 继承者, 授权者)
        ② $.extend(true, 授权者)
        ③ $.extend(授权者)
        ④ $.extend(继承者, 授权者)
     */
    if ( length == i ) {
        target = this;
        --i;
    }
    // 将授权者一个一个拿出来赋给继承者
    // i经过上面的处理，指向了第一个授权者
    for ( ; i < length; i++ )
        // 过滤null、undefined
        if ( (options = arguments[ i ]) != null )
            // Extend the base object
            for ( var name in options ) {
                var src = target[ name ], copy = options[ name ];

                
                if ( target === copy ) // 防止自引用
                    continue;

                // Recurse if we're merging object values
                // 如果是深复制，其对象属性也是对象，并且不是Node，则把它逐一分解到继承者
                // 深拷贝，$.extend(true,{},{a:1,b:{c:3},b:{d:4}})
                if ( deep && copy && typeof copy === "object" && !copy.nodeType )
                    target[ name ] = jQuery.extend( deep, 
                        // Never move original objects, clone them
                        // 授权者是对象或数组，继承者的初始值也是对象或数组
                        src || ( copy.length != null ? [ ] : { } )
                    , copy );

                
                else if ( copy !== undefined ) // 浅拷贝，且属性值不是undefined
                    target[ name ] = copy;

            }

    // Return the modified object
    // 返回继承者
    return target;
};

// 定义一些位于闭包顶层的变量，准备新一轮功能的扩展

// exclude the following css properties to add px
// 这些css属性不添加px
var exclude = /z-?index|font-?weight|opacity|zoom|line-?height/i,
    // cache defaultView
    // 返回与文档相关的window
    // 最顶上不是有window的引用，那defaultView是干嘛用？只看到与getComputedStyle有关
    defaultView = document.defaultView || {},
    // 下面用于判断是否是函数、数组
    toString = Object.prototype.toString;

// 第二阶段是添加一些列静态方法（第一阶段是添加原型方法）
// 原型方法通常是批量处理，而静态方法通常是单个处理，例如$.nodeName
jQuery.extend({
    // 解决命名冲突
    // 原理很简单：就是还名字
    noConflict: function( deep ) {
        window.$ = _$;

        if ( deep )
            window.jQuery = _jQuery;

        return jQuery;
    },

    // See test/unit/core.js for details concerning isFunction.
    // Since version 1.3, DOM methods and functions like alert
    // aren't supported. They return false on IE (#2968).
    isFunction: function( obj ) {
        return toString.call(obj) === "[object Function]";
    },
    // 可用Array.isArray替代
    isArray: function( obj ) {
        return toString.call(obj) === "[object Array]";
    },

    // check if an element is in a (or is an) XML document
    isXMLDoc: function( elem ) {
        return elem.documentElement && !elem.body ||
            elem.tagName && elem.ownerDocument && !elem.ownerDocument.body;
    },

    // Evalulates a script in a global context
    // 把一段文本解析成脚本（相当于内联脚本，外联脚本是走ajax那条路）
    // ie利用script的text属性
    // 具体点：创建一个script元素，指定type类型，将传入的参数（即脚本的内容）放入新script元素中
    // 将新script元素插入head第一个前面，最后在删除新script元素
    globalEval: function( data ) {
        data = jQuery.trim( data );

        if ( data ) {
            // Inspired by code by Andrea Giammarchi
            // http://webreflection.blogspot.com/2007/08/global-scope-evaluation-and-dom.html
            // chorme 57 测试 可以将脚本插入到head元素的上面
            var head = document.getElementsByTagName("head")[0] || document.documentElement,
                script = document.createElement("script");

            // 自行创建一个script元素，如果不支持标准方法，就用text添加
            script.type = "text/javascript";
            if ( jQuery.support.scriptEval )
                script.appendChild( document.createTextNode( data ) );
            else
                script.text = data;

            // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
            // This arises when a base node is used (#2709).
            head.insertBefore( script, head.firstChild );
            head.removeChild( script );
        }
    },
    // 检测elem.nodeName是否等于第二个参数name
    // nodeName(ele, 'p')
    nodeName: function( elem, name ) {
        return elem.nodeName && elem.nodeName.toUpperCase() == name.toUpperCase();
    },

    // args is for internal usage only
    // 遍历对象或数组
    each: function( object, callback, args ) {
        var name, i = 0, length = object.length;
        // 内部使用
        if ( args ) {
            if ( length === undefined ) {
                // 如果是对象则对其值调用方法，返回false则跳出
                for ( name in object )
                    if ( callback.apply( object[ name ], args ) === false )
                        break;
            } else
                // 如果是数组
                for ( ; i < length; )
                    if ( callback.apply( object[ i++ ], args ) === false )
                        break;

        // A special, fast, case for the most common use of each
        // 同上，只不过没有传入args
        } else {
            if ( length === undefined ) {
                for ( name in object )
                    if ( callback.call( object[ name ], name, object[ name ] ) === false )
                        break;
            } else
                // 回调返回false，则中断接下来的遍历
                // 非得写得如此精巧，可读性不太好
                for ( var value = object[0];
                    i < length && callback.call( value, i, value ) !== false; value = object[++i] ){}
        }

        return object;
    },

    // 修复css属性值（数字）的单位px
    // 即给某些css属性添加单位px
    prop: function( elem, value, type, i, name ) {
        // Handle executable functions
        if ( jQuery.isFunction( value ) )
            value = value.call( elem, i );

        // Handle passing in a number to a CSS property
        // exclude = /z-?index|font-?weight|opacity|zoom|line-?height/i,
        // 不是z-index、line-height这些属性，值得加上px单位
        return typeof value === "number" && type == "curCSS" && !exclude.test( name ) ?
            value + "px" :
            value;
    },

// 接下来是样式的处理
    className: {
        // internal only, use addClass("class")
        // 可以一次性添加多个class，以空格分隔即可，例如 "classA classB"
        add: function( elem, classNames ) {
            // ('  aa  bb  ').split(/\s+/) => ["", "aa", "bb", ""]
            // 空格加不进去，所以无需担心，最后className的内容这样：class='aa bb'
            jQuery.each((classNames || "").split(/\s+/), function(i, className){
                if ( elem.nodeType == 1 && !jQuery.className.has( elem.className, className ) )
                    elem.className += (elem.className ? " " : "") + className;
            });
        },

        // internal only, use removeClass("class")
        // grep()方法 - 返回过滤的数组
        remove: function( elem, classNames ) {
            if (elem.nodeType == 1)
                elem.className = classNames !== undefined ?
                    jQuery.grep(elem.className.split(/\s+/), function(className){
                        return !jQuery.className.has( classNames, className );
                    }).join(" ") :
                    "";
        },

        // internal only, use hasClass("class")
        has: function( elem, className ) {
            return jQuery.inArray( className, (elem.className || elem).toString().split(/\s+/) ) > -1;
        }
    },

    // A method for quickly swapping in/out CSS properties to get correct calculations
    // 交换函数，用于获取不可见元素的宽、高，而进行交换css属性，思路很好
    swap: function( elem, options, callback ) {
        var old = {};
        // Remember the old values, and insert the new ones
        // 记录旧值，插入新值
        for ( var name in options ) {
            old[ name ] = elem.style[ name ];
            elem.style[ name ] = options[ name ];
        }
        // 交换后调用测试函数
        callback.call( elem );

        // Revert the old values
        // 测试后还原，还原旧值
        for ( var name in options )
            elem.style[ name ] = old[ name ];
    },

    // 读方法，取得元素的css样式值，真正起作用是curCSS方法
    // 只读方法，因为真正做事的jQuery.curCSS()是只读的
    css: function( elem, name, force ) {
        // 处理宽和高，因为ie不能正确返回以px为单位的精确值
        // 如果可以，直接用getComputedStyle替代
        if ( name == "width" || name == "height" ) {
            // props用于swap，值得学习
            var val, props = { position: "absolute", visibility: "hidden", display:"block" }, which = name == "width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ];
            // offsetWidth标准模式包括width、padding、border
            function getWH() {
                val = name == "width" ? elem.offsetWidth : elem.offsetHeight;
                var padding = 0, border = 0;
                jQuery.each( which, function() {
                    padding += parseFloat(jQuery.curCSS( elem, "padding" + this, true)) || 0;
                    border += parseFloat(jQuery.curCSS( elem, "border" + this + "Width", true)) || 0;
                });
                // 四舍五入取得整数
                val -= Math.round(padding + border);
            }

            if ( jQuery(elem).is(":visible") )
                getWH();
            else
                // 如果display:none就求不出offsetWidht与offsetHeight，swap一下在getWH
                jQuery.swap( elem, props, getWH );
            // Math.max(0, 'a') => NaN
            // Math.max(0, '-1', '-2') => 0
            return Math.max(0, val);
        }

        return jQuery.curCSS( elem, name, force );
    },

    // 只读方法，获取样式
    curCSS: function( elem, name, force ) {
        var ret, style = elem.style;

        // We need to handle opacity special in IE
        // ie中透明度需要特殊处理
        if ( name == "opacity" && !jQuery.support.opacity ) {
            ret = jQuery.attr( style, "opacity" );

            return ret == "" ?
                "1" :
                ret;
        }

        // Make sure we're using the right name for getting the float value
        // IE uses styleFloat instead of cssFloat
        if ( name.match( /float/i ) )
            name = styleFloat;

        // 样式直接设置在style中，快速返回
        if ( !force && style && style[ name ] )
            ret = style[ name ];

        // 标准
        // getComputedStyle返回的是解析值，大多数属性返回computed value，对于一些旧属性（宽、高），使用的是used value
        // 但display:none时，width:50% 或 width:auto，返回50%或auto
        else if ( defaultView.getComputedStyle ) {

            // Only "float" is needed here
            if ( name.match( /float/i ) )
                name = "float"; //把cssFloat转换为float，在computedStyle支持float，而不是cssFloat

            // 把驼峰转为连字符风格
            name = name.replace( /([A-Z])/g, "-$1" ).toLowerCase();

            var computedStyle = defaultView.getComputedStyle( elem, null );

            if ( computedStyle )
                ret = computedStyle.getPropertyValue( name );

            // We should always get a number back from opacity
            if ( name == "opacity" && ret == "" )
                ret = "1";

        } else if ( elem.currentStyle ) {
            // 把连字符转为驼峰
            var camelCase = name.replace(/\-(\w)/g, function(all, letter){
                return letter.toUpperCase();
            });

            ret = elem.currentStyle[ name ] || elem.currentStyle[ camelCase ];

            // From the awesome hack by Dean Edwards
            // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

            // If we're not dealing with a regular pixel number
            // but a number that has a weird ending, we need to convert it to pixels
            // 将不是以px为单位的计算值全转为px，例如10rem，用到 Dean Edwards（Base2类库的作者）的hack
            if ( !/^\d+(px)?$/i.test( ret ) && /^\d/.test( ret ) ) {
                // Remember the original values
                var left = style.left, rsLeft = elem.runtimeStyle.left;

                // Put in the new values to get a computed value out
                elem.runtimeStyle.left = elem.currentStyle.left;
                style.left = ret || 0;
                ret = style.pixelLeft + "px";

                // Revert the changed values
                style.left = left;
                elem.runtimeStyle.left = rsLeft;
            }
        }

        return ret;
    },
    // 将字符串转为dom元素的纯数组
    // elems是字符串数组
    clean: function( elems, context, fragment ) {
        context = context || document;

        // !context.createElement fails in IE with an error but returns typeof 'object'
        if ( typeof context.createElement === "undefined" )
            context = context.ownerDocument || context[0] && context[0].ownerDocument || document;

        // If a single string is passed in and it's a single tag
        // just do a createElement and skip the rest
        // 如果传入的是单个字符串，并且是单个标记
        // 只需执行createElement并跳过其余部分
        // 如<tagName />或<tagName>，直接使用createElement(tagName)
        if ( !fragment && elems.length === 1 && typeof elems[0] === "string" ) {
            var match = /^<(\w+)\s*\/?>$/.exec(elems[0]);
            if ( match )
                return [ context.createElement( match[1] ) ];
        }

        var ret = [], scripts = [], div = context.createElement("div");

        // 遍历元素，利用innerHTML转为dom数组
        jQuery.each(elems, function(i, elem){
            if ( typeof elem === "number" )
                elem += '';

            if ( !elem )
                return;

            // Convert html string into DOM nodes
            if ( typeof elem === "string" ) {
                // Fix "XHTML"-style tags in all browsers
                // 修正下，例如将<tag /> 转为 <tag></tag>
                elem = elem.replace(/(<(\w+)[^>]*?)\/>/g, function(all, front, tag){
                    return tag.match(/^(abbr|br|col|img|input|link|meta|param|hr|area|embed)$/i) ?
                        all :
                        front + "></" + tag + ">";
                });

                // Trim whitespace, otherwise indexOf won't work as expected
                // 去掉两头空白，用于下面的indexOf
                var tags = jQuery.trim( elem ).toLowerCase();

                // 修复下，例如<option>必须用<select>包裹下
                var wrap =
                    // option or optgroup
                    // option和optgroup的直接父元素一定是select
                    !tags.indexOf("<opt") &&
                    [ 1, "<select multiple='multiple'>", "</select>" ] ||
                    // <legend>的父元素一定是<fieldset>
                    !tags.indexOf("<leg") &&
                    [ 1, "<fieldset>", "</fieldset>" ] ||
                    // thead,tbody,tfoot,colgroup,caption父元素一定是table
                    tags.match(/^<(thead|tbody|tfoot|colg|cap)/) &&
                    [ 1, "<table>", "</table>" ] ||
                    // tr的父元素一定是tbody
                    !tags.indexOf("<tr") &&
                    [ 2, "<table><tbody>", "</tbody></table>" ] ||

                    // <thead> matched above
                    // td与th的父元素一定是tr
                    (!tags.indexOf("<td") || !tags.indexOf("<th")) &&
                    [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ] ||
                    // col的父元素一定是colgroup
                    !tags.indexOf("<col") &&
                    [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ] ||

                    // IE can't serialize <link> and <script> tags normally
                    !jQuery.support.htmlSerialize &&
                    [ 1, "div<div>", "</div>" ] ||

                    // 处理 $('<p>ppp</p>')
                    [ 0, "", "" ];

                // Go to html and back, then peel off extra wrappers
                div.innerHTML = wrap[1] + elem + wrap[2];

                // Move to the right depth
                // 移动到正确的深度，例如传入的是<tr>..</tr>，div最后指向<tbody>
                while ( wrap[0]-- )
                    div = div.lastChild;

                // Remove IE's autoinserted <tbody> from table fragments
                // ie会自动插入tbody，要特殊处理
                if ( !jQuery.support.tbody ) {

                    // String was a <table>, *may* have spurious <tbody>
                    var tbody = !tags.indexOf("<table") && tags.indexOf("<tbody") < 0 ?
                        div.firstChild && div.firstChild.childNodes :

                        // String was a bare <thead> or <tfoot>
                        wrap[1] == "<table>" && tags.indexOf("<tbody") < 0 ?
                            div.childNodes :
                            [];

                    for ( var j = tbody.length - 1; j >= 0 ; --j )
                        if ( jQuery.nodeName( tbody[ j ], "tbody" ) && !tbody[ j ].childNodes.length )
                            tbody[ j ].parentNode.removeChild( tbody[ j ] );

                    }

                // IE completely kills leading whitespace when innerHTML is used
                // ie在使用innerhtml时完全消除前导空格，重新将空格作为节点插入
                if ( !jQuery.support.leadingWhitespace && /^\s/.test( elem ) )
                    div.insertBefore( context.createTextNode( elem.match(/^\s*/)[0] ), div.firstChild );
                
                elem = jQuery.makeArray( div.childNodes );
            }

            if ( elem.nodeType )
                ret.push( elem );
            else
                // elem是数组
                ret = jQuery.merge( ret, elem );

        });
        
        // 只在原型方法domManip中使用了fragment
        // 如果有script元素则放入scripts，否则放入fragment中
        if ( fragment ) {
            for ( var i = 0; ret[i]; i++ ) {
                if ( jQuery.nodeName( ret[i], "script" ) && (!ret[i].type || ret[i].type.toLowerCase() === "text/javascript") ) {
                    scripts.push( ret[i].parentNode ? ret[i].parentNode.removeChild( ret[i] ) : ret[i] );
                } else {
                    if ( ret[i].nodeType === 1 )
                        ret.splice.apply( ret, [i + 1, 0].concat(jQuery.makeArray(ret[i].getElementsByTagName("script"))) );
                    fragment.appendChild( ret[i] );
                }
            }
            
            return scripts;
        }

        return ret;
    },

    // 可读可写方法
    // 针对元素的attr属性（id,class,data-自定义...）、样式style属性（background-color、color）
    attr: function( elem, name, value ) {
        // don't set attributes on text and comment nodes
        // 文本节点，注释节点不处理
        if (!elem || elem.nodeType == 3 || elem.nodeType == 8)
            return undefined;

        var notxml = !jQuery.isXMLDoc( elem ),
            // Whether we are setting (or getting)
            //  读还是写
            set = value !== undefined;

        // Try to normalize/fix the name
        // 兼容处理
        // jQuery.props = {
        //     "for": "htmlFor",
        //     "class": "className",
        //     "float": styleFloat,
        //     cssFloat: styleFloat,
        //     styleFloat: styleFloat,
        //     readonly: "readOnly",
        //     maxlength: "maxLength",
        //     cellspacing: "cellSpacing",
        //     rowspan: "rowSpan",
        //     tabindex: "tabIndex"
        // };
        name = notxml && jQuery.props[ name ] || name;

        // Only do all the following if this is a node (faster for style)
        // IE elem.getAttribute passes even for style
        if ( elem.tagName ) {

            // These attributes require special treatment
            var special = /href|src|style/.test( name );

            // Safari mis-reports the default selected property of a hidden option
            // Accessing the parent's selectedIndex property fixes it
            // 修正safari下无法取得selected正确值的bug
            if ( name == "selected" && elem.parentNode )
                elem.parentNode.selectedIndex;

            // If applicable, access the attribute via the DOM 0 way
            // elem中有属性name，不是xml，也不是特殊的属性
            if ( name in elem && notxml && !special ) {
                if ( set ){
                    // We can't allow the type property to be changed (since it causes problems in IE)
                    //  不允许改变type的值（会导致在ie中出现问题）
                    if ( name == "type" && jQuery.nodeName( elem, "input" ) && elem.parentNode )
                        throw "type property can't be changed";

                    elem[ name ] = value;
                }

                // browsers index elements by id/name on forms, give priority to attributes.
                // jquery bug提到 https://bugs.jquery.com/ticket/8628
                // getAttribute 通常用于替换getAttributeNode方法，来获得元素的属性值。性能也更快.  性能对比是 element.id 大于 element.getAttribute('id') 大于 element.getAttributeNode('id').nodeValue.
                // ？
                if( jQuery.nodeName( elem, "form" ) && elem.getAttributeNode(name) )
                    return elem.getAttributeNode( name ).nodeValue;

                // elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
                // 没有显示设置时，不总是返回正确的值
                // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
                if ( name == "tabIndex" ) {
                    var attributeNode = elem.getAttributeNode( "tabIndex" );
                    return attributeNode && attributeNode.specified
                        ? attributeNode.value
                        : elem.nodeName.match(/^(a|area|button|input|object|select|textarea)$/i)
                            ? 0
                            : undefined;
                }

                return elem[ name ];
            }
            // ie下sytle用cssText替代
            if ( !jQuery.support.style && notxml &&  name == "style" )
                return jQuery.attr( elem.style, "cssText", value );

            if ( set )
                // convert the value to a string (all browsers do this but IE) see #1070
                elem.setAttribute( name, "" + value );

            var attr = !jQuery.support.hrefNormalized && notxml && special
                    // Some attributes require a special call on IE
                    // IE 默认取得href的绝对路径，加参数2得到我们所需要的相对路径
                    ? elem.getAttribute( name, 2 )
                    : elem.getAttribute( name );

            // Non-existent attributes return null, we normalize to undefined
            return attr === null ? undefined : attr;
        }

        // elem is actually elem.style ... set the style

        // IE uses filters for opacity
        if ( !jQuery.support.opacity && name == "opacity" ) {
            if ( set ) {
                // IE has trouble with opacity if it does not have layout
                // Force it by setting the zoom level
                elem.zoom = 1;

                // Set the alpha filter to set the opacity
                elem.filter = (elem.filter || "").replace( /alpha\([^)]*\)/, "" ) +
                    (parseInt( value ) + '' == "NaN" ? "" : "alpha(opacity=" + value * 100 + ")");
            }

            return elem.filter && elem.filter.indexOf("opacity=") >= 0 ?
                (parseFloat( elem.filter.match(/opacity=([^)]*)/)[1] ) / 100) + '':
                "";
        }
        // 转为驼峰，例如elem.style.backgroundColor
        name = name.replace(/-([a-z])/ig, function(all, letter){
            return letter.toUpperCase();
        });

        if ( set )
            elem[ name ] = value;

        return elem[ name ];
    },
    // 进入jQuery核心功能选择器之前，还有一些方法，大多与数组有关
    // 去除两头的空格
    trim: function( text ) {
        return (text || "").replace( /^\s+|\s+$/g, "" );
    },

    // 转化成数组，很大众的方法
    makeArray: function( array ) {
        var ret = [];

        if( array != null ){
            var i = array.length;
            // The window, strings (and functions) also have 'length'
            if( i == null || typeof array === "string" || jQuery.isFunction(array) || array.setInterval )
                ret[0] = array;
            else
                while( i )
                    ret[--i] = array[i];
        }

        return ret;
    },
    // 判断是否在数组中，类似indexOf
    inArray: function( elem, array ) {
        for ( var i = 0, length = array.length; i < length; i++ )
        // Use === because on IE, window == document
            if ( array[ i ] === elem )
                return i;

        return -1;
    },
    // 把第二个数组加入到第一个数组中
    // 类似concat
    merge: function( first, second ) {
        // We have to loop this way because IE & Opera overwrite the length
        // expando of getElementsByTagName
        var i = 0, elem, pos = first.length;
        // Also, we need to make sure that the correct elements are being returned
        // (IE returns comment nodes in a '*' query)
        if ( !jQuery.support.getAll ) {
            while ( (elem = second[ i++ ]) != null )
                if ( elem.nodeType != 8 )
                    first[ pos++ ] = elem;

        } else
            while ( (elem = second[ i++ ]) != null )
                first[ pos++ ] = elem;

        return first;
    },
    // 过滤重复元素
    unique: function( array ) {
        // 用普通对象done做过滤器
        var ret = [], done = {};

        try {

            for ( var i = 0, length = array.length; i < length; i++ ) {
                // 取得ID，给元素分配唯一标记 elem[expando]
                var id = jQuery.data( array[ i ] );

                if ( !done[ id ] ) {
                    done[ id ] = true;
                    ret.push( array[ i ] );
                }
            }
                                           
        } catch( e ) {
            ret = array;
        }

        return ret;
    },
    // 类似filter的方法，这个方法起得真不好，grep通常与正则相关
    // callback前的!是防止函数没有返回值
    // !inv也是因为可能没传
    grep: function( elems, callback, inv ) {
        var ret = [];

        // Go through the array, only saving the items
        // that pass the validator function
        for ( var i = 0, length = elems.length; i < length; i++ )
            if ( !inv != !callback( elems[ i ], i ) )
                ret.push( elems[ i ] );

        return ret;
    },
    // 类似数组的map，但有点点不同
    map: function( elems, callback ) {
        var ret = [];

        // Go through the array, translating each of the items to their
        // new value (or values).
        for ( var i = 0, length = elems.length; i < length; i++ ) {
            var value = callback( elems[ i ], i );

            if ( value != null ) // 不会出现[1,undefined,3]
                ret[ ret.length ] = value;
        }
        // 更扁平 $.map([1,2,[3,4]], (v)=>v)
        return ret.concat.apply( [], ret );
    }
});

// Use of jQuery.browser is deprecated.
// It's included for backwards compatibility and plugins,
// although they should work to migrate away.
// jQuery.browser废弃了，为了兼容以前版本和插件
var userAgent = navigator.userAgent.toLowerCase();

// Figure out what browser is being used
jQuery.browser = {
    version: (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [0,'0'])[1],
    safari: /webkit/.test( userAgent ),
    opera: /opera/.test( userAgent ),
    msie: /msie/.test( userAgent ) && !/opera/.test( userAgent ),
    mozilla: /mozilla/.test( userAgent ) && !/(compatible|webkit)/.test( userAgent )
};

// 通过属性包给jQuery原型添加方法，都是一些查找方法
jQuery.each({
    parent: function(elem){return elem.parentNode;},
    parents: function(elem){return jQuery.dir(elem,"parentNode");},
    next: function(elem){return jQuery.nth(elem,2,"nextSibling");},
    prev: function(elem){return jQuery.nth(elem,2,"previousSibling");},
    nextAll: function(elem){return jQuery.dir(elem,"nextSibling");},
    prevAll: function(elem){return jQuery.dir(elem,"previousSibling");},
    siblings: function(elem){return jQuery.sibling(elem.parentNode.firstChild,elem);},
    children: function(elem){return jQuery.sibling(elem.firstChild);},
    contents: function(elem){return jQuery.nodeName(elem,"iframe")?elem.contentDocument||elem.contentWindow.document:jQuery.makeArray(elem.childNodes);}
}, function(name, fn){
    jQuery.fn[ name ] = function( selector ) {
        // 返回查找的结果
        var ret = jQuery.map( this, fn );
        // 过滤一下
        if ( selector && typeof selector == "string" )
            ret = jQuery.multiFilter( selector, ret );

        return this.pushStack( jQuery.unique( ret ), name, selector );
    };
});

// 把appendTo,prependTo...等方法加入到原型对象上
// 利用现存的方法append,prepend...
jQuery.each({
    appendTo: "append",
    prependTo: "prepend",
    insertBefore: "before",
    insertAfter: "after",
    replaceAll: "replaceWith"
}, function(name, original){
    jQuery.fn[ name ] = function() {
        var args = arguments;

        return this.each(function(){
            for ( var i = 0, length = args.length; i < length; i++ )
                jQuery( args[ i ] )[ original ]( this );
        });
    };
});

// 再次添加一些原型方法：删除属性、增删类、删除节点、清空节点
jQuery.each({
    removeAttr: function( name ) {
        jQuery.attr( this, name, "" );
        if (this.nodeType == 1)
            this.removeAttribute( name );
    },

    addClass: function( classNames ) {
        jQuery.className.add( this, classNames );
    },

    removeClass: function( classNames ) {
        jQuery.className.remove( this, classNames );
    },

    toggleClass: function( classNames, state ) {
        if( typeof state !== "boolean" )
            state = !jQuery.className.has( this, classNames );
        jQuery.className[ state ? "add" : "remove" ]( this, classNames );
    },
    // 不会把匹配的元素从jQuery对象中删除
    remove: function( selector ) {
        if ( !selector || jQuery.filter( selector, [ this ] ).length ) {
            // Prevent memory leaks
            jQuery( "*", this ).add([this]).each(function(){
                jQuery.event.remove(this);
                jQuery.removeData(this);
            });
            if (this.parentNode)
                this.parentNode.removeChild( this );
        }
    },

    empty: function() {
        // Remove element nodes and prevent memory leaks
        jQuery( ">*", this ).remove();

        // Remove any remaining nodes
        while ( this.firstChild )
            this.removeChild( this.firstChild );
    }
}, function(name, fn){
    jQuery.fn[ name ] = function(){
        return this.each( fn, arguments );
    };
});

// Helper function used by the dimensions and offset modules
// 将css中带单位的数值去掉单位
function num(elem, prop) {
    return elem[0] && parseInt( jQuery.curCSS(elem[0], prop, true), 10 ) || 0;
}

// jQuery的缓存机制，听说jQuery的性能很大部分依赖它
var expando = "jQuery" + now(), uuid = 0, windowData = {};

jQuery.extend({
    cache: {},

    // 给元素缓存，能读能写
    data: function( elem, name, data ) {
        // 坚决不指染window
        elem = elem == window ?
            windowData :
            elem;

        var id = elem[ expando ];

        // Compute a unique ID for the element
        if ( !id )
            // 同时为id、elem[expando]赋值，值为数字
            id = elem[ expando ] = ++uuid;

        // Only generate the data cache if we're
        // trying to access or manipulate it
        if ( name && !jQuery.cache[ id ] )
            // 在jQuery.cache上开辟存储空间，存放与特定元素的信息
            jQuery.cache[ id ] = {};

        // Prevent overriding the named cache with undefined values
        if ( data !== undefined )
            // data必须有值
            jQuery.cache[ id ][ name ] = data;

        // Return the named cache data, or the ID for the element
        // 根据第二个参数返回缓存还是特定id
        return name ?
            jQuery.cache[ id ][ name ] :
            id;
    },

    // 删除元素缓存，不指定name则删除所有缓存
    removeData: function( elem, name ) {
        elem = elem == window ?
            windowData :
            elem;

        var id = elem[ expando ];

        // If we want to remove a specific section of the element's data
        if ( name ) {
            if ( jQuery.cache[ id ] ) {
                // Remove the section of cache data
                delete jQuery.cache[ id ][ name ];

                // If we've removed all the data, remove the element's cache
                // 元素的缓存若为{}，则全部删除
                name = "";

                for ( name in jQuery.cache[ id ] )
                    break;

                if ( !name )
                    jQuery.removeData( elem );
            }

        // Otherwise, we want to remove all of the element's data
        } else {
            // Clean up the element expando
            try {
                // ie不能用delete删除，得用removeAttribute
                delete elem[ expando ];
            } catch(e){
                // IE has trouble directly removing the expando
                // but it's ok with using removeAttribute
                if ( elem.removeAttribute )
                    elem.removeAttribute( expando );
            }

            // Completely remove the data cache
            // 缓存体把索引也删除
            delete jQuery.cache[ id ];
        }
    },
    // 缓存元素的数组属性，直接在缓存对象上加工
    // 可读可写
    // jQuery.data若给同名属性设置，后者会覆盖前者
    queue: function( elem, type, data ) {
        if ( elem ){
    
            type = (type || "fx") + "queue";
            // q是缓存对象
            var q = jQuery.data( elem, type );
            // 第一次会将data转为数组
            if ( !q || jQuery.isArray(data) )
                q = jQuery.data( elem, type, jQuery.makeArray(data) );
            else if( data )
                q.push( data );

        }
        return q;
    },

    // 对元素的类数组缓存进行dequeue，也就是shift()
    dequeue: function( elem, type ){
        var queue = jQuery.queue( elem, type ),
            // 队列，先进先出
            fn = queue.shift();
        // 此方法给内部用的，下面的逻辑应该有什么作用
        if( !type || type === "fx" )
            fn = queue[0];
            
        if( fn !== undefined )
            fn.call(elem);
    }
});

// 给jQuery对象赋予缓存的能力
// 都是调用上面的静态方法，最终的缓存体还是jQuery.cache
jQuery.fn.extend({
    // 看完事件再回来看
    data: function( key, value ){
        // el.data('a.b.c', value)
        var parts = key.split(".");
        parts[1] = parts[1] ? "." + parts[1] : "";

        if ( value === undefined ) { // 读
            var data = this.triggerHandler("getData" + parts[1] + "!", [parts[0]]);

            if ( data === undefined && this.length )
                data = jQuery.data( this[0], key );

            return data === undefined && parts[1] ?
                this.data( parts[0] ) :
                data;
        } else
            return this.trigger("setData" + parts[1] + "!", [parts[0], value]).each(function(){
                jQuery.data( this, key, value );
            });
    },

    removeData: function( key ){
        return this.each(function(){
            jQuery.removeData( this, key );
        });
    },
    queue: function(type, data){
        if ( typeof type !== "string" ) {
            data = type;
            type = "fx";
        }

        if ( data === undefined )
            return jQuery.queue( this[0], type );

        return this.each(function(){
            var queue = jQuery.queue( this, type, data );
            
             if( type == "fx" && queue.length == 1 )
                queue[0].call(this);
        });
    },
    dequeue: function(type){
        return this.each(function(){
            jQuery.dequeue( this, type );
        });
    }
});
/*!
 * Sizzle CSS Selector Engine - v0.9.1
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 *  也就1k行
 */
(function(){
// 用于分解我们传入的字符串，一个chunker就是一个基本单元，例如"article section,p"这里是两个基本单元
// (\s*,\s*)是逗号
var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|[^[\]]+)+\]|\\.|[^ >+~,(\[]+)+|[>+~])(\s*,\s*)?/g,
    done = 0,
    toString = Object.prototype.toString;

// 主程序
var Sizzle = function(selector, context, results, seed) {
    results = results || []; // 上次递归的结果集
    context = context || document;

    if ( context.nodeType !== 1 && context.nodeType !== 9 )
        return []; // context必须为dom元素或document，否则返回[]
    
    if ( !selector || typeof selector !== "string" ) {
        return results; // selector必须为字符串
    }

    var parts = [], m, set, checkSet, check, mode, extra, prune = true;
    
    // Reset the position of the chunker regexp (start from head)
    // 重置lastIndex，从头开始匹配
    chunker.lastIndex = 0;
    
    while ( (m = chunker.exec(selector)) !== null ) {
        parts.push( m[1] ); // 匹配一个最基本单元
        
        if ( m[2] ) { // m[2]是(\s*,\s*)，例如 " , "
            extra = RegExp.rightContext; // 匹配内容的右边归入extra
            break; // 找到正则的一个基本单元就退出
        }
    }

    // POS /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/
    // $(article >siction,section) 选择器组，这里有两组，每组就是一个最基本单元，这里第一组parts长度为3
    if ( parts.length > 1 && Expr.match.POS.exec( selector ) ) {
        if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
            // parts[0]不可能等于""
            var later = "", match;

            // Position selectors must be done after the filter
            while ( (match = Expr.match.POS.exec( selector )) ) {
                later += match[0];
                selector = selector.replace( Expr.match.POS, "" );
            }

            set = Sizzle.filter( later, Sizzle( /\s$/.test(selector) ? selector + "*" : selector, context ) );
        } else {
            set = Expr.relative[ parts[0] ] ?
                [ context ] :
                Sizzle( parts.shift(), context );

            while ( parts.length ) {
                var tmpSet = [];

                selector = parts.shift();
                if ( Expr.relative[ selector ] )
                    selector += parts.shift();

                for ( var i = 0, l = set.length; i < l; i++ ) {
                    Sizzle( selector, set[i], tmpSet );
                }

                set = tmpSet;
            }
        }
    } else {
        // parts.pop()，让选择器从右边开始查找，如 $('article section')，先找section
        var ret = seed ?
            { expr: parts.pop(), set: makeArray(seed) } :
            Sizzle.find( parts.pop(), parts.length === 1 && context.parentNode ? context.parentNode : context );
        // 对结果进一步进行过滤
        set = Sizzle.filter( ret.expr, ret.set );

        if ( parts.length > 0 ) {
            checkSet = makeArray(set);
        } else {
            prune = false;
        }

        while ( parts.length ) {
            var cur = parts.pop(), pop = cur;

            if ( !Expr.relative[ cur ] ) {
                cur = "";// 肯定属于组合选择器中的一种，这里是后代选择器
            } else {
                pop = parts.pop();
            }

            if ( pop == null ) {
                pop = context;
            }
            // relative的键值对
            // "+": function(checkSet, part)
            // ">": function(checkSet, part, isXML)
            // "": function(checkSet, part, isXML)
            // "~": function(checkSet, part, isXML)
            // checkSet里面的元素，以">"为例，会变成元素的parentNode
            Expr.relative[ cur ]( checkSet, pop, isXML(context) );
        }
    }

    if ( !checkSet ) {
        checkSet = set;
    }

    if ( !checkSet ) {
        throw "Syntax error, unrecognized expression: " + (cur || selector);
    }
    // 将NodeList数组化，并放入结果集中
    if ( toString.call(checkSet) === "[object Array]" ) {
        if ( !prune ) {
            results.push.apply( results, checkSet );
        } else if ( context.nodeType === 1 ) {
            for ( var i = 0; checkSet[i] != null; i++ ) {
                if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
                    results.push( set[i] );
                }
            }
        } else {
            for ( var i = 0; checkSet[i] != null; i++ ) {
                if ( checkSet[i] && checkSet[i].nodeType === 1 ) { // 确保是元素
                    results.push( set[i] );
                }
            }
        }
    } else {
        makeArray( checkSet, results );
    }
    // 递归调用Sizzle
    if ( extra ) {
        Sizzle( extra, context, results, seed );
    }

    return results;
};

Sizzle.matches = function(expr, set){
    return Sizzle(expr, null, null, set);
};

// 通过id, name, tag顺序查找，若没有找到，直接返回所有子元素，所以jQuery中有许多过滤的方法
Sizzle.find = function(expr, context){
    var set, match;

    if ( !expr ) { // 空字符串，返回空数组
        return [];
    }

    for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
        var type = Expr.order[i], match; // 按照"ID", "NAME", "TAG"顺序执行
        // 可以想象
        // id的正则是 /#((?:[\w\u00c0-\uFFFF_-]|\\.)+)/，匹配上，exec返回数组，否则返回null
        if ( (match = Expr.match[ type ].exec( expr )) ) {
            // 不是一步到位
            // 非标准
            // var re = /world/g;
            // re.test('hello world!');
            // RegExp.leftContext; // "hello " 含有最新匹配的左侧字符串
            var left = RegExp.leftContext;
            // str.substr(start[, length])
            // 排除" \\#id"或"\\#id"
            if ( left.substr( left.length - 1 ) !== "\\" ) {
                // 把\去掉，"\id" 转为 id
                match[1] = (match[1] || "").replace(/\\/g, "");
                set = Expr.find[ type ]( match, context );
                if ( set != null ) {
                    // 将匹配上的那部分选择器去掉
                    expr = expr.replace( Expr.match[ type ], "" );
                    break;
                }
            }
        }
    }
    if ( !set ) {
        // 返回所有后代
        set = context.getElementsByTagName("*");
    }

    return {set: set, expr: expr};
};

// 对查找到的集合进一步过滤
Sizzle.filter = function(expr, set, inplace, not){
    var old = expr, result = [], curLoop = set, match, anyFound;

    while ( expr && set.length ) {
        for ( var type in Expr.filter ) {
        // Expr.filter的键值对
        // CHILD: function(elem, match)
        // POSUDO: function(elem, match)
        // ID: function(elem, match)
        // TAG: function(elem, match)
        // CLASS: function(elem, match)
        // ATTR: function(elem, match)
        // POS: function(elem, match, i, array)
            // 为何少NAME，难道不需要过滤
            if ( (match = Expr.match[ type ].exec( expr )) != null ) { // natch为数组
                var filter = Expr.filter[ type ], goodArray = null, goodPos = 0, found, item;
                anyFound = false;

                if ( curLoop == result ) { // [] != [] 是bug?
                    result = [];
                }
                // 修复一下选择器
                if ( Expr.preFilter[ type ] ) {
                // preFilter的键值对
                // CLASS: function(match, curLoop, inplace, result, not)
                // ID: function(match)
                // TAG: function(match, curLoop)
                // CHILD: function(match)
                // ATTR: function(match)
                // PSEUDO: function(match, curLoop, inplace, result, not)
                // POS: function(match)
                    
                    match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not );

                    if ( !match ) { // 如果返回false
                        anyFound = found = true; // 将anyFound、found置位true
                    } else if ( match === true ) {
                        continue;
                    } else if ( match[0] === true ) {
                        goodArray = [];
                        var last = null, elem;
                        for ( var i = 0; (elem = curLoop[i]) !== undefined; i++ ) {
                            if ( elem && last !== elem ) {
                                goodArray.push( elem );
                                last = elem;
                            }
                        }
                    }
                }

                if ( match ) {
                    // curLoop是要过滤的元素集合
                    for ( var i = 0; (item = curLoop[i]) !== undefined; i++ ) {
                        if ( item ) {
                            if ( goodArray && item != goodArray[goodPos] ) {
                                goodPos++;
                            }
                            // 检测元素是否符合要求
                            found = filter( item, match, goodPos, goodArray );
                            var pass = not ^ !!found;

                            if ( inplace && found != null ) {
                                if ( pass ) {
                                    anyFound = true;
                                } else {
                                    curLoop[i] = false;
                                }
                            } else if ( pass ) {
                                result.push( item ); // 符合就放入结果数组中
                                anyFound = true;
                            }
                        }
                    }
                }

                if ( found !== undefined ) {
                    if ( !inplace ) {
                        // 将过滤完的集合重新赋给curLoop
                        curLoop = result;
                    }
                    // 移除用户输入字符串匹配的那一部分
                    expr = expr.replace( Expr.match[ type ], "" );

                    if ( !anyFound ) {
                        return [];
                    }

                    break;
                }
            }
        }

        expr = expr.replace(/\s*,\s*/, "");

        // Improper expression
        // 不恰当表达式
        if ( expr == old ) {
            if ( anyFound == null ) {
                throw "Syntax error, unrecognized expression: " + expr;
            } else {
                break;
            }
        }

        old = expr;
    }

    return curLoop;
};

// 用于加工、筛选过滤和简单查找（先用ID,NAME,TAG查找，没找到就找上下文所有的元素，然后在过滤，所以过滤函数特别多）
var Expr = Sizzle.selectors = {
    order: [ "ID", "NAME", "TAG" ],
    // 与下面的filter对应，匹配上了，则用filter对应的函数去过滤
    match: {
        ID: /#((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,
        CLASS: /\.((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,
        NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF_-]|\\.)+)['"]*\]/,
        ATTR: /\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
        TAG: /^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/,
        CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
        // 位置，例如:eq :gt :first :even
        POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
        PSEUDO: /:((?:[\w\u00c0-\uFFFF_-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
    },
    attrMap: { // 一些属性不能直接取html的名字，需要用其在js中的属性（因为Sizzle是独立的，所以这里又定义了一遍）
        "class": "className",
        "for": "htmlFor"
    },
    attrHandle: {
        // 下面还会重写
        href: function(elem){
            return elem.getAttribute("href");
        }
    },
    // + ~ "" > 
    // 组合选择器就这四种
    relative: {
        // 相邻选择器
        "+": function(checkSet, part){
            for ( var i = 0, l = checkSet.length; i < l; i++ ) {
                var elem = checkSet[i];
                if ( elem ) {
                    var cur = elem.previousSibling;
                    while ( cur && cur.nodeType !== 1 ) {
                        cur = cur.previousSibling;
                    }
                    checkSet[i] = typeof part === "string" ?
                        cur || false :
                        cur === part;
                }
            }

            if ( typeof part === "string" ) {
                Sizzle.filter( part, checkSet, true );
            }
        },
        // 亲子选择器
        ">": function(checkSet, part, isXML){
            if ( typeof part === "string" && !/\W/.test(part) ) {
                part = isXML ? part : part.toUpperCase();

                for ( var i = 0, l = checkSet.length; i < l; i++ ) {
                    var elem = checkSet[i];
                    if ( elem ) {
                        var parent = elem.parentNode;
                        checkSet[i] = parent.nodeName === part ? parent : false;
                    }
                }
            } else {
                for ( var i = 0, l = checkSet.length; i < l; i++ ) {
                    var elem = checkSet[i];
                    if ( elem ) {
                        checkSet[i] = typeof part === "string" ?
                            elem.parentNode :
                            elem.parentNode === part;
                    }
                }

                if ( typeof part === "string" ) {
                    Sizzle.filter( part, checkSet, true );
                }
            }
        },
        // 后代选择器
        "": function(checkSet, part, isXML){
            var doneName = "done" + (done++), checkFn = dirCheck;

            if ( !part.match(/\W/) ) {
                var nodeCheck = part = isXML ? part : part.toUpperCase();
                checkFn = dirNodeCheck;
            }
            // nodeCheck在checkFn中没用到
            checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
        },
        // 通用兄弟选择器
        "~": function(checkSet, part, isXML){
            var doneName = "done" + (done++), checkFn = dirCheck;

            if ( typeof part === "string" && !part.match(/\W/) ) {
                var nodeCheck = part = isXML ? part : part.toUpperCase();
                checkFn = dirNodeCheck;
            }

            checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
        }
    },
    // 简单的查找
    // 只有这三个能用，后面若浏览器支持getElementsByClassName，则在ID后面加上CLASS
    find: {
        ID: function(match, context){
            if ( context.getElementById ) {
                var m = context.getElementById(match[1]);
                return m ? [m] : []; // 只有一个也放入数组，与下面的NAME、TAG保持一致
            }
        },
        NAME: function(match, context){
            return context.getElementsByName ? context.getElementsByName(match[1]) : null;
        },
        TAG: function(match, context){
            return context.getElementsByTagName(match[1]);
        }
    },
    // 对字符串进行调整，好让选择器能找到元素
    // 几乎都返回字符串
    preFilter: {
        CLASS: function(match, curLoop, inplace, result, not){
            match = " " + match[1].replace(/\\/g, "") + " ";

            for ( var i = 0; curLoop[i]; i++ ) {
                // 相当于hasClass
                if ( not ^ (" " + curLoop[i].className + " ").indexOf(match) >= 0 ) {
                    if ( !inplace )
                        result.push( curLoop[i] );
                } else if ( inplace ) {
                    curLoop[i] = false;
                }
            }

            return false;
        },

        ID: function(match){
            // 处理\ 如 #dd\\aa -> ddaa
            return match[1].replace(/\\/g, "");
        },
        TAG: function(match, curLoop){
            for ( var i = 0; !curLoop[i]; i++ ){}
            return isXML(curLoop[i]) ? match[1] : match[1].toUpperCase();
        },
        CHILD: function(match){
            if ( match[1] == "nth" ) {
                // parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
                // 解析“偶数”、“奇数”、“5”、“2n”、“3n+2”、“4n-1”、“-n+6”等公式
                var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
                    match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" ||
                    !/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

                // calculate the numbers (first)n+(last) including if they are negative
                match[2] = (test[1] + (test[2] || 1)) - 0;
                match[3] = test[3] - 0;
            }

            // TODO: Move to normal caching system
            match[0] = "done" + (done++);

            return match;
        },
        ATTR: function(match){
            var name = match[1];
            // 重置属性名，例如将class改为className
            if ( Expr.attrMap[name] ) {
                match[1] = Expr.attrMap[name];
            }
            // [attr~=value] 空格为分隔，至少匹配一个
            if ( match[2] === "~=" ) {
                match[4] = " " + match[4] + " ";
            }

            return match;
        },
        PSEUDO: function(match, curLoop, inplace, result, not){
            if ( match[1] === "not" ) {
                // If we're dealing with a complex expression, or a simple one
                if ( match[3].match(chunker).length > 1 ) {
                    match[3] = Sizzle(match[3], null, null, curLoop);
                } else {
                    var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
                    if ( !inplace ) {
                        result.push.apply( result, ret );
                    }
                    return false;
                }
            } else if ( Expr.match.POS.test( match[0] ) ) {
                return true;
            }
            
            return match;
        },
        POS: function(match){
            match.unshift( true );
            return match;
        }
    },
    filters: { // 都返回布尔值，猜测是过滤函数
        enabled: function(elem){
            // 不能为隐藏域
            return elem.disabled === false && elem.type !== "hidden";
        },
        disabled: function(elem){
            return elem.disabled === true;
        },
        checked: function(elem){
            return elem.checked === true;
        },
        selected: function(elem){
            // Accessing this property makes selected-by-default
            // options in Safari work properly
            elem.parentNode.selectedIndex;
            return elem.selected === true;
        },
        parent: function(elem){
            // 父节点肯定有孩子
            return !!elem.firstChild;
        },
        empty: function(elem){
            return !elem.firstChild;
        },
        has: function(elem, i, match){
            return !!Sizzle( match[3], elem ).length;
        },
        // 是否是h1,h2...h6
        header: function(elem){
            return /h\d/i.test( elem.nodeName );
        },
        text: function(elem){
            // 下面几个类似，归属于属性选择器
            return "text" === elem.type;
        },
        radio: function(elem){
            return "radio" === elem.type;
        },
        checkbox: function(elem){
            return "checkbox" === elem.type;
        },
        file: function(elem){
            return "file" === elem.type;
        },
        password: function(elem){
            return "password" === elem.type;
        },
        submit: function(elem){
            return "submit" === elem.type;
        },
        image: function(elem){
            return "image" === elem.type;
        },
        reset: function(elem){
            return "reset" === elem.type;
        },
        button: function(elem){
            return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
        },
        input: function(elem){
            return /input|select|textarea|button/i.test(elem.nodeName);
        }
    },
    setFilters: { // 子元素过滤器
        first: function(elem, i){
            return i === 0;
        },
        last: function(elem, i, match, array){
            return i === array.length - 1;
        },
        even: function(elem, i){
            return i % 2 === 0;
        },
        odd: function(elem, i){
            return i % 2 === 1;
        },
        lt: function(elem, i, match){
            return i < match[3] - 0;
        },
        gt: function(elem, i, match){
            return i > match[3] - 0;
        },
        nth: function(elem, i, match){
            return match[3] - 0 == i;
        },
        eq: function(elem, i, match){
            return match[3] - 0 == i;
        }
    },
    // 对查找到的元素集合进行筛选
    filter: {
        CHILD: function(elem, match){
            var type = match[1], parent = elem.parentNode;

            var doneName = "child" + parent.childNodes.length;
            
            if ( parent && (!parent[ doneName ] || !elem.nodeIndex) ) {
                var count = 1;

                for ( var node = parent.firstChild; node; node = node.nextSibling ) {
                    if ( node.nodeType == 1 ) {
                        node.nodeIndex = count++;
                    }
                }

                parent[ doneName ] = count - 1;
            }

            if ( type == "first" ) {
                return elem.nodeIndex == 1;
            } else if ( type == "last" ) {
                return elem.nodeIndex == parent[ doneName ];
            } else if ( type == "only" ) {
                return parent[ doneName ] == 1;
            } else if ( type == "nth" ) {
                var add = false, first = match[2], last = match[3];

                if ( first == 1 && last == 0 ) {
                    return true;
                }

                if ( first == 0 ) {
                    if ( elem.nodeIndex == last ) {
                        add = true;
                    }
                } else if ( (elem.nodeIndex - last) % first == 0 && (elem.nodeIndex - last) / first >= 0 ) {
                    add = true;
                }

                return add;
            }
        },
        PSEUDO: function(elem, match, i, array){
            var name = match[1], filter = Expr.filters[ name ];

            if ( filter ) {
                return filter( elem, i, match, array );
            } else if ( name === "contains" ) {
                return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
            } else if ( name === "not" ) {
                var not = match[3];

                for ( var i = 0, l = not.length; i < l; i++ ) {
                    if ( not[i] === elem ) {
                        return false;
                    }
                }

                return true;
            }
        },
        ID: function(elem, match){
            return elem.nodeType === 1 && elem.getAttribute("id") === match;
        },
        TAG: function(elem, match){
            return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
        },
        CLASS: function(elem, match){
            return match.test( elem.className );
        },
        ATTR: function(elem, match){
            var result = Expr.attrHandle[ match[1] ] ? Expr.attrHandle[ match[1] ]( elem ) : elem[ match[1] ] || elem.getAttribute( match[1] ), value = result + "", type = match[2], check = match[4];
            return result == null ?
                false :
                type === "=" ?
                value === check :
                type === "*=" ?
                value.indexOf(check) >= 0 :
                type === "~=" ?
                (" " + value + " ").indexOf(check) >= 0 :
                !match[4] ?
                result :
                type === "!=" ?
                value != check :
                type === "^=" ?
                value.indexOf(check) === 0 :
                type === "$=" ?
                value.substr(value.length - check.length) === check :
                type === "|=" ?
                value === check || value.substr(0, check.length + 1) === check + "-" :
                false;
        },
        POS: function(elem, match, i, array){
            var name = match[2], filter = Expr.setFilters[ name ];

            if ( filter ) {
                return filter( elem, i, match, array );
            }
        }
    }
};
// 重写Expr.match正则，让其更严谨
// ID为例 Expr.match.ID.exec('#aabb]')不行, 但#aa[bb]可以
for ( var type in Expr.match ) {
    Expr.match[ type ] = RegExp( Expr.match[ type ].source + /(?![^\[]*\])(?![^\(]*\))/.source );
}

// 将array转为数组，并放入结果集
var makeArray = function(array, results) {
    array = Array.prototype.slice.call( array );

    if ( results ) {
        results.push.apply( results, array );
        return results;
    }
    
    return array;
};
// 若不能通过slice将NodeList转为数组，重写makeArray
// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
try {
    Array.prototype.slice.call( document.documentElement.childNodes );

// Provide a fallback method if it does not work
} catch(e){
    // 将array中元素一个一个搬入一个数组中
    makeArray = function(array, results) {
        var ret = results || [];

        if ( toString.call(array) === "[object Array]" ) {
            Array.prototype.push.apply( ret, array );
        } else {
            if ( typeof array.length === "number" ) {
                for ( var i = 0, l = array.length; i < l; i++ ) {
                    ret.push( array[i] );
                }
            } else {
                for ( var i = 0; array[i]; i++ ) {
                    ret.push( array[i] );
                }
            }
        }

        return ret;
    };
}

// 接下来对getElementById、getElementsByTagName、querySelectorAll 、getElementsByClassName进行调整

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
// ie中getElementById(xxx)有个bug，他会找到第一个name或id等于xxx的元素
// 尤其在form中，通常都有name
(function(){
    // We're going to inject a fake input element with a specified name
    
    var form = document.createElement("form"),
        id = "script" + (new Date).getTime();
    form.innerHTML = "<input name='" + id + "'/>";

    // Inject it into the root element, check its status, and remove it quickly
    // 注入根元素，检查其状态，并快速移除
    var root = document.documentElement;
    root.insertBefore( form, root.firstChild );

    // The workaround has to do additional checks after a getElementById
    // Which slows things down for other browsers (hence the branching)
    if ( !!document.getElementById( id ) ) {
        // 找的不对，怎么补救，没看懂
        Expr.find.ID = function(match, context){
            if ( context.getElementById ) {
                var m = context.getElementById(match[1]);
                return m ? m.id === match[1] || m.getAttributeNode && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
            }
        };

        Expr.filter.ID = function(elem, match){
            var node = elem.getAttributeNode && elem.getAttributeNode("id");
            return elem.nodeType === 1 && node && node.nodeValue === match;
        };
    }

    root.removeChild( form );
})();

(function(){
    // Check to see if the browser returns only elements
    // when doing getElementsByTagName("*")

    // Create a fake element
    var div = document.createElement("div");
    div.appendChild( document.createComment("") );

    // Make sure no comments are found
    if ( div.getElementsByTagName("*").length > 0 ) {
        // 重写Expr.find.TAG
        Expr.find.TAG = function(match, context){
            var results = context.getElementsByTagName(match[1]);

            // Filter out possible comments
            // 过滤非元素节点
            if ( match[1] === "*" ) {
                var tmp = [];

                for ( var i = 0; results[i]; i++ ) {
                    if ( results[i].nodeType === 1 ) { // 过滤元素节点
                        tmp.push( results[i] );
                    }
                }

                results = tmp;
            }

            return results;
        };
    }

    // Check to see if an attribute returns normalized href attributes
    // 处理href，如果第二个参数，ie返回绝对路径
    div.innerHTML = "<a href='#'></a>";
    if ( div.firstChild.getAttribute("href") !== "#" ) {
        // 重写Expr.attrHandle.href
        Expr.attrHandle.href = function(elem){
            return elem.getAttribute("href", 2);
        };
    }
})();
// 如果支持querySelectorAll，重载Sizzle引擎，效率最高
if ( document.querySelectorAll ) (function(){
    var oldSizzle = Sizzle;
    
    Sizzle = function(query, context, extra, seed){
        context = context || document;

        if ( !seed && context.nodeType === 9 ) {
            try {
                return makeArray( context.querySelectorAll(query), extra );
            } catch(e){}
        }
        
        return oldSizzle(query, context, extra, seed);
    };

    Sizzle.find = oldSizzle.find;
    Sizzle.filter = oldSizzle.filter;
    Sizzle.selectors = oldSizzle.selectors;
    Sizzle.matches = oldSizzle.matches;
})();
// 如果支持getElementsByClassName，利用起来，加入Expr.find
if ( document.documentElement.getElementsByClassName ) {
    Expr.order.splice(1, 0, "CLASS");
    Expr.find.CLASS = function(match, context) {
        return context.getElementsByClassName(match[1]);
    };
}

// 这东西用于后代选择器和通用兄弟选择器，即找到符合的祖先或兄长元素
// checkSet是元素集合，doneName是数字
function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
    for ( var i = 0, l = checkSet.length; i < l; i++ ) {
        var elem = checkSet[i];
        if ( elem ) {
            elem = elem[dir];
            var match = false;

            while ( elem && elem.nodeType ) {
                var done = elem[doneName];
                if ( done ) {
                    match = checkSet[ done ];
                    break;
                }

                if ( elem.nodeType === 1 && !isXML )
                    elem[doneName] = i;

                if ( elem.nodeName === cur ) {
                    match = elem;
                    break;
                }

                elem = elem[dir];
            }

            checkSet[i] = match;
        }
    }
}

// 与上面方法类似
function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
    for ( var i = 0, l = checkSet.length; i < l; i++ ) {
        var elem = checkSet[i];
        if ( elem ) {
            elem = elem[dir];
            var match = false;

            while ( elem && elem.nodeType ) {
                if ( elem[doneName] ) {
                    match = checkSet[ elem[doneName] ];
                    break;
                }

                if ( elem.nodeType === 1 ) {
                    if ( !isXML )
                        elem[doneName] = i;

                    if ( typeof cur !== "string" ) {
                        if ( elem === cur ) {
                            match = true;
                            break;
                        }

                    } else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
                        match = elem;
                        break;
                    }
                }

                elem = elem[dir];
            }

            checkSet[i] = match;
        }
    }
}

// a包含b
var contains = document.compareDocumentPosition ?  function(a, b){
    return a.compareDocumentPosition(b) & 16;
} : function(a, b){
    return a !== b && (a.contains ? a.contains(b) : true);
};
// check if an element is in a (or is an) XML document
var isXML = function(elem){
    return elem.documentElement && !elem.body ||
        elem.tagName && elem.ownerDocument && !elem.ownerDocument.body;
};

// EXPOSE
jQuery.find = Sizzle;

jQuery.filter = Sizzle.filter;
// Sizzle.selectors中的属性：order、match、attrMap、attrHandle、relative、find、preFilter、filters、setFilters、filter
jQuery.expr = Sizzle.selectors;
// 重命名，以:开头伪类，许多都是自定义的
// 注释掉好像没影响
jQuery.expr[":"] = jQuery.expr.filters;

// 增加两个伪类:hidden和:visible
Sizzle.selectors.filters.hidden = function(elem){
    return "hidden" === elem.type ||
        jQuery.css(elem, "display") === "none" ||
        jQuery.css(elem, "visibility") === "hidden";
};

Sizzle.selectors.filters.visible = function(elem){
    return "hidden" !== elem.type &&
        jQuery.css(elem, "display") !== "none" &&
        jQuery.css(elem, "visibility") !== "hidden";
};
// :animated 运动中
Sizzle.selectors.filters.animated = function(elem){
    return jQuery.grep(jQuery.timers, function(fn){
        return elem === fn.elem;
    }).length;
};
// 过滤函数
jQuery.multiFilter = function( expr, elems, not ) {
    if ( not ) {
        expr = ":not(" + expr + ")";
    }

    return Sizzle.matches(expr, elems);
};
// 把路径上的元素放到结果中，dir为parentNode,previousSibling,nextSibling
jQuery.dir = function( elem, dir ){
    var matched = [], cur = elem[dir];
    while ( cur && cur != document ) {
        if ( cur.nodeType == 1 )
            matched.push( cur );
        cur = cur[dir];
    }
    return matched;
};
// 内部调用result都为2，dir为nextSibling或previousSibling
// 用于子元素过滤
jQuery.nth = function(cur, result, dir, elem){
    result = result || 1;
    var num = 0;

    for ( ; cur; cur = cur[dir] )
        if ( cur.nodeType == 1 && ++num == result )
            break;

    return cur;
};

// 查找不等于elem的兄弟元素节点
jQuery.sibling = function(n, elem){
    var r = [];

    for ( ; n; n = n.nextSibling ) {
        if ( n.nodeType == 1 && n != elem )
            r.push( n );
    }

    return r;
};

return;

window.Sizzle = Sizzle;

})();
/*
 * A number of helper functions used for managing events.
 * Many of the ideas behind this code originated from
 * Dean Edwards' addEvent library.
 */
jQuery.event = {

    // Bind an event to an element
    // Original by Dean Edwards
    // 对每个元素每种事件只绑定一次
    add: function(elem, types, handler, data) {
        // 忽略注释节点和文本节点
        if ( elem.nodeType == 3 || elem.nodeType == 8 )
            return;

        // For whatever reason, IE has trouble passing the window object
        // around, causing it to be cloned in the process
        // 处理window，例如HTMLIFrameElement.contentWindow也有setInterval
        if ( elem.setInterval && elem != window )
            elem = window;

        // Make sure that the function being executed has a unique ID
        // 确保正在执行的函数具有唯一的id，用于查找与删除
        if ( !handler.guid )
            handler.guid = this.guid++;

        // if data is passed, bind to handler
        // data用于给回调传递数据，通过event.data取得
        if ( data !== undefined ) {
            // Create temporary function pointer to original handler
            var fn = handler;

            // Create unique handler function, wrapped around original handler
            handler = this.proxy( fn );

            // Store data in unique handler
            handler.data = data;
        }

        // Init the element's event structure
        // 初始化元素的事件结构
        // 根据elem的uuid在jQuery.cache中设置一个events对象
        var events = jQuery.data(elem, "events") || jQuery.data(elem, "events", {}),
            handle = jQuery.data(elem, "handle") || jQuery.data(elem, "handle", function(){
                // Handle the second event of a trigger and when
                // an event is called after a page has unloaded
                // event.triggered为false时触发，相当于DE的handleEvent()方法
                return typeof jQuery !== "undefined" && !jQuery.event.triggered ?
                    jQuery.event.handle.apply(arguments.callee.elem, arguments) :
                    undefined;
            });
        // Add elem as a property of the handle function
        // This is to prevent a memory leak with non-native
        // event in IE.
        // 司徒：明确了this的指向
        handle.elem = elem;

        // Handle multiple events separated by a space
        // jQuery(...).bind("mouseover mouseout", fn);
        // 处理1个或多个事件
        jQuery.each(types.split(/\s+/), function(index, type) {
            // Namespaced event handlers
            // 命名空间事件处理程序
            var namespaces = type.split("."); 
            type = namespaces.shift(); // 取得真正的事件，例如mouseover或mouseout
            handler.type = namespaces.slice().sort().join("."); // 修正命名空间

            // Get the current list of functions bound to this event
            // 取得这个元素上该事件的所有回调
            var handlers = events[type];
            
            if ( jQuery.event.specialAll[type] )
                jQuery.event.specialAll[type].setup.call(elem, data, namespaces);

            // Init the event handler queue
            // 初始化event处理器队列
            if (!handlers) {
                handlers = events[type] = {};

                // Check for a special event handler
                // Only use addEventListener/attachEvent if the special
                // events handler returns false
                if ( !jQuery.event.special[type] || jQuery.event.special[type].setup.call(elem, data, namespaces) === false ) {
                    // Bind the global event handler to the element
                    if (elem.addEventListener)
                        elem.addEventListener(type, handle, false);
                    else if (elem.attachEvent)
                        elem.attachEvent("on" + type, handle);
                }
            }

            // Add the function to the element's handler list
            // 将处理函数加入队列
            handlers[handler.guid] = handler;

            // Keep track of which events have been used, for global triggering
            jQuery.event.global[type] = true;
        });

        // Nullify elem to prevent memory leaks in IE
        elem = null;
    },

    guid: 1,
    global: {},

    // Detach an event or set of events from an element
    remove: function(elem, types, handler) {
        // don't do events on text and comment nodes
        if ( elem.nodeType == 3 || elem.nodeType == 8 )
            return;
        // 取得元素上绑定的所有事件
        var events = jQuery.data(elem, "events"), ret, index;

        if ( events ) {
            // Unbind all events for the element
            // 卸载元素的所有事件
            if ( types === undefined || (typeof types === "string" && types.charAt(0) == ".") )
                for ( var type in events )
                    this.remove( elem, type + (types || "") );
            else {
                // types is actually an event object here
                if ( types.type ) {
                    handler = types.handler;
                    types = types.type;
                }

                // Handle multiple events seperated by a space
                // jQuery(...).unbind("mouseover mouseout", fn);
                jQuery.each(types.split(/\s+/), function(index, type){
                    // Namespaced event handlers
                    var namespaces = type.split(".");
                    type = namespaces.shift();
                    var namespace = RegExp("(^|\\.)" + namespaces.slice().sort().join(".*\\.") + "(\\.|$)");

                    if ( events[type] ) { // 移除某一类型
                        // remove the given handler for the given type
                        if ( handler ) // 移除这个回调函数
                            delete events[type][handler.guid];

                        // remove all handlers for the given type
                        // 移除某一类的所有回调
                        else
                            for ( var handle in events[type] )
                                // Handle the removal of namespaced events
                                if ( namespace.test(events[type][handle].type) )
                                    delete events[type][handle];
                                    
                        if ( jQuery.event.specialAll[type] )
                            jQuery.event.specialAll[type].teardown.call(elem, namespaces);

                        // remove generic event handler if no more handlers exist
                        for ( ret in events[type] ) break;
                        // 这一类事件的回调都没了
                        if ( !ret ) {
                            if ( !jQuery.event.special[type] || jQuery.event.special[type].teardown.call(elem, namespaces) === false ) {
                                if (elem.removeEventListener)
                                    // 冒泡
                                    elem.removeEventListener(type, jQuery.data(elem, "handle"), false);
                                else if (elem.detachEvent)
                                    elem.detachEvent("on" + type, jQuery.data(elem, "handle"));
                            }
                            ret = null;
                            delete events[type];
                        }
                    }
                });
            }

            // Remove the expando if it's no longer used
            // 元素所有事件都有了
            for ( ret in events ) break;
            if ( !ret ) { // 移除储存体上的数据
                var handle = jQuery.data( elem, "handle" );
                if ( handle ) handle.elem = null;
                jQuery.removeData( elem, "events" );
                jQuery.removeData( elem, "handle" );
            }
        }
    },

    // bubbling is internal
    // fire
    trigger: function( event, data, elem, bubbling ) {
        // Event object or event type
        var type = event.type || event;
        // 只有一处bubbleing是true
        if( !bubbling ){
            // 不是冒牌event，将其转为冒牌event
            event = typeof event === "object" ?
                // jQuery.Event object
                event[expando] ? event :
                // Object literal
                jQuery.extend( jQuery.Event(type), event ) :
                // Just the event type (string)
                jQuery.Event(type);

            if ( type.indexOf("!") >= 0 ) {
                event.type = type = type.slice(0, -1);
                event.exclusive = true;
            }

            // Handle a global trigger
            if ( !elem ) {
                // Don't bubble custom events when global (to avoid too much overhead)
                // 全局触发时不冒泡，避免过多开销
                event.stopPropagation();
                // Only trigger if we've ever bound an event for it
                // jQuery.event.global记录了绑定了哪些事件
                if ( this.global[type] )
                    // 遍历jQuery.cache中所有元素对应的events，存在该类型，触发
                    jQuery.each( jQuery.cache, function(){
                        if ( this.events && this.events[type] )
                            jQuery.event.trigger( event, data, this.handle.elem );
                    });
            }

            // Handle triggering a single element

            // don't do events on text and comment nodes
            if ( !elem || elem.nodeType == 3 || elem.nodeType == 8 )
                return undefined;
            
            // Clean up in case it is reused
            event.result = undefined;
            event.target = elem;
            
            // Clone the incoming data, if any
            data = jQuery.makeArray(data);
            data.unshift( event );
        }

        event.currentTarget = elem;

        // Trigger the event, it is assumed that "handle" is a function
        var handle = jQuery.data(elem, "handle");
        // 触发回调
        if ( handle )
            handle.apply( elem, data );

        // Handle triggering native .onfoo handlers (and on links since we don't call .click() for links)
        // 处理点击a标签，回调返回false，那么就不能冒泡和执行默认行为
        if ( (!elem[type] || (jQuery.nodeName(elem, 'a') && type == "click")) && elem["on"+type] && elem["on"+type].apply( elem, data ) === false )
            event.result = false;

        // Trigger the native events (except for clicks on links)
        // 处理直接绑定在元素的事件
        // addEventListener和onXXXX是分开的
        if ( !bubbling && elem[type] && !event.isDefaultPrevented() && !(jQuery.nodeName(elem, 'a') && type == "click") ) {
            this.triggered = true;
            try {
                elem[ type ]();
            // prevent IE from throwing an error for some hidden elements
            } catch (e) {}
        }

        this.triggered = false;
        // 让它冒泡执行其祖先元素相同事件
        if ( !event.isPropagationStopped() ) {
            var parent = elem.parentNode || elem.ownerDocument;
            if ( parent )
                jQuery.event.trigger(event, data, parent, true);
        }
    },
    // DE的handleEvent
    handle: function(event) {
        // returned undefined or false
        var all, handlers;
        // 修正事件对象
        event = arguments[0] = jQuery.event.fix( event || window.event );

        // Namespaced event handlers
        var namespaces = event.type.split(".");
        event.type = namespaces.shift();

        // Cache this now, all = true means, any handler
        all = !namespaces.length && !event.exclusive;
        
        var namespace = RegExp("(^|\\.)" + namespaces.slice().sort().join(".*\\.") + "(\\.|$)");
        // 取得该事件的回调队列
        handlers = ( jQuery.data(this, "events") || {} )[event.type];

        for ( var j in handlers ) {
            var handler = handlers[j];

            // Filter the functions by class
            // 过滤要执行的回调
            if ( all || namespace.test(handler.type) ) {
                // Pass in a reference to the handler function itself
                // So that we can later remove it
                event.handler = handler;
                event.data = handler.data;

                var ret = handler.apply(this, arguments);
                // 如果回调返回false，则不冒泡不执行默认行为
                if( ret !== undefined ){
                    event.result = ret;
                    if ( ret === false ) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }

                if( event.isImmediatePropagationStopped() )
                    break;

            }
        }
    },

    // 对事件对象进行改造，让新对象拥有事件对象的所有属性与行为 
    props: "altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode metaKey newValue originalTarget pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),

    // 用于修正事件对象
    // 先用jQuery.event生成一个对象，然后逐加感兴趣的属性
    fix: function(event) {
        // 直接返回修正过的对象
        if ( event[expando] )
            return event;

        // store a copy of the original event object
        // and "clone" to set read-only properties
        var originalEvent = event;
        // 返回修正的event对象
        event = jQuery.Event( originalEvent );
        // 将事件对象中可能的属性全部复制一份到新event对象
        for ( var i = this.props.length, prop; i; ){
            prop = this.props[ --i ];
            event[ prop ] = originalEvent[ prop ];
        }

        // Fix target property, if necessary
        // 让ie也有target
        // 注：ie的document没有srcElement
        if ( !event.target )
            event.target = event.srcElement || document; // Fixes #1925 where srcElement might not be defined either

        // check if target is a textnode (safari)
        // safari的文本节点也是事件源
        if ( event.target.nodeType == 3 )
            event.target = event.target.parentNode;

        // Add relatedTarget, if necessary
        // 让ie也有relatedTarget
        if ( !event.relatedTarget && event.fromElement )
            event.relatedTarget = event.fromElement == event.target ? event.toElement : event.fromElement;

        // Calculate pageX/Y if missing and clientX/Y available
        // 让ie也有pageX/Y
        if ( event.pageX == null && event.clientX != null ) {
            var doc = document.documentElement, body = document.body;
            event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc.clientLeft || 0);
            event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc.clientTop || 0);
        }

        // Add which for key events
        // 为ie添加which
        if ( !event.which && ((event.charCode || event.charCode === 0) ? event.charCode : event.keyCode) )
            event.which = event.charCode || event.keyCode;

        // Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs)
        if ( !event.metaKey && event.ctrlKey )
            event.metaKey = event.ctrlKey;

        // Add which for click: 1 == left; 2 == middle; 3 == right
        // Note: button is not normalized, so don't use it
        // 设置左中右键
        if ( !event.which && event.button )
            event.which = (event.button & 1 ? 1 : ( event.button & 2 ? 3 : ( event.button & 4 ? 2 : 0 ) ));

        return event;
    },
    // 生成包装了原回调函数的函数
    proxy: function( fn, proxy ){
        proxy = proxy || function(){ return fn.apply(this, arguments); };
        // Set the guid of unique handler to the same of original handler, so it can be removed
        proxy.guid = fn.guid = fn.guid || proxy.guid || this.guid++;
        // So proxy can be declared as an argument
        return proxy;
    },
    // 自定义事件
    // jQuery.event 事件机制:http://www.kuitao8.com/20140305/2088.shtml
    // jQuery.event自定义事件机制-jQuery.event.special范例:https://blog.csdn.net/huangxy10/article/details/40455121
    special: { 
        ready: {
            // Make sure the ready event is setup
            setup: bindReady,
            teardown: function() {}
        }
    },
    
    specialAll: {
        live: {
            setup: function( selector, namespaces ){
                jQuery.event.add( this, namespaces[0], liveHandler );
            },
            teardown:  function( namespaces ){
                if ( namespaces.length ) {
                    var remove = 0, name = RegExp("(^|\\.)" + namespaces[0] + "(\\.|$)");
                    
                    jQuery.each( (jQuery.data(this, "events").live || {}), function(){
                        if ( name.test(this.type) )
                            remove++;
                    });
                    
                    if ( remove < 1 )
                        jQuery.event.remove( this, namespaces[0], liveHandler );
                }
            }
        }
    }
};
// 返回一个普通实例，不再是浏览器给我们的那个event
jQuery.Event = function( src ){
    // Allow instantiation without the 'new' keyword
    if( !this.preventDefault )
        return new jQuery.Event(src);
    
    // Event object
    if( src && src.type ){
        this.originalEvent = src;
        this.type = src.type;
        this.timeStamp = src.timeStamp;
    // Event type
    }else
        this.type = src;

    if( !this.timeStamp )
        this.timeStamp = now();
    
    // Mark it as fixed
    this[expando] = true;
};

function returnFalse(){
    return false;
}
function returnTrue(){
    return true;
}

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
    preventDefault: function() {
        this.isDefaultPrevented = returnTrue;

        var e = this.originalEvent;
        if( !e )
            return;
        // if preventDefault exists run it on the original event
        if (e.preventDefault)
            e.preventDefault();
        // otherwise set the returnValue property of the original event to false (IE)
        e.returnValue = false;
    },
    stopPropagation: function() {
        this.isPropagationStopped = returnTrue;

        var e = this.originalEvent;
        if( !e )
            return;
        // if stopPropagation exists run it on the original event
        if (e.stopPropagation)
            e.stopPropagation();
        // otherwise set the cancelBubble property of the original event to true (IE)
        e.cancelBubble = true;
    },
    // 包含stopPropagation()的效果
    stopImmediatePropagation:function(){
        this.isImmediatePropagationStopped = returnTrue;
        this.stopPropagation();
    },
    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse
};
// Checks if an event happened on an element within another element
// Used in jQuery.event.special.mouseenter and mouseleave handlers
var withinElement = function(event) {
    // Check if mouse(over|out) are still within the same parent element
    var parent = event.relatedTarget;
    // Traverse up the tree
    while ( parent && parent != this )
        try { parent = parent.parentNode; }
        catch(e) { parent = this; }
    
    if( parent != this ){
        // set the correct event type
        event.type = event.data;
        // handle event if we actually just moused on to a non sub-element
        jQuery.event.handle.apply( this, arguments );
    }
};
    
jQuery.each({ 
    mouseover: 'mouseenter', 
    mouseout: 'mouseleave'
}, function( orig, fix ){
    jQuery.event.special[ fix ] = {
        setup: function(){
            jQuery.event.add( this, orig, withinElement, fix );
        },
        teardown: function(){
            jQuery.event.remove( this, orig, withinElement );
        }
    };             
});

jQuery.fn.extend({
    bind: function( type, data, fn ) {
        return type == "unload" ? this.one(type, data, fn) : this.each(function(){
            jQuery.event.add( this, type, fn || data, fn && data );
        });
    },

    one: function( type, data, fn ) {
        var one = jQuery.event.proxy( fn || data, function(event) {
            jQuery(this).unbind(event, one);
            return (fn || data).apply( this, arguments );
        });
        return this.each(function(){
            jQuery.event.add( this, type, one, fn && data);
        });
    },

    unbind: function( type, fn ) {
        return this.each(function(){
            jQuery.event.remove( this, type, fn );
        });
    },

    trigger: function( type, data ) {
        return this.each(function(){
            jQuery.event.trigger( type, data, this );
        });
    },
    // 只对第一个元素有效，内部依赖于trigger，不冒泡，不执行默认行为
    triggerHandler: function( type, data ) {
        if( this[0] ){
            var event = jQuery.Event(type);
            event.preventDefault();
            event.stopPropagation();
            jQuery.event.trigger( event, data, this[0] );
            return event.result;
        }       
    },
    // click的增强版，每次点击都执行不同回调，并切换到下一个？
    toggle: function( fn ) {
        // Save reference to arguments for access in closure
        var args = arguments, i = 1;

        // link all the functions, so any of them can unbind this click handler
        while( i < args.length )
            jQuery.event.proxy( fn, args[i++] );

        return this.click( jQuery.event.proxy( fn, function(event) {
            // Figure out which function to execute
            this.lastToggle = ( this.lastToggle || 0 ) % i;

            // Make sure that clicks stop
            event.preventDefault();

            // and execute the function
            return args[ this.lastToggle++ ].apply( this, arguments ) || false;
        }));
    },
    // hover模拟css的hover效果，内部依赖于mouseenter和mouseleave
    hover: function(fnOver, fnOut) {
        return this.mouseenter(fnOver).mouseleave(fnOut);
    },
    // 默认就会被执行一次
    ready: function(fn) {
        // Attach the listeners
        // 只会执行一次
        bindReady();

        // If the DOM is already ready
        // 已经加载完毕，则立即调用fn
        if ( jQuery.isReady )
            // Execute the function immediately
            fn.call( document, jQuery );

        // Otherwise, remember the function for later
        // 先将回调放入readyList数组中
        else
            // Add the function to the wait list
            jQuery.readyList.push( fn );

        return this;
    },
    
    live: function( type, fn ){
        var proxy = jQuery.event.proxy( fn );
        proxy.guid += this.selector + type;
        // 统一由docuemnt代理
        jQuery(document).bind( liveConvert(type, this.selector), this.selector, proxy );

        return this;
    },
    // die和live用于事件代理
    die: function( type, fn ){
        // 一条语句执行多个操作
        jQuery(document).unbind( liveConvert(type, this.selector), fn ? { guid: fn.guid + this.selector + type } : null );
        return this;
    }
});

function liveHandler( event ){
    var check = RegExp("(^|\\.)" + event.type + "(\\.|$)"),
        stop = true,
        elems = [];

    jQuery.each(jQuery.data(this, "events").live || [], function(i, fn){
        if ( check.test(fn.type) ) {
            var elem = jQuery(event.target).closest(fn.data)[0];
            if ( elem )
                elems.push({ elem: elem, fn: fn });
        }
    });

    jQuery.each(elems, function(){
        if ( !event.isImmediatePropagationStopped() &&
            this.fn.call(this.elem, event, this.fn.data) === false )
                stop = false;
    });

    return stop;
}

function liveConvert(type, selector){
    return ["live", type, selector.replace(/\./g, "`").replace(/ /g, "|")].join(".");
}

jQuery.extend({
    isReady: false,
    readyList: [],
    // Handle when the DOM is ready
    ready: function() {
        // Make sure that the DOM is not already loaded
        // ready在load和DOMContentLoaded都注册，防止多次执行
        if ( !jQuery.isReady ) {
            // Remember that the DOM is ready
            jQuery.isReady = true;

            // If there are functions bound, to execute
            // 将数组里的回调拿出来执行
            if ( jQuery.readyList ) {
                // Execute all of them
                jQuery.each( jQuery.readyList, function(){
                    this.call( document, jQuery );
                });

                // Reset the list of functions
                jQuery.readyList = null;
            }

            // Trigger any bound ready events
            // jQuery的自定义事件，可以这样写$(document).bind('ready', function(){});
            jQuery(document).triggerHandler("ready");
        }
    }
});

var readyBound = false;

function bindReady(){
    
    if ( readyBound ) return;
    readyBound = true;

    // Mozilla, Opera and webkit nightlies currently support this event
    if ( document.addEventListener ) {
        // Use the handy event callback
        document.addEventListener( "DOMContentLoaded", function(){
            document.removeEventListener( "DOMContentLoaded", arguments.callee, false );
            jQuery.ready();
        }, false );

    // If IE event model is used
    } else if ( document.attachEvent ) {
        // ensure firing before onload,
        // maybe late but safe also for iframes
        document.attachEvent("onreadystatechange", function(){
            if ( document.readyState === "complete" ) {
                document.detachEvent( "onreadystatechange", arguments.callee );
                jQuery.ready();
            }
        });

        // If IE and not an iframe
        // continually check to see if the document is ready
        if ( document.documentElement.doScroll && !window.frameElement ) (function(){
            if ( jQuery.isReady ) return;

            try {
                // If IE is used, use the trick by Diego Perini
                // http://javascript.nwbox.com/IEContentLoaded/
                document.documentElement.doScroll("left");
            } catch( error ) {
                setTimeout( arguments.callee, 0 );
                return;
            }

            // and execute any waiting functions
            jQuery.ready();
        })();
    }

    // A fallback to window.onload, that will always work
    jQuery.event.add( window, "load", jQuery.ready );
}

jQuery.each( ("blur,focus,load,resize,scroll,unload,click,dblclick," +
    "mousedown,mouseup,mousemove,mouseover,mouseout,mouseenter,mouseleave," +
    "change,select,submit,keydown,keypress,keyup,error").split(","), function(i, name){

    // Handle event binding
    jQuery.fn[name] = function(fn){
        return fn ? this.bind(name, fn) : this.trigger(name);
    };
});

// Prevent memory leaks in IE
// And prevent errors on refresh with events like mouseover in other browsers
// Window isn't included so as not to unbind existing unload events
jQuery( window ).bind( 'unload', function(){ 
    for ( var id in jQuery.cache )
        // Skip the window
        if ( id != 1 && jQuery.cache[ id ].handle )
            jQuery.event.remove( jQuery.cache[ id ].handle.elem );
}); 
(function(){

    jQuery.support = {};

    var root = document.documentElement,
        script = document.createElement("script"),
        div = document.createElement("div"),
        id = "script" + (new Date).getTime();
    // 用于浏览器测试，例如是否支持opacity，href是否等于'/a'等
    div.style.display = "none";
    div.innerHTML = '   <link/><table></table><a href="/a" style="color:red;float:left;opacity:.5;">a</a><select><option>text</option></select><object><param/></object>';

    var all = div.getElementsByTagName("*"),
        a = div.getElementsByTagName("a")[0];

    // Can't get basic test support
    if ( !all || !all.length || !a ) {
        return;
    }

    jQuery.support = {
        // IE strips leading whitespace when .innerHTML is used
        // 当使用.innerhtml时，IE会去掉前导空格
        leadingWhitespace: div.firstChild.nodeType == 3,
        
        // Make sure that tbody elements aren't automatically inserted
        // IE will insert them into empty tables
        tbody: !div.getElementsByTagName("tbody").length, // chrome 没有插入
        
        // Make sure that you can get all elements in an <object> element
        // IE 7 always returns no results
        objectAll: !!div.getElementsByTagName("object")[0]
            .getElementsByTagName("*").length,
        
        // Make sure that link elements get serialized correctly by innerHTML
        // This requires a wrapper element in IE
        htmlSerialize: !!div.getElementsByTagName("link").length,
        
        // Get the style information from getAttribute
        // (IE uses .cssText insted)
        style: /red/.test( a.getAttribute("style") ),
        
        // Make sure that URLs aren't manipulated
        // (IE normalizes it by default)
        hrefNormalized: a.getAttribute("href") === "/a",
        
        // Make sure that element opacity exists
        // (IE uses filter instead)
        opacity: a.style.opacity === "0.5",
        
        // Verify style float existence
        // (IE uses styleFloat instead of cssFloat)
        cssFloat: !!a.style.cssFloat,

        // Will be defined later
        scriptEval: false,
        noCloneEvent: true,
        boxModel: null
    };
    script.type = "text/javascript";
    try {
        script.appendChild( document.createTextNode( "window." + id + "=1;" ) );
    } catch(e){}

    root.insertBefore( script, root.firstChild );
    
    // Make sure that the execution of code works by injecting a script
    // tag with appendChild/createTextNode
    // (IE doesn't support this, fails, and uses .text instead)
    // 通过注入脚本确保代码的有效执行
    // 使用 appendChild/createTextNode
    // ie不支持，用.text
    if ( window[ id ] ) {
        jQuery.support.scriptEval = true;
        delete window[ id ];
    }

    root.removeChild( script );

    if ( div.attachEvent && div.fireEvent ) {
        div.attachEvent("onclick", function(){
            // Cloning a node shouldn't copy over any
            // bound event handlers (IE does this)
            jQuery.support.noCloneEvent = false;
            div.detachEvent("onclick", arguments.callee);
        });
        div.cloneNode(true).fireEvent("onclick");
    }

    // Figure out if the W3C box model works as expected
    // document.body must exist before we can do this
    // 执行了$(function(){})
    jQuery(function(){
        var div = document.createElement("div");
        div.style.width = "1px";
        div.style.paddingLeft = "1px";

        document.body.appendChild( div );
        jQuery.boxModel = jQuery.support.boxModel = div.offsetWidth === 2;
        document.body.removeChild( div );
    });
})();

var styleFloat = jQuery.support.cssFloat ? "cssFloat" : "styleFloat";

jQuery.props = {
    "for": "htmlFor",
    "class": "className",
    "float": styleFloat,
    cssFloat: styleFloat,
    styleFloat: styleFloat,
    readonly: "readOnly",
    maxlength: "maxLength",
    cellspacing: "cellSpacing",
    rowspan: "rowSpan",
    tabindex: "tabIndex"
};
jQuery.fn.extend({
    // Keep a copy of the old load
    _load: jQuery.fn.load,

    load: function( url, params, callback ) {
        if ( typeof url !== "string" )
            return this._load( url );

        var off = url.indexOf(" ");
        if ( off >= 0 ) {
            var selector = url.slice(off, url.length);
            url = url.slice(0, off);
        }

        // Default to a GET request
        var type = "GET";

        // If the second parameter was provided
        if ( params )
            // If it's a function
            if ( jQuery.isFunction( params ) ) {
                // We assume that it's the callback
                callback = params;
                params = null;

            // Otherwise, build a param string
            } else if( typeof params === "object" ) {
                params = jQuery.param( params );
                type = "POST";
            }

        var self = this;

        // Request the remote document
        jQuery.ajax({
            url: url,
            type: type,
            dataType: "html",
            data: params,
            complete: function(res, status){
                // If successful, inject the HTML into all the matched elements
                if ( status == "success" || status == "notmodified" )
                    // See if a selector was specified
                    self.html( selector ?
                        // Create a dummy div to hold the results
                        jQuery("<div/>")
                            // inject the contents of the document in, removing the scripts
                            // to avoid any 'Permission Denied' errors in IE
                            .append(res.responseText.replace(/<script(.|\s)*?\/script>/g, ""))

                            // Locate the specified elements
                            .find(selector) :

                        // If not, just inject the full result
                        res.responseText );

                if( callback )
                    self.each( callback, [res.responseText, status, res] );
            }
        });
        return this;
    },

    serialize: function() {
        return jQuery.param(this.serializeArray());
    },
    serializeArray: function() {
        return this.map(function(){
            return this.elements ? jQuery.makeArray(this.elements) : this;
        })
        .filter(function(){
            return this.name && !this.disabled &&
                (this.checked || /select|textarea/i.test(this.nodeName) ||
                    /text|hidden|password/i.test(this.type));
        })
        .map(function(i, elem){
            var val = jQuery(this).val();
            return val == null ? null :
                jQuery.isArray(val) ?
                    jQuery.map( val, function(val, i){
                        return {name: elem.name, value: val};
                    }) :
                    {name: elem.name, value: val};
        }).get();
    }
});

// Attach a bunch of functions for handling common AJAX events
jQuery.each( "ajaxStart,ajaxStop,ajaxComplete,ajaxError,ajaxSuccess,ajaxSend".split(","), function(i,o){
    jQuery.fn[o] = function(f){
        return this.bind(o, f);
    };
});

var jsc = now();

jQuery.extend({
  
    get: function( url, data, callback, type ) {
        // shift arguments if data argument was ommited
        if ( jQuery.isFunction( data ) ) {
            callback = data;
            data = null;
        }

        return jQuery.ajax({
            type: "GET",
            url: url,
            data: data,
            success: callback,
            dataType: type
        });
    },

    getScript: function( url, callback ) {
        return jQuery.get(url, null, callback, "script");
    },

    getJSON: function( url, data, callback ) {
        return jQuery.get(url, data, callback, "json");
    },

    post: function( url, data, callback, type ) {
        if ( jQuery.isFunction( data ) ) {
            callback = data;
            data = {};
        }

        return jQuery.ajax({
            type: "POST",
            url: url,
            data: data,
            success: callback,
            dataType: type
        });
    },

    ajaxSetup: function( settings ) {
        jQuery.extend( jQuery.ajaxSettings, settings );
    },

    ajaxSettings: {
        url: location.href,
        global: true,
        type: "GET",
        contentType: "application/x-www-form-urlencoded",
        processData: true,
        async: true,
        /*
        timeout: 0,
        data: null,
        username: null,
        password: null,
        */
        // Create the request object; Microsoft failed to properly
        // implement the XMLHttpRequest in IE7, so we use the ActiveXObject when it is available
        // This function can be overriden by calling jQuery.ajaxSetup
        xhr:function(){
            return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
        },
        accepts: {
            xml: "application/xml, text/xml",
            html: "text/html",
            script: "text/javascript, application/javascript",
            json: "application/json, text/javascript",
            text: "text/plain",
            _default: "*/*"
        }
    },

    // Last-Modified header cache for next request
    lastModified: {},

    ajax: function( s ) {
        // Extend the settings, but re-extend 's' so that it can be
        // checked again later (in the test suite, specifically)
        s = jQuery.extend(true, s, jQuery.extend(true, {}, jQuery.ajaxSettings, s));

        var jsonp, jsre = /=\?(&|$)/g, status, data,
            type = s.type.toUpperCase();

        // convert data if not already a string
        if ( s.data && s.processData && typeof s.data !== "string" )
            s.data = jQuery.param(s.data);

        // Handle JSONP Parameter Callbacks
        if ( s.dataType == "jsonp" ) {
            if ( type == "GET" ) {
                if ( !s.url.match(jsre) )
                    s.url += (s.url.match(/\?/) ? "&" : "?") + (s.jsonp || "callback") + "=?";
            } else if ( !s.data || !s.data.match(jsre) )
                s.data = (s.data ? s.data + "&" : "") + (s.jsonp || "callback") + "=?";
            s.dataType = "json";
        }

        // Build temporary JSONP function
        if ( s.dataType == "json" && (s.data && s.data.match(jsre) || s.url.match(jsre)) ) {
            jsonp = "jsonp" + jsc++;

            // Replace the =? sequence both in the query string and the data
            if ( s.data )
                s.data = (s.data + "").replace(jsre, "=" + jsonp + "$1");
            s.url = s.url.replace(jsre, "=" + jsonp + "$1");

            // We need to make sure
            // that a JSONP style response is executed properly
            s.dataType = "script";

            // Handle JSONP-style loading
            window[ jsonp ] = function(tmp){
                data = tmp;
                success();
                complete();
                // Garbage collect
                window[ jsonp ] = undefined;
                try{ delete window[ jsonp ]; } catch(e){}
                if ( head )
                    head.removeChild( script );
            };
        }

        if ( s.dataType == "script" && s.cache == null )
            s.cache = false;

        if ( s.cache === false && type == "GET" ) {
            var ts = now();
            // try replacing _= if it is there
            var ret = s.url.replace(/(\?|&)_=.*?(&|$)/, "$1_=" + ts + "$2");
            // if nothing was replaced, add timestamp to the end
            s.url = ret + ((ret == s.url) ? (s.url.match(/\?/) ? "&" : "?") + "_=" + ts : "");
        }

        // If data is available, append data to url for get requests
        if ( s.data && type == "GET" ) {
            s.url += (s.url.match(/\?/) ? "&" : "?") + s.data;

            // IE likes to send both get and post data, prevent this
            s.data = null;
        }

        // Watch for a new set of requests
        if ( s.global && ! jQuery.active++ )
            jQuery.event.trigger( "ajaxStart" );

        // Matches an absolute URL, and saves the domain
        var parts = /^(\w+:)?\/\/([^\/?#]+)/.exec( s.url );

        // If we're requesting a remote document
        // and trying to load JSON or Script with a GET
        if ( s.dataType == "script" && type == "GET" && parts
            && ( parts[1] && parts[1] != location.protocol || parts[2] != location.host )){

            var head = document.getElementsByTagName("head")[0];
            var script = document.createElement("script");
            script.src = s.url;
            if (s.scriptCharset)
                script.charset = s.scriptCharset;

            // Handle Script loading
            if ( !jsonp ) {
                var done = false;

                // Attach handlers for all browsers
                script.onload = script.onreadystatechange = function(){
                    if ( !done && (!this.readyState ||
                            this.readyState == "loaded" || this.readyState == "complete") ) {
                        done = true;
                        success();
                        complete();
                        head.removeChild( script );
                    }
                };
            }

            head.appendChild(script);

            // We handle everything using the script element injection
            return undefined;
        }

        var requestDone = false;

        // Create the request object
        var xhr = s.xhr();

        // Open the socket
        // Passing null username, generates a login popup on Opera (#2865)
        if( s.username )
            xhr.open(type, s.url, s.async, s.username, s.password);
        else
            xhr.open(type, s.url, s.async);

        // Need an extra try/catch for cross domain requests in Firefox 3
        try {
            // Set the correct header, if data is being sent
            if ( s.data )
                xhr.setRequestHeader("Content-Type", s.contentType);

            // Set the If-Modified-Since header, if ifModified mode.
            if ( s.ifModified )
                xhr.setRequestHeader("If-Modified-Since",
                    jQuery.lastModified[s.url] || "Thu, 01 Jan 1970 00:00:00 GMT" );

            // Set header so the called script knows that it's an XMLHttpRequest
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

            // Set the Accepts header for the server, depending on the dataType
            xhr.setRequestHeader("Accept", s.dataType && s.accepts[ s.dataType ] ?
                s.accepts[ s.dataType ] + ", */*" :
                s.accepts._default );
        } catch(e){}

        // Allow custom headers/mimetypes and early abort
        if ( s.beforeSend && s.beforeSend(xhr, s) === false ) {
            // Handle the global AJAX counter
            if ( s.global && ! --jQuery.active )
                jQuery.event.trigger( "ajaxStop" );
            // close opended socket
            xhr.abort();
            return false;
        }

        if ( s.global )
            jQuery.event.trigger("ajaxSend", [xhr, s]);

        // Wait for a response to come back
        var onreadystatechange = function(isTimeout){
            // The request was aborted, clear the interval and decrement jQuery.active
            if (xhr.readyState == 0) {
                if (ival) {
                    // clear poll interval
                    clearInterval(ival);
                    ival = null;
                    // Handle the global AJAX counter
                    if ( s.global && ! --jQuery.active )
                        jQuery.event.trigger( "ajaxStop" );
                }
            // The transfer is complete and the data is available, or the request timed out
            } else if ( !requestDone && xhr && (xhr.readyState == 4 || isTimeout == "timeout") ) {
                requestDone = true;

                // clear poll interval
                if (ival) {
                    clearInterval(ival);
                    ival = null;
                }

                status = isTimeout == "timeout" ? "timeout" :
                    !jQuery.httpSuccess( xhr ) ? "error" :
                    s.ifModified && jQuery.httpNotModified( xhr, s.url ) ? "notmodified" :
                    "success";

                if ( status == "success" ) {
                    // Watch for, and catch, XML document parse errors
                    try {
                        // process the data (runs the xml through httpData regardless of callback)
                        data = jQuery.httpData( xhr, s.dataType, s );
                    } catch(e) {
                        status = "parsererror";
                    }
                }

                // Make sure that the request was successful or notmodified
                if ( status == "success" ) {
                    // Cache Last-Modified header, if ifModified mode.
                    var modRes;
                    try {
                        modRes = xhr.getResponseHeader("Last-Modified");
                    } catch(e) {} // swallow exception thrown by FF if header is not available

                    if ( s.ifModified && modRes )
                        jQuery.lastModified[s.url] = modRes;

                    // JSONP handles its own success callback
                    if ( !jsonp )
                        success();
                } else
                    jQuery.handleError(s, xhr, status);

                // Fire the complete handlers
                complete();

                // Stop memory leaks
                if ( s.async )
                    xhr = null;
            }
        };

        if ( s.async ) {
            // don't attach the handler to the request, just poll it instead
            var ival = setInterval(onreadystatechange, 13);

            // Timeout checker
            if ( s.timeout > 0 )
                setTimeout(function(){
                    // Check to see if the request is still happening
                    if ( xhr ) {
                        if( !requestDone )
                            onreadystatechange( "timeout" );

                        // Cancel the request
                        if ( xhr )
                            xhr.abort();
                    }
                }, s.timeout);
        }

        // Send the data
        try {
            xhr.send(s.data);
        } catch(e) {
            jQuery.handleError(s, xhr, null, e);
        }

        // firefox 1.5 doesn't fire statechange for sync requests
        if ( !s.async )
            onreadystatechange();

        function success(){
            // If a local callback was specified, fire it and pass it the data
            if ( s.success )
                s.success( data, status );

            // Fire the global callback
            if ( s.global )
                jQuery.event.trigger( "ajaxSuccess", [xhr, s] );
        }

        function complete(){
            // Process result
            if ( s.complete )
                s.complete(xhr, status);

            // The request was completed
            if ( s.global )
                jQuery.event.trigger( "ajaxComplete", [xhr, s] );

            // Handle the global AJAX counter
            if ( s.global && ! --jQuery.active )
                jQuery.event.trigger( "ajaxStop" );
        }

        // return XMLHttpRequest to allow aborting the request etc.
        return xhr;
    },

    handleError: function( s, xhr, status, e ) {
        // If a local callback was specified, fire it
        if ( s.error ) s.error( xhr, status, e );

        // Fire the global callback
        if ( s.global )
            jQuery.event.trigger( "ajaxError", [xhr, s, e] );
    },

    // Counter for holding the number of active queries
    active: 0,

    // Determines if an XMLHttpRequest was successful or not
    httpSuccess: function( xhr ) {
        try {
            // IE error sometimes returns 1223 when it should be 204 so treat it as success, see #1450
            return !xhr.status && location.protocol == "file:" ||
                ( xhr.status >= 200 && xhr.status < 300 ) || xhr.status == 304 || xhr.status == 1223;
        } catch(e){}
        return false;
    },

    // Determines if an XMLHttpRequest returns NotModified
    httpNotModified: function( xhr, url ) {
        try {
            var xhrRes = xhr.getResponseHeader("Last-Modified");

            // Firefox always returns 200. check Last-Modified date
            return xhr.status == 304 || xhrRes == jQuery.lastModified[url];
        } catch(e){}
        return false;
    },

    httpData: function( xhr, type, s ) {
        var ct = xhr.getResponseHeader("content-type"),
            xml = type == "xml" || !type && ct && ct.indexOf("xml") >= 0,
            data = xml ? xhr.responseXML : xhr.responseText;

        if ( xml && data.documentElement.tagName == "parsererror" )
            throw "parsererror";
            
        // Allow a pre-filtering function to sanitize the response
        // s != null is checked to keep backwards compatibility
        if( s && s.dataFilter )
            data = s.dataFilter( data, type );

        // The filter can actually parse the response
        if( typeof data === "string" ){

            // If the type is "script", eval it in global context
            if ( type == "script" )
                jQuery.globalEval( data );

            // Get the JavaScript object, if JSON is used.
            if ( type == "json" )
                data = window["eval"]("(" + data + ")");
        }
        
        return data;
    },

    // Serialize an array of form elements or a set of
    // key/values into a query string
    param: function( a ) {
        var s = [ ];

        function add( key, value ){
            s[ s.length ] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
        };

        // If an array was passed in, assume that it is an array
        // of form elements
        if ( jQuery.isArray(a) || a.jquery )
            // Serialize the form elements
            jQuery.each( a, function(){
                add( this.name, this.value );
            });

        // Otherwise, assume that it's an object of key/value pairs
        else
            // Serialize the key/values
            for ( var j in a )
                // If the value is an array then the key names need to be repeated
                if ( jQuery.isArray(a[j]) )
                    jQuery.each( a[j], function(){
                        add( j, this );
                    });
                else
                    add( j, jQuery.isFunction(a[j]) ? a[j]() : a[j] );

        // Return the resulting serialization
        return s.join("&").replace(/%20/g, "+");
    }

});
var elemdisplay = {},
    fxAttrs = [
        // height animations
        [ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
        // width animations
        [ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ],
        // opacity animations
        [ "opacity" ]
    ];

function genFx( type, num ){
    var obj = {};
    jQuery.each( fxAttrs.concat.apply([], fxAttrs.slice(0,num)), function(){
        obj[ this ] = type;
    });
    return obj;
}

jQuery.fn.extend({
    show: function(speed,callback){
        if ( speed ) {
            return this.animate( genFx("show", 3), speed, callback);
        } else {
            for ( var i = 0, l = this.length; i < l; i++ ){
                var old = jQuery.data(this[i], "olddisplay");
                
                this[i].style.display = old || "";
                
                if ( jQuery.css(this[i], "display") === "none" ) {
                    var tagName = this[i].tagName, display;
                    
                    if ( elemdisplay[ tagName ] ) {
                        display = elemdisplay[ tagName ];
                    } else {
                        var elem = jQuery("<" + tagName + " />").appendTo("body");
                        
                        display = elem.css("display");
                        if ( display === "none" )
                            display = "block";
                        
                        elem.remove();
                        
                        elemdisplay[ tagName ] = display;
                    }
                    
                    this[i].style.display = jQuery.data(this[i], "olddisplay", display);
                }
            }
            
            return this;
        }
    },

    hide: function(speed,callback){
        if ( speed ) {
            return this.animate( genFx("hide", 3), speed, callback);
        } else {
            for ( var i = 0, l = this.length; i < l; i++ ){
                var old = jQuery.data(this[i], "olddisplay");
                if ( !old && old !== "none" )
                    jQuery.data(this[i], "olddisplay", jQuery.css(this[i], "display"));
                this[i].style.display = "none";
            }
            return this;
        }
    },

    // Save the old toggle function
    _toggle: jQuery.fn.toggle,

    toggle: function( fn, fn2 ){
        var bool = typeof fn === "boolean";

        return jQuery.isFunction(fn) && jQuery.isFunction(fn2) ?
            this._toggle.apply( this, arguments ) :
            fn == null || bool ?
                this.each(function(){
                    var state = bool ? fn : jQuery(this).is(":hidden");
                    jQuery(this)[ state ? "show" : "hide" ]();
                }) :
                this.animate(genFx("toggle", 3), fn, fn2);
    },

    fadeTo: function(speed,to,callback){
        return this.animate({opacity: to}, speed, callback);
    },

    animate: function( prop, speed, easing, callback ) {
        var optall = jQuery.speed(speed, easing, callback);

        return this[ optall.queue === false ? "each" : "queue" ](function(){
        
            var opt = jQuery.extend({}, optall), p,
                hidden = this.nodeType == 1 && jQuery(this).is(":hidden"),
                self = this;
    
            for ( p in prop ) {
                if ( prop[p] == "hide" && hidden || prop[p] == "show" && !hidden )
                    return opt.complete.call(this);

                if ( ( p == "height" || p == "width" ) && this.style ) {
                    // Store display property
                    opt.display = jQuery.css(this, "display");

                    // Make sure that nothing sneaks out
                    opt.overflow = this.style.overflow;
                }
            }

            if ( opt.overflow != null )
                this.style.overflow = "hidden";

            opt.curAnim = jQuery.extend({}, prop);

            jQuery.each( prop, function(name, val){
                var e = new jQuery.fx( self, opt, name );

                if ( /toggle|show|hide/.test(val) )
                    e[ val == "toggle" ? hidden ? "show" : "hide" : val ]( prop );
                else {
                    var parts = val.toString().match(/^([+-]=)?([\d+-.]+)(.*)$/),
                        start = e.cur(true) || 0;

                    if ( parts ) {
                        var end = parseFloat(parts[2]),
                            unit = parts[3] || "px";

                        // We need to compute starting value
                        if ( unit != "px" ) {
                            self.style[ name ] = (end || 1) + unit;
                            start = ((end || 1) / e.cur(true)) * start;
                            self.style[ name ] = start + unit;
                        }

                        // If a +=/-= token was provided, we're doing a relative animation
                        if ( parts[1] )
                            end = ((parts[1] == "-=" ? -1 : 1) * end) + start;

                        e.custom( start, end, unit );
                    } else
                        e.custom( start, val, "" );
                }
            });

            // For JS strict compliance
            return true;
        });
    },

    stop: function(clearQueue, gotoEnd){
        var timers = jQuery.timers;

        if (clearQueue)
            this.queue([]);

        this.each(function(){
            // go in reverse order so anything added to the queue during the loop is ignored
            for ( var i = timers.length - 1; i >= 0; i-- )
                if ( timers[i].elem == this ) {
                    if (gotoEnd)
                        // force the next step to be the last
                        timers[i](true);
                    timers.splice(i, 1);
                }
        });

        // start the next in the queue if the last step wasn't forced
        if (!gotoEnd)
            this.dequeue();

        return this;
    }

});

// Generate shortcuts for custom animations
jQuery.each({
    slideDown: genFx("show", 1),
    slideUp: genFx("hide", 1),
    slideToggle: genFx("toggle", 1),
    fadeIn: { opacity: "show" },
    fadeOut: { opacity: "hide" }
}, function( name, props ){
    jQuery.fn[ name ] = function( speed, callback ){
        return this.animate( props, speed, callback );
    };
});

jQuery.extend({

    speed: function(speed, easing, fn) {
        var opt = typeof speed === "object" ? speed : {
            complete: fn || !fn && easing ||
                jQuery.isFunction( speed ) && speed,
            duration: speed,
            easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
        };

        opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
            jQuery.fx.speeds[opt.duration] || jQuery.fx.speeds._default;

        // Queueing
        opt.old = opt.complete;
        opt.complete = function(){
            if ( opt.queue !== false )
                jQuery(this).dequeue();
            if ( jQuery.isFunction( opt.old ) )
                opt.old.call( this );
        };

        return opt;
    },

    easing: {
        linear: function( p, n, firstNum, diff ) {
            return firstNum + diff * p;
        },
        swing: function( p, n, firstNum, diff ) {
            return ((-Math.cos(p*Math.PI)/2) + 0.5) * diff + firstNum;
        }
    },

    timers: [],
    timerId: null,

    fx: function( elem, options, prop ){
        this.options = options;
        this.elem = elem;
        this.prop = prop;

        if ( !options.orig )
            options.orig = {};
    }

});

jQuery.fx.prototype = {

    // Simple function for setting a style value
    update: function(){
        if ( this.options.step )
            this.options.step.call( this.elem, this.now, this );

        (jQuery.fx.step[this.prop] || jQuery.fx.step._default)( this );

        // Set display property to block for height/width animations
        if ( ( this.prop == "height" || this.prop == "width" ) && this.elem.style )
            this.elem.style.display = "block";
    },

    // Get the current size
    cur: function(force){
        if ( this.elem[this.prop] != null && (!this.elem.style || this.elem.style[this.prop] == null) )
            return this.elem[ this.prop ];

        var r = parseFloat(jQuery.css(this.elem, this.prop, force));
        return r && r > -10000 ? r : parseFloat(jQuery.curCSS(this.elem, this.prop)) || 0;
    },

    // Start an animation from one number to another
    custom: function(from, to, unit){
        this.startTime = now();
        this.start = from;
        this.end = to;
        this.unit = unit || this.unit || "px";
        this.now = this.start;
        this.pos = this.state = 0;

        var self = this;
        function t(gotoEnd){
            return self.step(gotoEnd);
        }

        t.elem = this.elem;

        jQuery.timers.push(t);

        if ( t() && jQuery.timerId == null ) {
            jQuery.timerId = setInterval(function(){
                var timers = jQuery.timers;

                for ( var i = 0; i < timers.length; i++ )
                    if ( !timers[i]() )
                        timers.splice(i--, 1);

                if ( !timers.length ) {
                    clearInterval( jQuery.timerId );
                    jQuery.timerId = null;
                }
            }, 13);
        }
    },

    // Simple 'show' function
    show: function(){
        // Remember where we started, so that we can go back to it later
        this.options.orig[this.prop] = jQuery.attr( this.elem.style, this.prop );
        this.options.show = true;

        // Begin the animation
        // Make sure that we start at a small width/height to avoid any
        // flash of content
        this.custom(this.prop == "width" || this.prop == "height" ? 1 : 0, this.cur());

        // Start by showing the element
        jQuery(this.elem).show();
    },

    // Simple 'hide' function
    hide: function(){
        // Remember where we started, so that we can go back to it later
        this.options.orig[this.prop] = jQuery.attr( this.elem.style, this.prop );
        this.options.hide = true;

        // Begin the animation
        this.custom(this.cur(), 0);
    },

    // Each step of an animation
    step: function(gotoEnd){
        var t = now();

        if ( gotoEnd || t >= this.options.duration + this.startTime ) {
            this.now = this.end;
            this.pos = this.state = 1;
            this.update();

            this.options.curAnim[ this.prop ] = true;

            var done = true;
            for ( var i in this.options.curAnim )
                if ( this.options.curAnim[i] !== true )
                    done = false;

            if ( done ) {
                if ( this.options.display != null ) {
                    // Reset the overflow
                    this.elem.style.overflow = this.options.overflow;

                    // Reset the display
                    this.elem.style.display = this.options.display;
                    if ( jQuery.css(this.elem, "display") == "none" )
                        this.elem.style.display = "block";
                }

                // Hide the element if the "hide" operation was done
                if ( this.options.hide )
                    jQuery(this.elem).hide();

                // Reset the properties, if the item has been hidden or shown
                if ( this.options.hide || this.options.show )
                    for ( var p in this.options.curAnim )
                        jQuery.attr(this.elem.style, p, this.options.orig[p]);
            }

            if ( done )
                // Execute the complete function
                this.options.complete.call( this.elem );

            return false;
        } else {
            var n = t - this.startTime;
            this.state = n / this.options.duration;

            // Perform the easing function, defaults to swing
            this.pos = jQuery.easing[this.options.easing || (jQuery.easing.swing ? "swing" : "linear")](this.state, n, 0, 1, this.options.duration);
            this.now = this.start + ((this.end - this.start) * this.pos);

            // Perform the next step of the animation
            this.update();
        }

        return true;
    }

};

jQuery.extend( jQuery.fx, {
    speeds:{
        slow: 600,
        fast: 200,
        // Default speed
        _default: 400
    },
    step: {

        opacity: function(fx){
            jQuery.attr(fx.elem.style, "opacity", fx.now);
        },

        _default: function(fx){
            if ( fx.elem.style && fx.elem.style[ fx.prop ] != null )
                fx.elem.style[ fx.prop ] = fx.now + fx.unit;
            else
                fx.elem[ fx.prop ] = fx.now;
        }
    }
});
if ( document.documentElement["getBoundingClientRect"] )
    jQuery.fn.offset = function() {
        if ( !this[0] ) return { top: 0, left: 0 };
        if ( this[0] === this[0].ownerDocument.body ) return jQuery.offset.bodyOffset( this[0] );
        var box  = this[0].getBoundingClientRect(), doc = this[0].ownerDocument, body = doc.body, docElem = doc.documentElement,
            clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
            top  = box.top  + (self.pageYOffset || jQuery.boxModel && docElem.scrollTop  || body.scrollTop ) - clientTop,
            left = box.left + (self.pageXOffset || jQuery.boxModel && docElem.scrollLeft || body.scrollLeft) - clientLeft;
        return { top: top, left: left };
    };
else 
    jQuery.fn.offset = function() {
        if ( !this[0] ) return { top: 0, left: 0 };
        if ( this[0] === this[0].ownerDocument.body ) return jQuery.offset.bodyOffset( this[0] );
        jQuery.offset.initialized || jQuery.offset.initialize();

        var elem = this[0], offsetParent = elem.offsetParent, prevOffsetParent = elem,
            doc = elem.ownerDocument, computedStyle, docElem = doc.documentElement,
            body = doc.body, defaultView = doc.defaultView,
            prevComputedStyle = defaultView.getComputedStyle(elem, null),
            top = elem.offsetTop, left = elem.offsetLeft;

        while ( (elem = elem.parentNode) && elem !== body && elem !== docElem ) {
            computedStyle = defaultView.getComputedStyle(elem, null);
            top -= elem.scrollTop, left -= elem.scrollLeft;
            if ( elem === offsetParent ) {
                top += elem.offsetTop, left += elem.offsetLeft;
                if ( jQuery.offset.doesNotAddBorder && !(jQuery.offset.doesAddBorderForTableAndCells && /^t(able|d|h)$/i.test(elem.tagName)) )
                    top  += parseInt( computedStyle.borderTopWidth,  10) || 0,
                    left += parseInt( computedStyle.borderLeftWidth, 10) || 0;
                prevOffsetParent = offsetParent, offsetParent = elem.offsetParent;
            }
            if ( jQuery.offset.subtractsBorderForOverflowNotVisible && computedStyle.overflow !== "visible" )
                top  += parseInt( computedStyle.borderTopWidth,  10) || 0,
                left += parseInt( computedStyle.borderLeftWidth, 10) || 0;
            prevComputedStyle = computedStyle;
        }

        if ( prevComputedStyle.position === "relative" || prevComputedStyle.position === "static" )
            top  += body.offsetTop,
            left += body.offsetLeft;

        if ( prevComputedStyle.position === "fixed" )
            top  += Math.max(docElem.scrollTop, body.scrollTop),
            left += Math.max(docElem.scrollLeft, body.scrollLeft);

        return { top: top, left: left };
    };

jQuery.offset = {
    initialize: function() {
        if ( this.initialized ) return;
        var body = document.body, container = document.createElement('div'), innerDiv, checkDiv, table, td, rules, prop, bodyMarginTop = body.style.marginTop,
            html = '<div style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;"><div></div></div><table style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;"cellpadding="0"cellspacing="0"><tr><td></td></tr></table>';

        rules = { position: 'absolute', top: 0, left: 0, margin: 0, border: 0, width: '1px', height: '1px', visibility: 'hidden' };
        for ( prop in rules ) container.style[prop] = rules[prop];

        container.innerHTML = html;
        body.insertBefore(container, body.firstChild);
        innerDiv = container.firstChild, checkDiv = innerDiv.firstChild, td = innerDiv.nextSibling.firstChild.firstChild;

        this.doesNotAddBorder = (checkDiv.offsetTop !== 5);
        this.doesAddBorderForTableAndCells = (td.offsetTop === 5);

        innerDiv.style.overflow = 'hidden', innerDiv.style.position = 'relative';
        this.subtractsBorderForOverflowNotVisible = (checkDiv.offsetTop === -5);

        body.style.marginTop = '1px';
        this.doesNotIncludeMarginInBodyOffset = (body.offsetTop === 0);
        body.style.marginTop = bodyMarginTop;

        body.removeChild(container);
        this.initialized = true;
    },

    bodyOffset: function(body) {
        jQuery.offset.initialized || jQuery.offset.initialize();
        var top = body.offsetTop, left = body.offsetLeft;
        if ( jQuery.offset.doesNotIncludeMarginInBodyOffset )
            top  += parseInt( jQuery.curCSS(body, 'marginTop',  true), 10 ) || 0,
            left += parseInt( jQuery.curCSS(body, 'marginLeft', true), 10 ) || 0;
        return { top: top, left: left };
    }
};


jQuery.fn.extend({
    position: function() {
        var left = 0, top = 0, results;

        if ( this[0] ) {
            // Get *real* offsetParent
            var offsetParent = this.offsetParent(),

            // Get correct offsets
            offset       = this.offset(),
            parentOffset = /^body|html$/i.test(offsetParent[0].tagName) ? { top: 0, left: 0 } : offsetParent.offset();

            // Subtract element margins
            // note: when an element has margin: auto the offsetLeft and marginLeft 
            // are the same in Safari causing offset.left to incorrectly be 0
            offset.top  -= num( this, 'marginTop'  );
            offset.left -= num( this, 'marginLeft' );

            // Add offsetParent borders
            parentOffset.top  += num( offsetParent, 'borderTopWidth'  );
            parentOffset.left += num( offsetParent, 'borderLeftWidth' );

            // Subtract the two offsets
            results = {
                top:  offset.top  - parentOffset.top,
                left: offset.left - parentOffset.left
            };
        }

        return results;
    },

    offsetParent: function() {
        var offsetParent = this[0].offsetParent || document.body;
        while ( offsetParent && (!/^body|html$/i.test(offsetParent.tagName) && jQuery.css(offsetParent, 'position') == 'static') )
            offsetParent = offsetParent.offsetParent;
        return jQuery(offsetParent);
    }
});


// Create scrollLeft and scrollTop methods
jQuery.each( ['Left', 'Top'], function(i, name) {
    var method = 'scroll' + name;
    
    jQuery.fn[ method ] = function(val) {
        if (!this[0]) return null;

        return val !== undefined ?

            // Set the scroll offset
            this.each(function() {
                this == window || this == document ?
                    window.scrollTo(
                        !i ? val : jQuery(window).scrollLeft(),
                         i ? val : jQuery(window).scrollTop()
                    ) :
                    this[ method ] = val;
            }) :

            // Return the scroll offset
            this[0] == window || this[0] == document ?
                self[ i ? 'pageYOffset' : 'pageXOffset' ] ||
                    jQuery.boxModel && document.documentElement[ method ] ||
                    document.body[ method ] :
                this[0][ method ];
    };
});
// Create innerHeight, innerWidth, outerHeight and outerWidth methods
jQuery.each([ "Height", "Width" ], function(i, name){

    var tl = i ? "Left"  : "Top",  // top or left
        br = i ? "Right" : "Bottom"; // bottom or right

    // innerHeight and innerWidth
    jQuery.fn["inner" + name] = function(){
        return this[ name.toLowerCase() ]() +
            num(this, "padding" + tl) +
            num(this, "padding" + br);
    };

    // outerHeight and outerWidth
    jQuery.fn["outer" + name] = function(margin) {
        return this["inner" + name]() +
            num(this, "border" + tl + "Width") +
            num(this, "border" + br + "Width") +
            (margin ?
                num(this, "margin" + tl) + num(this, "margin" + br) : 0);
    };
    
    var type = name.toLowerCase();

    jQuery.fn[ type ] = function( size ) {
        // Get window width or height
        return this[0] == window ?
            // Everyone else use document.documentElement or document.body depending on Quirks vs Standards mode
            document.compatMode == "CSS1Compat" && document.documentElement[ "client" + name ] ||
            document.body[ "client" + name ] :

            // Get document width or height
            this[0] == document ?
                // Either scroll[Width/Height] or offset[Width/Height], whichever is greater
                Math.max(
                    document.documentElement["client" + name],
                    document.body["scroll" + name], document.documentElement["scroll" + name],
                    document.body["offset" + name], document.documentElement["offset" + name]
                ) :

                // Get or set width or height on the element
                size === undefined ?
                    // Get width or height on the element
                    (this.length ? jQuery.css( this[0], type ) : null) :

                    // Set the width or height on the element (default to pixels if value is unitless)
                    this.css( type, typeof size === "string" ? size : size + "px" );
    };

});})();