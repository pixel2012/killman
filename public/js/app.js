var myApp = new Framework7({
    pushState: true,
    pushStateSeparator: '#',
    modalTitle: '提示',
    modalButtonOk: '确定',
    modalButtonCancel: '取消'
});
var $$ = Dom7;
var mainView = myApp.addView('.view-main', {
    dynamicNavbar: true,
    domCache: true
});
// var postUrl = 'http://localhost:3000';
var postUrl = 'http://192.168.8.181:3000';
var socket = io();

/*-----------------初始化----------------------*/
myApp.onPageInit('apply', function(page) {
    var vm = new Vue({
        el: '#apply',
        data: {
            sum: ''
        },
        methods: {
            'gameStart': function() {
                var that = this;
                if (this.sum >= 10 && this.sum <= 30) {
                    $.ajax({
                        url: postUrl + '/gamestart',
                        method: 'GET',
                        beforeSend: function() {
                            myApp.showIndicator();
                        },
                        data: {
                            sum: parseInt(this.sum)
                        }
                    }).done(function(data) {
                        myApp.hideIndicator();
                        if (data.code) {
                            sessionStorage.total = that.sum;
                            that.sum = '';
                            mainView.router.loadPage('manage.html');
                        } else {
                            myApp.alert(data.msg);
                        }
                    }).fail(function(data) {
                        myApp.hideIndicator();
                        myApp.alert(JSON.stringify(data));
                    });
                } else {
                    myApp.alert('请输入10~30之间的任意数字！');
                }
            }
        }
    });
});
myApp.onPageInit('manage', function(page) {
    var vm = new Vue({
        el: '#manage',
        data: {
            currentState: null
        },
        computed: {
            comState: function() {
                var getOccurrenceNumber = function(str, s) {
                    var re = new RegExp(s, "g");
                    var arr = str.match(re);
                    return arr.length;
                };
                var state = {
                    total: sessionStorage.total,
                    join: 0,
                    live: 0,
                    die: 0,
                    police: {
                        total: 0,
                        live: 0,
                        die: 0
                    },
                    killer: {
                        total: 0,
                        live: 0,
                        die: 0
                    },
                    secretPolice: {
                        total: 0,
                        live: 0,
                        die: 0,
                        power: 0
                    },
                    doctor: {
                        total: 0,
                        live: 0,
                        die: 0,
                        power: 0
                    },
                    civilian: {
                        total: 0,
                        live: 0,
                        die: 0
                    }
                };

                if (this.currentState) {
                    for (var item in this.currentState.progress) {
                        state.join += this.currentState.progress[item].detail.length; //当前加入人数
                        state[item].total = getOccurrenceNumber(this.currentState.backupsRange, this.currentState.progress[item].id);
                        for (var i = 0; i < this.currentState.progress[item].detail.length; i++) {
                            if (this.currentState.progress[item].detail[i].live) {
                                state.live++; //当前活着的人数
                                state[item].live++; //当前身份的活着的人数
                            }
                            state.die = state.total - state.live; //当前死亡人数
                            state[item].die = state[item].total - state[item].live; //当前身份的死亡的人数
                        }
                        if (item == 'secretPolice') {
                            for (var j = 0; j < this.currentState.progress.secretPolice.detail.length; j++) {
                                state[item].power += this.currentState.progress.secretPolice.detail[j].power;
                            }
                        }
                        if (item == 'doctor') {
                            for (var k = 0; k < this.currentState.progress.doctor.detail.length; k++) {
                                state[item].power += this.currentState.progress.doctor.detail[k].power;
                            }
                        }
                    }
                }
                return state;
            },
            gameState: function() {
                if (this.currentState) {
                    if (this.currentState.gameStatus == 0) {
                        return '未开始'
                    }
                    if (this.currentState.gameStatus == 1) {
                        return '等待中...'
                    }
                    if (this.currentState.gameStatus == 2) {
                        return '进行中...'
                    }
                } else {
                    return '';
                }
            },
            isRevive: function() {
                var flag = false;
                if (this.currentState) {
                    for (var i = 0; i < this.currentState.progress.doctor.detail.length; i++) {
                        if (this.currentState.progress.doctor.detail[i].live) {
                            flag = true;
                        }
                    }
                }
                return flag;
            }
        },
        ready: function() {
            var that = this;
            socket.emit('admin');
            socket.on('admin', function(msg) {
                console.log(JSON.stringify(msg.data));
                if (that.gameStatus == 2) {
                    console.log(typeof msg.data.progress.killer.detail[0].live);
                }
                that.currentState=msg.data;
            });
        },
        methods: {
            kill: function(item) {
                if (this.currentState.gameStatus == 2) {
                    item.live = false;
                    $.ajax({
                        url: postUrl + '/update',
                        method: 'POST',
                        data: {
                            nowData: this.currentState.progress
                        }
                    })
                } else {
                    myApp.alert('游戏还未开始，请稍后再试!');
                }
            },
            revive: function(item) {
                item.live = true;
                $.ajax({
                    url: postUrl + '/update',
                    method: 'POST',
                    data: {
                        nowData: this.currentState.progress
                    }
                })
            },
            minusPower: function(item) {
                if (this.currentState.gameStatus == 2) {
                    if (item.power > 0) {
                        item.power--;
                        $.ajax({
                            url: postUrl + '/update',
                            method: 'POST',
                            data: {
                                nowData: this.currentState.progress
                            }
                        })
                    }
                } else {
                    myApp.alert('游戏还未开始，请稍后再试!');
                }
            },
            'gameOver': function() {
                myApp.confirm('确定要关闭游戏吗？', function() {
                    //通知所有客户端本地游戏结束，把本轮每人身份发送到每个人手机上
                    socket.emit('over');
                    $.ajax({
                        url: postUrl + '/gameover',
                        method: 'GET',
                        beforeSend: function() {
                            myApp.showIndicator();
                        }
                    }).done(function(data) {
                        myApp.hideIndicator();
                        if (data.code) {
                            this.currentState = null;
                            mainView.router.back();
                        } else {
                            myApp.alert(data.msg);
                        }
                    }).fail(function(data) {
                        myApp.hideIndicator();
                        myApp.alert(JSON.stringify(data));
                    });
                });
            }
        },
        watch: {
            comState: function(val) {
                if (this.currentState && this.currentState.gameStatus == 2) {
                    var that = this;
                    //1，如果杀手全部死亡，游戏结束
                    if (val.killer.live == 0) {
                        myApp.alert('杀手全部死亡，游戏结束！', function() {
                            over();
                        });
                    }
                    //2，如果警察全部死亡，游戏结束
                    if (val.police.live == 0 && val.secretPolice.power > 0) {
                        var spf = true;
                        for (var i = 0; i < this.currentState.progress.secretPolice.detail.length; i++) {
                            if (this.currentState.progress.secretPolice.detail[i].power > 0 && this.currentState.progress.secretPolice.detail[i].live) {
                                spf = false;
                            }
                        }
                        if (spf) {
                            myApp.alert('警察全部死亡，游戏结束！', function() {
                                over();
                            });
                        }
                    }
                    //3，如果平民全部死亡，游戏结束
                    if (val.civilian.live == 0) {
                        var cf = true;
                        for (var j = 0; j < this.currentState.progress.secretPolice.detail.length; j++) {
                            if (this.currentState.progress.secretPolice.detail[j].power == 0 && this.currentState.progress.secretPolice.detail[j].live) {
                                cf = false;
                            }
                        }
                        for (var k = 0; k < this.currentState.progress.doctor.detail.length; k++) {
                            if (this.currentState.progress.doctor.detail[k].power == 0 && this.currentState.progress.doctor.detail[k].live) {
                                cf = false;
                            }
                        }
                        if (cf) {
                            myApp.alert('平民全部死亡，游戏结束！', function() {
                                over();
                            });
                        }
                    }
                }

                function over() {
                    //通知所有客户端本地游戏结束，把本轮每人身份发送到每个人手机上
                    if(that.currentState.gameStatus==2){
                        socket.emit('over');
                    }
                    $.ajax({
                        url: postUrl + '/gameover',
                        method: 'GET',
                        beforeSend: function() {
                            myApp.showIndicator();
                        }
                    }).done(function(data) {
                        myApp.hideIndicator();
                        if (data.code) {
                            that.currentState = null;
                            myApp.confirm('是否重新开始游戏?',function(){
                                mainView.router.back();
                            });
                        } else {
                            myApp.alert(data.msg);
                        }
                    }).fail(function(data) {
                        myApp.hideIndicator();
                        myApp.alert(JSON.stringify(data));
                    });
                }
            }
        }
    });
});
myApp.onPageInit('get', function(page) {
    var vm = new Vue({
        el: '#get',
        data: {
            name: ''
        },
        methods: {
            SubmitName: function() {
                if (this.name.length > 0) {
                    var that = this;
                    $.ajax({
                        url: postUrl + '/getid',
                        method: 'GET',
                        beforeSend: function() {
                            myApp.showIndicator();
                        },
                        data: {
                            name: this.name
                        }
                    }).done(function(data) {
                        myApp.hideIndicator();
                        if (data.code) {
                            that.name = '';
                            mainView.router.loadPage('show.html?type=' + data.identity);
                        } else {
                            myApp.alert(data.msg);
                        }
                    }).fail(function(data) {
                        myApp.hideIndicator();
                        myApp.alert(JSON.stringify(data));
                    });
                } else {
                    myApp.alert('请输入有效的身份标识！');
                }
            },
            oneName:function(){
                var a='test';
                for(var i =0;i<30;i++){
                    $.ajax({
                        url: postUrl + '/getid',
                        method: 'GET',
                        async:true,
                        data: {
                            name: a+i
                        }
                    }).done(function(data) {
                        if (data.code) {
                            console.log((a+i) +':'+ data.identity);
                        } else {
                            console.log(data.msg);
                        }
                    }).fail(function(data) {
                        console.log(JSON.stringify(data));
                    });
                }
            }
        }
    });
});
myApp.onPageInit('show', function(page) {
    var vm = new Vue({
        el: '#show',
        data: {
            identity: page.query.type,
            state: null,
            flag: true,
            detail:null
        },
        ready: function() {
            var that = this;
            socket.emit('clerk');
            socket.on('clerk', function(msg) {
                console.log(msg);
                that.state = msg;
            });
            socket.on('over', function(msg) {
                console.log('游戏结束');
                console.log(JSON.stringify(msg.data));
                that.detail=msg.data;
            });
        },
        methods: {
            toggle: function() {
                this.flag = !this.flag
            },
            lookDetail:function(){
                if(this.detail){
                    var that=this;
                    $.get('../temp-show.html',function(html){
                        var template = Template7.compile(html);
                        var resultContent = template({
                            detail:that.detail
                        });
                        myApp.popup(resultContent);
                    });
                }else{
                    myApp.alert('游戏结束后才可以查看哦！');
                }
            }
        }
    });
});
/*-----------------自定义F7的Helper----------------------*/
Template7.registerHelper('convertIdentity', function (id) {
    switch (id){
        case 'killer':
            return '杀手';
            break;
        case 'police':
            return '警察';
            break;
        case 'secretPolice':
            return '密警';
            break;
        case 'doctor':
            return '医生';
            break;
        case 'civilian':
            return '平民';
            break;
    }
});
