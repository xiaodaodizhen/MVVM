// 模板编译
class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;

        if (this.el) {
            // 如果能获取到这个元素节点，才开始进行编译
            // 1. 先把这些真实的dom移入到内存中 （内存中dom操作dom性能更优） fragment
            let fragment = this.node2fragment(this.el);
            // 2. 编译 => 提取想要的元素节点 v-model 和文本节点 {{}}
            this.compile(fragment);
            // 3.把编译好的fragment在塞回页面中
            this.el.appendChild(fragment);
        }
    }
    /***************************专门写一些辅助的方法***************************************************/
    // 判断是否是node元素节点
    isElementNode(node) {
        return node.nodeType === 1;// 1代表是node节点
    }

    // 判断是否是指令
    isDirective(name) {
        return name.includes("v-");
    }

    /******************************************核心的方法********************************************/


    // 编译元素   带 v-model
    compileElement(node) {
        let attrs = node.attributes;// 取出当前节点的属性
        Array.from(attrs).forEach(attr => {
            // 判断属性名字是否包含 v- ，如果包含说明是一个指令
            let attrName = attr.name;
            if (this.isDirective(attrName)) {
                // 取到对应的值放到节点中
                let expr = attr.value;
                let [, type] = attrName.split("-");//[v,model]
                // node this.vm.$data expr
                CompileUtil[type](node, this.vm, expr);
            }
        });
    }


    // 编译文本  带 {{}}
    compileText(node) {
        let expr = node.textContent;// 取文本中的内容
        let reg = /\{\{([^}]+)\}\}/g;//{{a}}
        if (reg.test(expr)) {
            // node this.vm.$data text
            CompileUtil["text"](node, this.vm, expr);
        }

    }


    compile(fragment) {
        // 需要递归
        let childNodes = fragment.childNodes;
        // 将childNode 类数组转为数组
        Array.from(childNodes).forEach(node => {
            if (this.isElementNode(node)) { // 元素，需要编译元素
                // 是元素节点还需要深入的检查
                this.compileElement(node);
                this.compile(node);
                console.log("element", node);
            } else {// 文本，需要编译文本
                console.log("text", node);
                this.compileText(node);
            }
        });
    }

    node2fragment(el) {
        // 需要将el 中的内容全部放到内存中
        let fragment = document.createDocumentFragment();// 创建文档碎片
        let firstChild;
        while (firstChild = el.firstChild) {// 从el 里取一个，el就少一个
            fragment.appendChild(firstChild);
        }
        return fragment;// 内存中的节点

    }
}



// 编译工具
CompileUtil = {
    // 获取实例上对应的数据val值
    getVal(vm, expr) {
        expr = expr.split(".");// [a,n,...]
        return expr.reduce((prev, next) => { // vm.$data.a.n.c....
            return prev[next];// 返回的是 vm.$data.a.n.c
        }, vm.$data);

    },


    //input 输入框内更改内容
    setInputValue(vm, expr, value) {// expr 可能是 "message.a",expr 是字符串类型，所以得分解为数组，然后在拼接对象属性
            expr=expr.split(".");
            return expr.reduce((prev,next,currentIndex)=>{
                if(currentIndex===expr.length-1){
                    return prev[next]=value;  // message[a]=value
                }
                return prev[next];
            },vm.$data);
    },
    // 文本处理
    text(node, vm, expr) {
        let updateFn = this.updater["textUpdater"];
        // 将{{massage.a}} 替换为 massage.a      (去除换行回车，大括号)
        let value = expr.replace(/[\r\n]/g, "").replace(/(^\s*)|(\s*$)/g, "").replace(/\{\{([^}]+)\}\}/g, (...arg) => { // 箭头函数没有this ,没有arguments
            return arg[1];
        });
        new Watcher(vm, value, () => {
            // 当值变化后会调用cb,将新的值传递过来
            updateFn && updateFn(node, this.getVal(vm, value));
        });
        updateFn && updateFn(node, this.getVal(vm, value));

    },
    // 输入框处理
    model(node, vm, expr) {
        let updateFn = this.updater["modelUpdater"];
        // 这里应该加一个监控  数据变了 应该调用这个Watcher的callback
        new Watcher(vm, expr, () => {
            // 当值变化后会调用cb,将新的值传递过来
            updateFn && updateFn(node, this.getVal(vm, expr));
        });

        node.addEventListener("input", (e) => {
            let newValue = e.target.value;
            this.setInputValue(vm, expr, newValue);
        });

        updateFn && updateFn(node, this.getVal(vm, expr));
    },
    updater: {
        textUpdater(node, value) { //文本更新
            node.textContent = value;
        },
        modelUpdater(node, value) {//输入框更新
            node.value = value;
        }
    }
}