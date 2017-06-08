/**
 * Convert HTML string to AST
 *
 * @param {String} html
 * @return {Object}
 */

// 将HTML转换为AST对象

export function parse (html) {
  let root
  let currentParent
  let stack = []
  // function HTMLParser(html, handler)
  HTMLParser(html, {
    html5: true,
    // 遇到起始标签时创建元素
    start (tag, attrs, unary) {
      let element = {
        tag,
        attrs,
        attrsMap: makeAttrsMap(attrs),
        parent: currentParent,
        children: []
      }
      // 如果没有根节点，这个元素就是根节点
      if (!root) {
        root = element
      }
      // 如果当前有父元素，就放入父元素中
      if (currentParent) {
        currentParent.children.push(element)
      }
      // 如果不是一元标签，说明其下是可能存在子节点的，放在栈顶
      // 如果是一元标签，其下不会有子节点
      if (!unary) {
        currentParent = element
        stack.push(element)
      }
    },
    end () {
      // 标签闭合，将栈顶元素弹出，后续操作将在下一个元素上进行
      stack.length -= 1
      currentParent = stack[stack.length - 1]
    },
    chars (text) {
      // 对plain text进行处理，如果text在pre标签下，就直接返回text。
      // 如果text没用实质字符，就留空
      text = currentParent.tag === 'pre'
        ? text
        : text.trim() ? text : ' '
      // 处理完之后放入当前父节点
      currentParent.children.push(text)
    },
    comment () {
      // 是否保留注释
      // noop
    }
  })
  // 返回根节点
  return root
}

// 将属性的对象数组转化为对象
// input: [{name: key1, value: value1}, {name: key2, value: value2}]
// output: {key1: value1, key2: value2}
function makeAttrsMap (attrs) {
  const map = {}
  for (let i = 0, l = attrs.length; i < l; i++) {
    map[attrs[i].name] = attrs[i].value
  }
  return map
}

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */

/*
 * // Use like so:
 * HTMLParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 */

/* global ActiveXObject, DOMDocument */

// 返回一个函数，函数接受一个value，并检测它（的小写）是否在values之中
function makeMap(values) {
  values = values.split(/,/)
  var map = {}
  values.forEach(function(value) {
    map[value] = 1
  })
  return function(value) {
    return map[value.toLowerCase()] === 1
  }
}

// Regular Expressions for parsing tags and attributes
// 标签和属性的正则表达式

// 属性标识符
// []中的^代表取反，所以这里是一个匹配所有【不是】空白和操作符的pattern
var singleAttrIdentifier = /([^\s"'<>\/=]+)/,
// 赋值符
    singleAttrAssign = /=/,
// [/=/] ????
    singleAttrAssigns = [singleAttrAssign],
// reg.source => 正则表达式的文本（//里面的部分）
    singleAttrValues = [
// 要匹配()的话需要加\来转义，所以这里括号起到的是一个子pattern的作用
// 括号内：任意多个(>=0)[^"]非双引号的字符
// 即一个匹配双引号的模式
      // attr value double quotes
      /"([^"]*)"+/.source,
// 同上，匹配单引号
      // attr value, single quotes
      /'([^']*)'+/.source,
