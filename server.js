var mongo = require('./mongo.js');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ObjectID = require('mongodb').ObjectID;

var COMMENTS = "comments";
var USER_SOCKET = "user_socket";
var NOTIFICATION = "notifications";

io.on('connection', function (socket) {
    socket.emit('connected');
    socket.on('confirm', function (data) {
        console.log("user connected ...");
        data.time = new Date();
        console.log(data);
        data.sid = socket.id;
        mongo.insert(USER_SOCKET, data);
    });
    socket.on('disconnect', function () {
        var query = {sid: socket.id};
        console.log("disconnect ...");
        console.log(query);
        mongo.remove(USER_SOCKET, {sid: socket.id});
    });

    //Chỉ đạo
    socket.on('sendconduct', function (data) {
        data.seen = [];
        data.time = new Date();
        data.reply = [data.sender_id];
        mongo.insert(COMMENTS, data, function (result) {
            var newId = result.insertedId.toString();
            data.obj_id = newId;
            socket.emit('sendconductsc', data);
            var dataNotify = {
                to_cq: data.ma_tinh,
                to_uid: [],
                obj_id: newId,
                sender: data.sender,
                sender_male: data.male,
                sender_id: data.sender_id,
                type: data.type,
                url: data.url,
                comment: data.comment,
                ten_tinh: data.ten_tinh,
                ma_tinh: data.ma_tinh,
                dt_id: data.map_id,
                dt_name: data.map_name,
                time: new Date(),
                seen: [],
                file: data.file
            };
            var query = {ma_cq: parseInt(data.ma_tinh) + ""};
            notify(io, dataNotify, query);
            mongo.insert(NOTIFICATION, dataNotify);
        });
    });

    socket.on('replyconduct', function (data) {
        data.seen = [];
        data.time = new Date();
        data.reply = [];
        mongo.insert(COMMENTS, data, function (result) {
            data.obj_id = result.insertedId;
            socket.emit('replyconductsc', data);

            var query_conduct = {_id: ObjectID(data.reply_to)};
            mongo.findOne(COMMENTS, query_conduct, function (item) {

                if (item != null) {
                    var dataNotify = {
                        to_cq: "",
                        to_uid: item.reply,
                        obj_id: data.obj_id,
                        sender: data.sender,
                        sender_male: data.male,
                        sender_id: data.sender_id,
                        type: data.type,
                        url: data.url,
                        comment: data.comment,
                        ten_tinh: data.ten_tinh,
                        ma_tinh: data.ma_tinh,
                        dt_id: data.map_id,
                        dt_name: data.map_name,
                        reply_to: data.reply_to,
                        time: new Date(),
                        seen: [],
                        file: data.file
                    };
                    mongo.insert(NOTIFICATION, dataNotify);
                    var send_to = [];
                    if (item.sender_id != data.sender_id) {
                        send_to[send_to.length] = item.sender_id;
                        var query = {uid: item.sender_id};
                        notify(io, dataNotify, query);
                    }
                    item.reply.forEach(function (rep, index) {
                        if (rep != data.sender_id && send_to.indexOf(rep) == -1) {
                            send_to[send_to.length] = rep;
                            var query = {uid: rep};
                            notify(io, dataNotify, query);
                        }
                    });
                }

            });
        });


        var query_update = {_id: ObjectID(data.reply_to)};
        var data_update = {$push: {reply: data.sender_id}};
        mongo.update(COMMENTS, query_update, data_update);

    });

    socket.on('getconduct', function (input) {
        var query = {
            $and: [
                {map_id: input.map_id},
                {ma_tinh: input.ma_tinh}
            ]
        };
        mongo.find(COMMENTS, query, function (docs) {
            socket.emit('returnConduct', docs);
        });
    });


    //Chart Comment
    socket.on('sendchartcmt', function (data) {
        data.time = new Date();
        data.reply = [data.sender_id];
        mongo.insert(COMMENTS, data, function (result) {
            var newId = result.insertedId.toString();
            data.obj_id = newId;
            socket.emit('sendchartcmtsc', data);
            var dataNotify = {
                to_uid: data.notify_to,
                obj_id: newId,
                sender: data.sender,
                sender_male: data.male,
                sender_id: data.sender_id,
                type: data.type,
                url: data.url,
                comment: data.comment,
                dt_id: data.chart_id,
                dt_name: data.chart_name,
                time: new Date(),
                seen: [],
                file: data.file
            };

            var query = {uid: {$in: data.notify_to}};
            notify(io, dataNotify, query);
            mongo.insert(NOTIFICATION, dataNotify);
        });
    });

    socket.on('replychartcmt', function (data) {
        data.time = new Date();
        mongo.insert(COMMENTS, data, function (result) {
            data.obj_id = result.insertedId;
            socket.emit('replychartcmtsc', data);
            var query_conduct = {_id: ObjectID(data.reply_to)};
            mongo.findOne(COMMENTS, query_conduct, function (item) {
                if (item != null) {
                    var dataNotify = {
                        to_uid: item.reply,
                        obj_id: data.obj_id,
                        sender: data.sender,
                        sender_male: data.male,
                        sender_id: data.sender_id,
                        type: data.type,
                        url: data.url,
                        comment: data.comment,
                        dt_id: data.chart_id,
                        dt_name: data.chart_name,
                        reply_to: data.reply_to,
                        time: new Date(),
                        seen: [],
                        file: data.file
                    };
                    mongo.insert(NOTIFICATION, dataNotify);
                    var send_to = [];
                    console.log(item.sender_id + "/" + data.sender_id);
                    if (item.sender_id != data.sender_id) {
                        send_to[send_to.length] = item.sender_id;
                        var query = {uid: item.sender_id};
                        console.log(query);
                        notify(io, dataNotify, query);
                    }
                    item.reply.forEach(function (rep, index) {
                        if (rep != data.sender_id && send_to.indexOf(rep) == -1) {
                            send_to[send_to.length] = rep;
                            var query = {uid: rep};
                            notify(io, dataNotify, query);
                        }
                    });
                }
            });
        });


        var query_update = {_id: ObjectID(data.reply_to)};
        var data_update = {$push: {reply: data.sender_id}};
        mongo.update(COMMENTS, query_update, data_update);

    });

    socket.on('getchartcmt', function (input) {
        var query = {chart_id: input.chart_id};
        mongo.find(COMMENTS, query, function (docs) {
            socket.emit('returnchartcmt', docs);
        });
    });

    socket.on('removecmt', function (input) {
        var query = {
            $or: [
                {_id: ObjectID(input.id)},
                {reply_to: input.id}
            ]
        };
        mongo.remove(COMMENTS, query);
        mongo.remove(NOTIFICATION, query);
    });

    socket.on('editcmt', function (input) {
        var query = {_id: ObjectID(input.id)};
        var update = {
            $set: {comment: input.comment, file: input.file}
        };
        mongo.update(COMMENTS, query, update);
    });

    //Notify
    socket.on('allnotify', function (input) {
        var query = {
            $and: [
                {sender_id: {$ne: input.uid}},
                {
                    $or: [
                        {to_cq: input.ma_cq},
                        {to_uid: {$in: [input.uid]}}
                    ]
                }
            ]
        };
        mongo.find(NOTIFICATION, query, function (docs) {
            socket.emit('returnallnodity', docs.reverse());
        });
    });

    socket.on('getnewnotify', function (input) {
        var query = {
            $and: [
                {sender_id: {$ne: input.uid}},
                {
                    $or: [
                        {to_cq: input.ma_cq},
                        {to_uid: {$in: [input.uid]}}
                    ]
                },
                {seen: {$not: {$in: [input.uid]}}}
            ]
        };
        mongo.find(NOTIFICATION, query, function (docs) {
            socket.emit('returnnewnodity', docs.reverse());
        });
    });

    socket.on('seen', function (input) {
        var query = {
            $and: [
                {dt_id: input.id},
                {ma_tinh: input.ma_tinh},
                {seen: {$not: {$in: [input.uid]}}}
            ]
        };
        var update = {$push: {seen: input.uid}};
        mongo.update(NOTIFICATION, query, update);
    });

    socket.on('seenchart', function (input) {
        var query = {
            $and: [
                {dt_id: input.id},
                {seen: {$not: {$in: [input.uid]}}},
                {
                    $or: [
                        {type: 'chart-conduct'},
                        {type: 'rep-chart'}
                    ]
                }
            ]
        };
        var update = {$push: {seen: input.uid}};
        mongo.update(NOTIFICATION, query, update);
    });

    socket.on('province_conduct', function () {
        var query = [
            {$match: {type: "map-conduct"}},
            {$sort: {time: -1}},
            {
                $group: {
                    "_id": "$ma_tinh",
                    "time": {"$first": "$time"},
                    "comment": {"$first": "$comment"},
                    "file": {"$first": "$file"},
                    "id": {"$first": "$_id"},
                    "sender_id": {"$first": "$sender_id"}
                }
            }
        ];
        mongo.aggregate(COMMENTS, query, function (data) {
            socket.emit('province_conduct', data);
        });
    });


    //Old
    socket.on('sendcomment', function (data) {
        data.seen = [];
        data.time = new Date();
        mongo.insert(COMMENTS, data)
        var coquan = data.coquan == null ? [] : data.coquan;
        var canhan = data.canhan == null ? [] : data.canhan;
        var qor = [];
        coquan.forEach(function (item) {
            qor[qor.length] = {ma_cq: item};
        });
        canhan.forEach(function (item) {
            qor[qor.length] = {uid: item};
        });
        var query = {
            $or: qor
        };
        mongo.find(USER_SOCKET, query, function (docs) {
            var logSid = [];
            docs.forEach(function (doc) {
                if (io.sockets.sockets[doc.sid] != undefined) {
                    if (logSid.indexOf(doc.session) == -1) {
                        logSid[logSid.length] = doc.session;
                        data.notify = true;
                    } else {
                        data.notify = false
                    }
                    io.sockets.sockets[doc.sid].emit('newcomment', data);
                } else {
                    mongo.remove(USER_SOCKET, {sid: doc.sid});
                }
            });
        });
    })

    socket.on('getnotify', function (input) {
        var uid = input.uid;
        var ma_cq = input.ma_cq;
        var query = {
            $and: [
                {seen: {$not: {$in: [uid]}}},
                {
                    $or: [
                        {canhan: {$in: [uid]}},
                        {coquan: {$in: [ma_cq]}}
                    ]
                }
            ]
        };
        socket.emit('consolelog', query);
        mongo.find(COMMENTS, query, function (docs) {
            socket.emit('returnCOMMENTS', docs)
        });
    });

    socket.on('addseen', function (input) {
        var query = {_id: ObjectID(input._id)};
        var update = {$push: {seen: input.uid}};
        mongo.update(COMMENTS, query, update);
    });

    socket.on('getchartCOMMENTS', function (input) {
        var query = {
            $and: [
                {chart: input.chart},
                {
                    $or: [
                        {canhan: {$in: [input.uid]}},
                        {coquan: {$in: [input.ma_cq]}}
                    ]
                }
            ]
        };
        mongo.find(COMMENTS, query, function (docs) {
            socket.emit('returnchartCOMMENTS', docs.reverse())
        });
    });

});

function notify(io, data, query) {
    mongo.find(USER_SOCKET, query, function (docs) {
        var logSid = [];
        docs.forEach(function (doc) {
            if (data.sender_id != doc.uid) {
                if (io.sockets.sockets[doc.sid] != undefined) {
                    if (logSid.indexOf(doc.session) == -1) {
                        logSid[logSid.length] = doc.session;
                        data.notify = true;
                    } else {
                        data.notify = false
                    }
                    // console.log(data);
                    io.sockets.sockets[doc.sid].emit('newnotify', data);
                } else {
                    mongo.remove(USER_SOCKET, {sid: doc.sid});
                }
            }
        });
    });

}

http.listen(3000, function () {
    console.log('listening on *:3000');
});

process.on('uncaughtException', function (err) {
    console.log(err);
})

