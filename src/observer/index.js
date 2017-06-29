import Dep from './dep'
import { arrayMethods } from './array'
import {
  def,
  isArray,
  isPlainObject,
  hasProto,
  hasOwn
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However in certain cases, e.g.
 * v-for scope alias and props, we don't want to force conversion
 * because the value may be a nested value under a frozen data structure.
 *
 * So whenever we want to set a reactive property without forcing
 * conversion on the new value, we wrap that call inside this function.
 */
// 在某些情况下新值不需要被追踪
let shouldConvert = true
export function withoutConversion (fn) {
  shouldConvert = false
  fn()
  shouldConvert = true
}

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 *
 * @param {Array|Object} value
 * @constructor
 */


export function Observer (value) {
  this.value = value
  this.dep = new Dep()
  // 把当前观察者添加到value上
  def(value, '__ob__', this)
  if (isArray(value)) {
    // 
    var augment = hasProto
      ? protoAugment
      : copyAugment
    // 将重写过的数组方法覆盖到value数组上，这些方法不会被枚举出来
    augment(value, arrayMethods, arrayKeys)
    this.observeArray(value)
  } else {
    this.walk(value)
  }
}

// Instance methods

/**
 * Walk through each property and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 *
 * @param {Object} obj
 */
// 对于对象，遍历所有属性，将它们转换为有getter和setter的版本
Observer.prototype.walk = function (obj) {
  var keys = Object.keys(obj)
  for (var i = 0, l = keys.length; i < l; i++) {
    this.convert(keys[i], obj[keys[i]])
  }
}

/**
 * Observe a list of Array items.
 *
 * @param {Array} items
 */
// 对于数组，分别为每一个元素添加观察者
Observer.prototype.observeArray = function (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i])
  }
}

/**
 * Convert a property into getter/setter so we can emit
 * the events when the property is accessed/changed.
 *
 * @param {String} key
 * @param {*} val
 */
// 为一个属性设置getter和setter，当属性值变动的时候就可以触发事件
Observer.prototype.convert = function (key, val) {
  defineReactive(this.value, key, val)
}

/**
 * Add an owner vm, so that when $set/$delete mutations
 * happen we can notify owner vms to proxy the keys and
 * digest the watchers. This is only called when the object
 * is observed as an instance's root $data.
 *
 * @param {Vue} vm
 */

Observer.prototype.addVm = function (vm) {
  (this.vms || (this.vms = [])).push(vm)
}

/**
 * Remove an owner vm. This is called when the object is
 * swapped out as an instance's $data object.
 *
 * @param {Vue} vm
 */

Observer.prototype.removeVm = function (vm) {
  this.vms.$remove(vm)
}

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 *
 * @param {Object|Array} target
 * @param {Object} src
 */
// 通过proto为target添加属性
function protoAugment (target, src) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 *
 * @param {Object|Array} target
 * @param {Object} proto
 */
// 为target定义隐藏属性，不会被枚举

function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 *
 * @param {*} value
 * @param {Vue} [vm]
 * @return {Observer|undefined}
 * @static
 */
// 为value创建一个observer实例
// 会返回新的observer,如果value已经有了的话就返回已经有的
// 若value不是一个引用对象，就会返回undefined

export function observe (value, vm) {
  // value必须是一个对象
  if (!value || typeof value !== 'object') {
    return
  }
  var ob
  // 已经有ob的情况
  if (
    hasOwn(value, '__ob__') &&
    value.__ob__ instanceof Observer
  ) {
    ob = value.__ob__
  } else if (
    // shouldConvert情况下
    // value确认是引用对象且不是Vue对象，才会添加ob
    shouldConvert &&
    (isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (ob && vm) {
    ob.addVm(vm)
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {*} val
 */

export function defineReactive (obj, key, val) {
  var dep = new Dep()

  // 忽略不可配置的属性
  var property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get
  var setter = property && property.set

  var childOb = observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
        }
        if (isArray(value)) {
          for (var e, i = 0, l = value.length; i < l; i++) {
            e = value[i]
            e && e.__ob__ && e.__ob__.dep.depend()
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val
      if (newVal === value) {
        return
      }
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = observe(newVal)
      dep.notify()
    }
  })
}