// 同singleAttrIdentifier，所有非空白和操作符的内容
      // attr value, no quotes
      /([^\s"'=<>`]+)/.source
    ],
    qnameCapture = (function() {
      // could use https://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-QName
      // but for Vue templates we can enforce a simple charset
      // 变量名必须以字母或下划线开头，后面可以跟任意多个字符（包括0-9）、-、.（隶属于对象）
      var ncname = '[a-zA-Z_][\\w\\-\\.]*'
      // ((?:[a-zA-z_][\w\-\.]\:)?[a-zA-z_][\w\-\.])
      // 所以就是匹配变量名，如果是name1:name2的形式的话，只获取后面的那个name2
      return '((?:' + ncname + '\\:)?' + ncname + ')'
    })(),
    // 匹配起始标签的<tag
    startTagOpen = new RegExp('^<' + qnameCapture),
    // 匹配起始标签的>，前面可以有空白。也可以是/>，这种情况应该是<img src="xxx" />的形式。不会因为/而匹配到闭合标签，因为闭合标签是</xxx>的形式，/和>中间是有字符的
    startTagClose = /^\s*(\/?)>/,
    // ^<\/name[^>]*>  
    // </name>，>之前不能有其他的>
    endTag = new RegExp('^<\\/' + qnameCapture + '[^>]*>'),
    // <!DOCTYPE 开头，加上多于一个非>的字符，加上>
    doctype = /^<!DOCTYPE [^>]+>/i


var IS_REGEX_CAPTURING_BROKEN = false
// replace的第二个参数接受一个replacer函数
// replacer(match, p1, p2,..., offset, string)
// match: 匹配的子字符串
// p1, p2: 正则表达式中第n个括号匹配到的字符串
// offset： 匹配的子字符串在父字符串中的偏移位置
// string：原字符串
// 对于replace来说，若第一个单数是正则表达式且有g参数，则每次替换都会调用replacer函数
'x'.replace(/x(.)?/g, function(m, g) {
  IS_REGEX_CAPTURING_BROKEN = g === ''
})

// Empty Elements
// 空元素检测函数
var empty = makeMap('area,base,basefont,br,col,embed,frame,hr,img,input,isindex,keygen,link,meta,param,source,track,wbr')

// Inline Elements
// 内联元素
var inline = makeMap('a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,noscript,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,svg,textarea,tt,u,var')

// Elements that you can, intentionally, leave open
// (and which close themselves)
// 可以不闭合的元素
var closeSelf = makeMap('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source')

// Attributes that have their values filled in disabled='disabled'
// 不需要进行赋值操作的属性
var fillAttrs = makeMap('checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected')

// Special Elements (can contain anything)
// 特殊元素
var special = makeMap('script,style')

// HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
// Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
// 非短语元素
// 短语元素：能被放在一个段落中的元素，如<a>、<img>等
// 而<article><h1><h2>这些不能被放在一个段落中，就不是短语元素
var nonPhrasing = makeMap('address,article,aside,base,blockquote,body,caption,col,colgroup,dd,details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,title,tr,track')

var reCache = {}

function attrForHandler(handler) {
  // ^\s*([^\s"'<>\/=]+)(?:\s*((?:=))\s*( ?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+) )?
  //     标识符                  赋值符                 值：("" | '' | 字符)
  // 开头可以有空白，匹配  标识符=值  的形式，(参数)可以没有，捕获标识符
  var pattern = singleAttrIdentifier.source +
                '(?:\\s*(' + joinSingleAttrAssigns(handler) + ')' +
                '\\s*(?:' + singleAttrValues.join('|') + '))?'
  return new RegExp('^\\s*' + pattern)
}

// 整合赋值符的正则表达式
// 然而这个handler有啥用。。。
function joinSingleAttrAssigns(handler) {
  return singleAttrAssigns.map(function(assign) {
    return '(?:' + assign.source + ')'
  }).join('|')
}

export default function HTMLParser(html, handler) {
  var stack = [], lastTag
  // 不知道handler到底是干嘛的...反正attribute是个key=value的匹配模式
  var attribute = attrForHandler(handler)
  var last, prevTag, nextTag
  while (html) {
    last = html
    // Make sure we're not in a script or style element
    if (!lastTag || !special(lastTag)) {
      // 找到<的位置
      var textEnd = html.indexOf('<')
      // 如果<在0处，说明此处是某个元素的开始
      if (textEnd === 0) {
        // 处理注释的情况
        // Comment:
        // 若以<!--开头，说明是注释
        if (/^<!--/.test(html)) {
          // 找到注释的末端位置
          var commentEnd = html.indexOf('-->')

          if (commentEnd >= 0) {
            if (handler.comment) {
              // 如果handler存在对注释的配置选项就进行配置
              handler.comment(html.substring(4, commentEnd))
            }
            // 从html中去掉注释的部分，重新开始循环
            html = html.substring(commentEnd + 3)
            prevTag = ''
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        // 处理<![if IE]>等情况
        // 类似上面的处理注释，直接去掉
        if (/^<!\[/.test(html)) {
          var conditionalEnd = html.indexOf(']>')

          if (conditionalEnd >= 0) {
            if (handler.comment) {
              handler.comment(html.substring(2, conditionalEnd + 1), true /* non-standard */)
            }
            html = html.substring(conditionalEnd + 2)
            prevTag = ''
            continue
          }
        }

        // Doctype:
        // 处理doctype
        // string.match()会返回所有对应的匹配结果，如果没有就是null
        // 所以如果当前<属于doctype的话就会进入判断，从html中去掉doctype
        var doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
          if (handler.doctype) {
            handler.doctype(doctypeMatch[0])
          }
          html = html.substring(doctypeMatch[0].length)
          prevTag = ''
          continue
        }

        // End tag:
        // 如果当前<的字符串是个闭合标签
        // 这里这个endTagMatch如果存在，那么会是一个数组，数组第一位存储endTag的匹配结果，第二位存储endTag中的子捕获组的存储结果
        // 要注意的是这个子捕获组并不是(?:ncname\:)的结果，而是((?:ncname\:)?ncname)的匹配结果，原因是()是一个真正的子捕获组，而(?:)只会进行匹配不会进行捕获
        // 如</span>进行match操作，得到的结果是
        // ["</span>", "span"]
        var endTagMatch = html.match(endTag)
        if (endTagMatch) {
          // 首先从html中去掉
          html = html.substring(endTagMatch[0].length)
          // 将endTag进行转换,并parse
          endTagMatch[0].replace(endTag, parseEndTag)
          prevTag = '/' + endTagMatch[1].toLowerCase()
          continue
        }

        // Start tag:
        // 剩余情况便是起始标签，进行parse
        var startTagMatch = parseStartTag(html)
        if (startTagMatch) {
          // 去掉起始标签
          html = startTagMatch.rest
          // 对起始标签的数据进行处理
          handleStartTag(startTagMatch)
          prevTag = startTagMatch.tagName.toLowerCase()
          continue
        }
      }

      var text
      // 若<存在且并不在开始处，说明现在要处理的是plain text
      if (textEnd >= 0) {
        // 把plain text截取出来
        text = html.substring(0, textEnd)
        html = html.substring(textEnd)
      }
      else {
      // 如果<不存在，说明已经没有标签了，html全都是plain text
        text = html
        html = ''
      }

      // next tag
      // 寻找下一个起始标签
      var nextTagMatch = parseStartTag(html)
      if (nextTagMatch) {
        nextTag = nextTagMatch.tagName
      }
      // 如果没有找到
      else {
        // 寻找是否存在下一个闭合标签
        nextTagMatch = html.match(endTag)
        if (nextTagMatch) {
          nextTag = '/' + nextTagMatch[1]
        }
        // 如果没有找到，nextTag为空
        else {
          nextTag = ''
        }
      }

      if (handler.chars) {
        handler.chars(text, prevTag, nextTag)
      }
      prevTag = ''

    }
    // 如果现在在特殊标签中
    else {
      var stackedTag = lastTag.toLowerCase()
      // /([\s\S]*?)</stackTag[^>]*>/i
      // ?跟在重复修饰符后面代表非贪心量化，会尽可能少的进行匹配
      // 也就是说这个的子捕获组会捕获闭合标签的前一个字符？...

      var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)</' + stackedTag + '[^>]*>', 'i'))

      html = html.replace(reStackedTag, function(all, text) {
        if (stackedTag !== 'script' && stackedTag !== 'style' && stackedTag !== 'noscript') {
          // 你在抓梦jo啊，不是只有lastTag存在且lastTag为spceial tag的时候才会进来这里的吗？？？
          text = text
            .replace(/<!--([\s\S]*?)-->/g, '$1')
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        }

        if (handler.chars) {
          handler.chars(text)
        }

        return ''
      })

      parseEndTag('</' + stackedTag + '>', stackedTag)
    }

    if (html === last) {
      throw new Error('Parse Error: ' + html)
    }
  }

  if (!handler.partialMarkup) {
    // Clean up any remaining tags
    parseEndTag()
  }

  function parseStartTag(input) {
    // ^<((?:[a-zA-z_][\w\-\.]\:)?[a-zA-z_][\w\-\.])
    // 捕获结果为<tag，子捕获组结果为tag
    var start = input.match(startTagOpen)
    if (start) {
      var match = {
        tagName: start[1],
        attrs: []
      }
      // 截出<tag
      input = input.slice(start[0].length)
      var end, attr
      // 当前并非>且匹配属性时，存储属性继续循环，直到当前为>或不匹配属性
      while (!(end = input.match(startTagClose)) && (attr = input.match(attribute))) {
        input = input.slice(attr[0].length)
        match.attrs.push(attr)
      }
      // startTagClose的$1为/>中的/，如果存在就会存入match的unarySlash属性，将截掉>的剩余部分存入match的rest
      if (end) {
        match.unarySlash = end[1]
        match.rest = input.slice(end[0].length)
        return match
      }
    }
  }

  function handleStartTag(match) {
    // 对startTag进行拆解，将结果放入stack
    var tagName = match.tagName
    var unarySlash = match.unarySlash

    if (handler.html5 && lastTag === 'p' && nonPhrasing(tagName)) {
      parseEndTag('', lastTag)
    }

    if (!handler.html5) {
      while (lastTag && inline(lastTag)) {
        parseEndTag('', lastTag)
      }
    }

    if (closeSelf(tagName) && lastTag === tagName) {
      parseEndTag('', tagName)
    }

    // 是否为一元？
    var unary = empty(tagName) || tagName === 'html' && lastTag === 'head' || !!unarySlash

    // ^\s*([^\s"'<>\/=]+)(?:\s*((?:=))\s*( ?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+) )?
    // $0 整个匹配属性
    // $1 key
    // $2 =
    // $3 "value"
    // $4 'value'
    // $5 value
    var attrs = match.attrs.map(function(args) {
      // hackish work around FF bug https://bugzilla.mozilla.org/show_bug.cgi?id=369778
      if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
        if (args[3] === '') { delete args[3] }
        if (args[4] === '') { delete args[4] }
        if (args[5] === '') { delete args[5] }
      }
      return {
        name: args[1],
        // 通常来说值应当是被引号包裹的
        // 如果没有被引号包裹，应当属于fillattr，即checked = checked
        // 其他情况说明值不合法，value为空
        value: args[3] || args[4] || (args[5] && fillAttrs(args[5]) ? name : '')
      }
    })

    // 将tag和attrs放入stack用
    if (!unary) {
      stack.push({ tag: tagName, attrs: attrs })
      lastTag = tagName
      unarySlash = ''
    }

    if (handler.start) {
      handler.start(tagName, attrs, unary, unarySlash)
    }
  }

  // 这个应该是配合handler进行配置的？
  function parseEndTag(tag, tagName) {
    var pos

    // Find the closest opened tag of the same type
    // 从stack中找到一样的tag
    if (tagName) {
      var needle = tagName.toLowerCase()
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].tag.toLowerCase() === needle) {
          break
        }
      }
    }
    // If no tag name is provided, clean shop
    else {
      pos = 0
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (var i = stack.length - 1; i >= pos; i--) {
        if (handler.end) {
          handler.end(stack[i].tag, stack[i].attrs, i > pos || !tag)
        }
      }

      // Remove the open elements from the stack
      stack.length = pos
      lastTag = pos && stack[pos - 1].tag
    }
    else if (tagName.toLowerCase() === 'br') {
      if (handler.start) {
        handler.start(tagName, [], true, '')
      }
    }
    else if (tagName.toLowerCase() === 'p') {
      if (handler.start) {
        handler.start(tagName, [], false, '', true)
      }
      if (handler.end) {
        handler.end(tagName, [])
      }
    }
  }
}
