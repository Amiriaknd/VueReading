// 匹配任意{{}}的字符串，捕获里面的表达式部分
const tagRE = /\{\{((?:.|\\n)+?)\}\}/g

// parse文本，为{{}}里面的值加上括号，用+将内外的文本拼成一个字符串返回
// "this is a {{ name }} text" => '"this is a "+(name)+" text"'
export function parseText (text) {
  // 如果没有插值，就返回null
  if (!tagRE.test(text)) {
    return null
  }
  var tokens = []
  // 重置匹配
  var lastIndex = tagRE.lastIndex = 0
  var match, index, value
  // 循环匹配{{}}，{{}}内的加上括号放入tokens，外部直接放入tokens
  /* eslint-disable no-cond-assign */
  while (match = tagRE.exec(text)) {
  /* eslint-enable no-cond-assign */
    index = match.index
    // push text token
    if (index > lastIndex) {
      // JSON.stringify会再添加一对引号
      tokens.push(JSON.stringify(text.slice(lastIndex, index)))
    }
    // tag token
    value = match[1]
    tokens.push('(' + match[1].trim() + ')')
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) {
    tokens.push(JSON.stringify(text.slice(lastIndex)))
  }
  return tokens.join('+')
}
