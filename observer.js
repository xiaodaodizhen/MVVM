// 数据劫持

class Observer {
    constructor(data) {
        this.observer(data);
    }
    observer(data) {
        // 要对这个data数据将原有的属性改为set和get的形式
        // 不需要劫持的情况
        if (!data || typeof data != "object") {
            return;
        }

        // 要将数据一一劫持  先获取data的key 和value          Object.keys(data) 出来数据["message"]
        Object.keys(data).forEach(key => {
            // 劫持
            this.defineReactive(data, key, data[key]);
            // 深度劫持,递归
            this.observer(data[key]);
        });

    }
    // 定义劫持（定义响应式）
    defineReactive(obj, key, value) {
        let that = this;

        let dep = new Dep();// 每个变化的数据都会对应一个数组，这个数组是存放所有更新的操作的
        // 在获取某个指的时候，进行其他操作
        Object.defineProperty(obj, key, {
            enumerable: true,//可枚举，在for 循环中能循环出此属性
            configurable: true,
            get() {// 当取值时调用的方法
                // 其中可以做一些需要的业务逻辑
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set(newValue) {// 当给data属性设置值的时候，更改获取的属性值
                // 其中可以做一些需要的业务逻辑
                if (newValue !== value) {
                    // 这里的this 不是实例，所以用that指定this
                    that.observer(newValue);// 如果新值是对象继续劫持，由于在observer方法中已经判断是否有对象逻辑，此处不用判断是否是对象，直接使用该方法
                    value = newValue;
                    dep.notify();// 通知所有人，数据更新了
                }
            }
        });
    }
}


class Dep {
    constructor() {
        // 订阅的数组
        this.subs = [];
    }
    // 订阅
    addSub(watcher) {
        this.subs.push(watcher);
    }
    // 发送
    notify() {
        this.subs.forEach(watcher => {
            watcher.update();
        });
    }
}