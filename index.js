var express = require('express');
var app = express();
var http = require('http').Server(app);
var log4js = require('log4js');
var io = require('socket.io')(http);
var bodyParser=require('body-parser');
app.use(express.static(__dirname + '/public'));
log4js.configure({
    appenders: [
        { type: 'console' }, //控制台输出
        {
            type: 'file', //文件输出
            filename: 'logs.log',
            maxLogSize: 1024,
            backups:3,
            category: 'normal'
        }
    ],
    replaceConsole: true
});
var logger = log4js.getLogger('normal');
logger.setLevel('INFO');
http.listen(3000, function() {
    console.log('listening on *:3000');
});

var globalData = {
    gameStatus: 0, //游戏状态,0:未开始1:准备中2:进行中
    originalRange: [], //当前身份范围
    backupsRange: '', //备份身份范围
    progress: {
        police: {
            id: '警察',
            detail: []
        },
        killer: {
            id: '杀手',
            detail: []
        },
        secretPolice: {
            id: '密警',
            detail: []
        },
        doctor: {
            id: '医生',
            detail: []
        },
        civilian: {
            id: '平民',
            detail: []
        }
    }
};
var globalFun = {
    pushIdentity: function(arr) {
        var arrCach = [];
        for (var i = 0; i < arr.length; i++) {
            for (var j = 0; j < arr[i].number; j++) {
                arrCach.push(arr[i].identity);
            }
        }
        return arrCach;
    },
    getIdentitys: function(n) {
        var subdivide = [];
        if (n == 10 || n == 11) {
            subdivide = [{
                identity: '警察',
                number: 2
            }, {
                identity: '杀手',
                number: 3
            }, {
                identity: '密警',
                number: 1
            }, {
                identity: '医生',
                number: 1
            }, {
                identity: '平民',
                number: n - 7
            }];
        }
        if (n >= 12 && n <= 15) {
            subdivide = [{
                identity: '警察',
                number: 3
            }, {
                identity: '杀手',
                number: 4
            }, {
                identity: '密警',
                number: 1
            }, {
                identity: '医生',
                number: 1
            }, {
                identity: '平民',
                number: n - 9
            }];
        }
        if (n == 16 || n == 17) {
            subdivide = [{
                identity: '警察',
                number: 4
            }, {
                identity: '杀手',
                number: 5
            }, {
                identity: '密警',
                number: 1
            }, {
                identity: '医生',
                number: 1
            }, {
                identity: '平民',
                number: n - 11
            }];
        }
        if (n == 18 || n == 19) {
            subdivide = [{
                identity: '警察',
                number: 5
            }, {
                identity: '杀手',
                number: 6
            }, {
                identity: '密警',
                number: 1
            }, {
                identity: '医生',
                number: 1
            }, {
                identity: '平民',
                number: n - 13
            }];
        }
        if (n == 20 || n == 21) {
            subdivide = [{
                identity: '警察',
                number: 5
            }, {
                identity: '杀手',
                number: 6
            }, {
                identity: '密警',
                number: 1
            }, {
                identity: '医生',
                number: 1
            }, {
                identity: '平民',
                number: n - 13
            }];
        }
        if (n == 22 || n == 23) {
            subdivide = [{
                identity: '警察',
                number: 5
            }, {
                identity: '杀手',
                number: 6
            }, {
                identity: '密警',
                number: 1
            }, {
                identity: '医生',
                number: 1
            }, {
                identity: '平民',
                number: n - 13
            }];
        }
        if (n == 24 || n == 25) {
            subdivide = [{
                identity: '警察',
                number: 6
            }, {
                identity: '杀手',
                number: 7
            }, {
                identity: '密警',
                number: 1
            }, {
                identity: '医生',
                number: 1
            }, {
                identity: '平民',
                number: n - 15
            }];
        }
        if (n >= 26 && n <= 30) {
            subdivide = [{
                identity: '警察',
                number: 7
            }, {
                identity: '杀手',
                number: 8
            }, {
                identity: '密警',
                number: 1
            }, {
                identity: '医生',
                number: 1
            }, {
                identity: '平民',
                number: n - 17
            }];
        }
        globalFun.changeTotal(subdivide);
        return globalFun.pushIdentity(subdivide);
    },
    changeTotal: function(arr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].identity == '警察') {
                globalData.progress.police.total = arr[i].number;
            }
            if (arr[i].identity == '杀手') {
                globalData.progress.killer.total = arr[i].number;
            }
            if (arr[i].identity == '密警') {
                globalData.progress.secretPolice.total = arr[i].number;
            }
            if (arr[i].identity == '医生') {
                globalData.progress.doctor.total = arr[i].number;
            }
            if (arr[i].identity == '平民') {
                globalData.progress.civilian.total = arr[i].number;
            }
        }
    },
    addProperty: function(name, identity) {
        if (identity == '警察') {
            globalData.progress.police.detail.push({
                name: name,
                identity: identity,
                live: true
            });
        }
        if (identity == '杀手') {
            globalData.progress.killer.detail.push({
                name: name,
                identity: identity,
                live: true
            });
        }
        if (identity == '密警') {
            globalData.progress.secretPolice.detail.push({
                name: name,
                identity: identity,
                power: 1,
                live: true
            });
        }
        if (identity == '医生') {
            globalData.progress.doctor.detail.push({
                name: name,
                identity: identity,
                power: 3,
                live: true
            });
        }
        if (identity == '平民') {
            globalData.progress.civilian.detail.push({
                name: name,
                identity: identity,
                live: true
            });
        }
    },
    getMyIdentity: function(name) {
        var index = Math.floor(Math.random() * (globalData.originalRange.length - 1));
        var identityFlag = globalData.originalRange[index];
        globalFun.addProperty(name, identityFlag);
        globalData.originalRange.splice(index, 1);
        return identityFlag;
    },
    isNameRepeat: function(name) {
        var flag = true;
        for (var item in globalData.progress) {
            for (var i = 0; i < globalData.progress[item].detail.length; i++) {
                if (name == globalData.progress[item].detail[i].name) {
                    flag = false;
                }
            }
        }
        return flag;
    }
};
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/gamestart', function(req, res) {
    if (globalData.gameStatus == 0) {
        globalData.gameStatus = 1;
        if (req.query.sum >= 10 && req.query.sum <= 30) {
            globalData.originalRange = globalFun.getIdentitys(req.query.sum);
            globalData.backupsRange = globalData.originalRange.join(',');
            //console.log(globalData);
            res.send({
                code: 1,
                msg: '游戏开始成功！'
            });
        } else {
            globalData.gameStatus = 0;
            res.send({
                code: 0,
                msg: '请输入10~30之间的任意数字！'
            });
        }
    } else {
        if (req.query.sum == globalData.backupsRange.split(',').length) {
            res.send({
                code: 1,
                msg: '重新进入游戏成功！'
            });
        } else {
            res.send({
                code: 0,
                msg: '游戏已经开始，请先关闭游戏后再重新开始！'
            });
        }

    }
});
app.get('/getid', function(req, res) {
    if (globalData.gameStatus == 0) {
        res.send({
            code: 0,
            msg: '游戏还未开始，请开始游戏再申请！'
        });
        return false;
    }
    if (globalData.gameStatus == 2) {
        if (globalFun.isNameRepeat(req.query.name)) {
            res.send({
                code: 0,
                msg: '名额已满，等待下次加入吧！'
            });
            return false;
        } else {
            for (var item in globalData.progress) {
                for (var i = 0; i < globalData.progress[item].detail.length; i++) {
                    if (globalData.progress[item].detail[i].name == req.query.name) {
                        res.send({
                            code: 1,
                            msg: '身份申请成功！',
                            identity: globalData.progress[item].detail[i].identity
                        });
                    }
                }
            }
        }
    }
    if (globalData.gameStatus == 1) {
        if (globalFun.isNameRepeat(req.query.name)) {
            var identityFlag = globalFun.getMyIdentity(req.query.name);
            if (globalData.originalRange.length == 0) {
                globalData.gameStatus = 2;
                logger.info('游戏开始喽！');
                logger.info(JSON.stringify(globalData.progress));
            }
            //console.log(globalData);
            res.send({
                code: 1,
                msg: '身份申请成功！',
                identity: identityFlag
            });
        } else {
            res.send({
                code: 0,
                msg: '请不要重复提交身份标识！'
            });
        }
    }
});
app.get('/state', function(req, res) {
    res.send({
        code: 1,
        msg: '请求成功！',
        json: globalData
    });
});
app.post('/update', function(req, res){
    if(globalData.gameStatus==2){
        for(var item in req.body.nowData){
            req.body.nowData[item].detail.forEach(function(v){
                if(v.live=='true'){
                    v.live=true;
                }else{
                    v.live=false;
                }
                if(v.hasOwnProperty('power')){
                    v.power=v.power*1;
                }
            });
        }
        globalData.progress=req.body.nowData;
        res.send({
            code:1,
            msg:'游戏实时数据更新成功！'
        });
    }
});
app.get('/gameover', function(req, res) {
    globalData.gameStatus = 0;
    globalData.originalRange = [];
    globalData.backupsRange = '';
    globalData.progress = {
        police: {
            id: '警察',
            detail: []
        },
        killer: {
            id: '杀手',
            detail: []
        },
        secretPolice: {
            id: '密警',
            detail: []
        },
        doctor: {
            id: '医生',
            detail: []
        },
        civilian: {
            id: '平民',
            detail: []
        }
    };
    logger.info('游戏结束啦！');
    res.send({
        code: 1,
        msg: '游戏关闭成功！'
    });
});

io.on('connection', function(socket) {
    socket.on('admin', function(msg) {
        socket.join('admin');
        socket.emit('admin', {
            data: globalData
        });
    });
    socket.on('clerk', function(msg) {
        socket.join('clerk');
        io.sockets.in('clerk').emit('clerk', {
            total: globalData.backupsRange.split(',').length,
            join: globalData.backupsRange.split(',').length - globalData.originalRange.length
        });
        io.sockets.in('admin').emit('admin', {
            data: globalData
        });
    });
    socket.on('over', function(msg) {
        io.sockets.in('clerk').emit('over', {
            data: globalData.progress
        });
    });
});

app.use(function(req, res) {
    res.status(404);
    res.send('404');
});
app.use(function(err, req, res) {
    console.error(err.stack);
    res.status(500);
    res.send('500');
});
