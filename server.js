var mongo = require('./mongo.js');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ObjectID = require('mongodb').ObjectID;

io.on('connection', function (socket) {
    socket.emit('connected');
    socket.on('confirm', function (data) {
        mongo.insert('user_socket', {uid: data.uid, ma_cq: data.ma_cq, sid: socket.id})
    });
    socket.on('disconnect', function () {
        mongo.remove('user_socket', {sid: socket.id});
    });
    socket.on('sendcomment', function (data) {
        data.seen = [];
        data.time = new Date();
        mongo.insert('comments', data)
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
        mongo.find('user_socket', query, function (docs) {
            docs.forEach(function (doc) {
                io.to(doc.sid).emit('newcomment', data);
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
        mongo.find('comments', query, function (docs) {
            socket.emit('returncomments', docs)
        });
    });

    socket.on('addseen', function (input) {
        var query = {_id: ObjectID(input._id)};
        var update = {$push: {seen: input.uid}};
        mongo.update('comments', query, update);
    })
});


http.listen(3000, function () {
    console.log('listening on *:3000');
});

