import { parseText } from './text-parser'

const bindRE = /^:|^v-bind:/
const onRE = /^@|^v-on:/
const mustUsePropsRE = /^(value|selected|checked|muted)$/

// 依赖于外部的
// __h__()
// _renderClass()
// __flatten__()
export function generate (ast) {
  const code = genElement(ast)
  // with使得在模板字符串中插值不需要加this.，直接用变量名就可以了
  return new Function (`with (this) { return ${code}}`)
}

function genElement (el, key) {
  let exp
  if (exp = getAttr(el, 'v-for')) {
    return genFor(el, exp)
  } else if (exp = getAttr(el, 'v-if')) {
    return genIf(el, exp)
  } else if (el.tag === 'template') {
    return genChildren(el)
  } else {
    return `__h__('${ el.tag }', ${ genData(el, key) }, ${ genChildren(el) })`
  }
}

function genIf (el, exp) {
  return `(${ exp }) ? ${ genElement(el) } : ''`
}

function genFor (el, exp) {
  //                      标识符-变量名  空白字符  in|of 空白 任意多个任意非\n的字符-列表对象
  const inMatch = exp.match(/([a-zA-Z_][\w]*)\s+(?:in|of)\s+(.*)/)
  if (!inMatch) {
    throw new Error('Invalid v-for expression: '+ exp)
  }
  // inMatch[1]是匹配的变量名，[2]是匹配的值
  const alias = inMatch[1].trim()
  exp = inMatch[2].trim()
  const key = el.attrsMap['track-by'] || 'undefined'
  // 返回语句
  // 遍历列表对象，遍历函数接受alias和$index，返回生成的元素
  return `(${ exp }).map(function (${ alias }, $index) {return ${ genElement(el, key) }})`
}

// 将元素的属性转换为data
function genData (el, key) {
  if (!el.attrs.length) {
    return '{}'
  }
  let data = key ? `{key:${ key },` : `{`
  if (el.attrsMap[':class'] || el.attrsMap['class']) {
    data += `class: _renderClass(${ el.attrsMap[':class'] }, "${ el.attrsMap['class'] || '' }"),`
  }
  let attrs = `attrs:{`
  let props = `props:{`
  let hasAttrs = false
  let hasProps = false
  for (let i = 0, l = el.attrs.length; i < l; i++) {
    let attr = el.attrs[i]
    let name = attr.name
    // 对于v-bind属性，先去掉冒号，然后将name和value放入插值表达式，但是不是很明白为这个props相比其他的attrs有什么特别之处
    if (bindRE.test(name)) {
      name = name.replace(bindRE, '')
      if (name === 'class') {
        continue
      } else if (name === 'style') {
        data += `style: ${ attr.value },`
      } else if (mustUsePropsRE.test(name)) {
        hasProps = true
        props += `"${ name }": (${ attr.value }),`
      } else {
        hasAttrs = true
        attrs += `"${ name }": (${ attr.value }),`
      }
      // 对于v-on属性
      // ...这个版本居然还没有做
    } else if (onRE.test(name)) {
      name = name.replace(onRE, '')
      // TODO
      // 对于其他非class的属性，插入attrs
    } else if (name !== 'class') {
      hasAttrs = true
      attrs += `"${ name }": (${ JSON.stringify(attr.value) }),`
    }
  }
  // 将attrs和props的最后一个字符改为}，加入data
  // 改最后一个字符因为是,
  if (hasAttrs) {
    data += attrs.slice(0, -1) + '},'
  }
  if (hasProps) {
    data += props.slice(0, -1) + '},'
  }
  // 然后把结尾的,改成}
  return data.replace(/,$/, '') + '}'
}

function genChildren (el) {
  if (!el.children.length) {
    return 'undefined'
  }
  // 遍历子节点，然后展开它
  return '__flatten__([' + el.children.map(genNode).join(',') + '])'
}

// 如果子节点是元素，就调用genElement，如果是文本就调用genText
function genNode (node) {
  if (node.tag) {
    return genElement(node)
  } else {
    return genText(node)
  }
}

function genText (text) {
  if (text === ' ') {
    return '" "'
  } else {
    const exp = parseText(text)
    if (exp) {
      // String("this is a "+(name)+" text")
      return 'String(' + escapeNewlines(exp) + ')'
    } else {
      return escapeNewlines(JSON.stringify(text))
    }
  }
}

function escapeNewlines (str) {
  // 转义文本的换行符
  return str.replace(/\n/g, '\\n')
}

// 返回attr对应的值，并从元素的attrsMap和attrs属性中将attr去除
function getAttr (el, attr) {
  let val
  if (val = el.attrsMap[attr]) {
    el.attrsMap[attr] = null
    for (let i = 0, l = el.attrs.length; i < l; i++) {
      if (el.attrs[i].name === attr) {
        el.attrs.splice(i, 1)
        break
      }
    }
  }
  return val
}
