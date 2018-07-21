class MVVM {
    constructor(options) {
        // 先把可用的东西挂载在实例上
        this.$el = options.el;
        this.$data = options.data;

        // 判断要编译的模板是否存在
        if (this.$el) {
            // 数据劫持  就是想把对象的所有属性改成get 和set 方法
            new Observer(this.$data);
            // 用数据和元素进行编译
            new Compile(this.$el, this);

            // 实现数据代理  this.vm.$data 的数据放到 this.vm 上
            this.proxyData(this.$data);
        }
    }

    // 数据代理，将this.vm.$data的数据放到this.vm 上，这样可以获取数据的时候可以 this.vm.shuxing 而不是this.vm.$data.shuxing,就是一种简写方案
    proxyData(data) {
        Object.keys(data).forEach((key) => {
            Object.defineProperty(this, key, {
                get() {
                    return data[key];
                },
                set(newValue) {
                    data[key] = newValue;
                }
            });
        });
    }

}