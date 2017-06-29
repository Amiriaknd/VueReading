import { compile } from '../compiler/index'
import { observe } from '../observer/index'
import Watcher from '../observer/watcher'
import { h, patch } from '../vdom/index'
import { nextTick, isReserved, getOuterHTML } from '../util/index'

export default class Component {
  constructor (options) {
    // 为options和data起一个不易混淆的名字
    this.$options = options
    this._data = options.data

    // options.el也就是Vue初始化的时候配置的el，这里是找到这个元素
    const el = this._el = document.querySelector(options.el)
    // 首先取得el的outerHTML字符串
    // 编译取得的outerHTML？
    const render = compile(getOuterHTML(el))

    // 初始化el的HTML内容
    this._el.innerHTML = ''
    // 遍历data选项，将data的属性加入this._data中
    Object.keys(options.data).forEach(key => this._proxy(key))
    // 如果methods选项存在，就遍历methods，将method: fn绑定到this上，this[method] = fn.bind(this)
    if (options.methods) {
      Object.keys(options.methods).forEach(key => {
        this[key] = options.methods[key].bind(this)
      })
    }
    // observe option的data，返回的observer对象给_ob
    this._ob = observe(options.data)
    // 比较懵比，搁置
    this._watchers = []
    this._watcher = new Watcher(this, render, this._update)
    this._update(this._watcher.value)
  }

  _update (vtree) {
    if (!this._tree) {
      patch(this._el, vtree)
    } else {
      patch(this._tree, vtree)
    }
    this._tree = vtree
  }

// 接受动态class和静态class
// 不知道第一版的vue中的:class标准是怎样的
// 从这里看的话好像是只接受Object？
// 如果dynamic是对象的话会返回所有值为true的key，对比{'red': isRed}，没问题。（不过这样是不会动态刷新的吧？）
// 如果dynamic是数组的话返回的就是"0 1 2"这样的索引了啊喂没问题吗
  _renderClass (dynamic, cls) {
    dynamic = dynamic
      ? typeof dynamic === 'string'
        ? dynamic
        : Object.keys(dynamic).filter(key => dynamic[key]).join(' ')
      : ''
    return cls
      ? cls + (dynamic ? ' ' + dynamic : '')
      : dynamic
  }

// 展开数组，只展开到第二层，不过似乎够用了？
// 因为子节点如果有children，那么这个chidlren一定也会调用flatten，也就是说children一定是一个一元数组
// 因此只要展开两层就够用了
  __flatten__ (arr) {
    var res = []
    for (var i = 0, l = arr.length; i < l; i++) {
      var e = arr[i]
      if (Array.isArray(e)) {
        for (var j = 0, k = e.length; j < k; j++) {
          if (e[j]) {
            res.push(e[j])
          }
        }
      } else if (e) {
        res.push(e)
      }
    }
    return res
  }

// 将key加入this._data对象中
  _proxy (key) {
    // isReserved 是否以_或$开头
    if (!isReserved(key)) {
      // need to store ref to self here
      // because these getter/setters might
      // be called by child scopes via
      // prototype inheritance.
      var self = this
      Object.defineProperty(self, key, {
        configurable: true,
        enumerable: true,
        get: function proxyGetter () {
          return self._data[key]
        },
        set: function proxySetter (val) {
          self._data[key] = val
        }
      })
    }
  }
}

Component.prototype.__h__ = h
Component.nextTick = nextTick
