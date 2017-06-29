import { parse } from './html-parser'
import { generate } from './codegen'

// 创建一个干净的、原型链上不存在任何父对象的对象。
// 普通的{}的constructor是Object，它继承Object.prototype的所有方法，相当于Object.create(Object.prototype)
// 而Object.create(null)创建的对象的constructor是null，没有Object原生的方法
// var p1 = {}, p2 = Object.create(null);
// p1.toString;   //  function() {...}
// p2.toString;   //  undefined

const cache = Object.create(null)

// 编译html，并复用已经编译过的结果
export function compile (html) {
  html = html.trim()
  // 倘若是第一次编译html，hit会是undefined，会执行generate进行编译并保存进cache
  // 若hit存在，说明已经编译过了，直接复用
  // 保存的值是一个函数，函数会返回渲染html需要的信息
  const hit = cache[html]
  return hit || (cache[html] = generate(parse(html)))
}
