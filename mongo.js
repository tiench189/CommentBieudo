/**
 * Created by tienc on 8/25/2017.
 */
var MongoClient = require('mongodb').MongoClient;

var modb;

var url = 'mongodb://127.0.0.1:27017/bieudo';

function mongoAction(callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        } else {
            callback(db)
        }
    });
}

module.exports = {
    insert: function (collection, data) {
        mongoAction(function (db) {
            db.collection(collection).insertOne(data, function (err, result) {
                db.close();
            });
        });
    },
    remove: function (collection, query) {
        mongoAction(function (db) {
            db.collection(collection).deleteMany(query, function (err, results) {
                db.close();
            });
        });
    },
    find: function (collection, query, callback) {
        mongoAction(function (db) {
            var data = [];
            var cursor = db.collection(collection).find(query);
            cursor.each(function (err, doc) {
                if (doc !== null) {
                    data[data.length] = doc
                } else {
                    callback(data);
                }
            });
        });
    },
    update: function (collection, query, update) {
        mongoAction(function (db) {
            db.collection(collection).updateMany(query, update, function (err, result) {
                db.close();
            });
        });
    },
};