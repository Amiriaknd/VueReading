let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 *
 * @constructor
 */
 // dep是一个可以有多个订阅者的观察者对象

export default function Dep () {
  this.id = uid++
  this.subs = []
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
// target是当前被watcher评估的目标
// 任意时刻只能有一个target
Dep.target = null

/**
 * Add a directive subscriber.
 *
 * @param {Directive} sub
 */
// 增加订阅者
Dep.prototype.addSub = function (sub) {
  this.subs.push(sub)
}

/**
 * Remove a directive subscriber.
 *
 * @param {Directive} sub
 */
// 移除订阅者
Dep.prototype.removeSub = function (sub) {
  this.subs.$remove(sub)
}

/**
 * Add self as a dependency to the target watcher.
 */
// 为目标观测者添加依赖
Dep.prototype.depend = function () {
  Dep.target.addDep(this)
}

/**
 * Notify all subscribers of a new value.
 */
// 把新值通知给所有的订阅者
Dep.prototype.notify = function () {
  // stablize the subscriber list first
  var subs = this.subs.slice()
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update()
  }
}
