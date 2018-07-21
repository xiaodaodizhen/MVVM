// 观察者     目的：给需要变化的那个元素增加一个观察者，当数据变化后执行对应的方法
class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm;// 实例
        this.expr = expr;
        this.cb = cb;
        // 先获取下老的值
        this.value = this.get();
    }
    getVal(vm, expr) {
        expr = expr.split(".");// [a,n,...]
        return expr.reduce((prev, next) => { // vm.$data.a.n.c....
            return prev[next];// 返回的是 vm.$data.a.n.c
        }, vm.$data);

    }
    get() {
        Dep.target = this;
        let value = this.getVal(this.vm, this.expr);
        Dep.target = null;
        return value;
    }
    // 对外暴露的方法
    update() {
        let newValue = this.getVal(this.vm, this.expr);
        let oldValue = this.value;
        if (newValue != oldValue) {
            this.cb(newValue);
        }
    }
}

// 用新值和老值进行比对，如果发生变化就调用更新的方法 