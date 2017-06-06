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
    // 遍历data选项，对每个选项执行_.proxy()
    Object.keys(options.data).forEach(key => this._proxy(key))
    // 如果methods选项存在，就遍历methods，将method: fn绑定到this上，this[method] = fn.bind(this)
    if (options.methods) {
      Object.keys(options.methods).forEach(key => {
        this[key] = options.methods[key].bind(this)
      })
    }
    // 应该是监视data改动？
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

  _proxy (key) {
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
