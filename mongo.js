/**
 * Created by tienc on 8/25/2017.
 */
var MongoClient = require('mongodb').MongoClient;

var modb;

var url = 'mongodb://tiench:12345@localhost:27017/bieudo';
function mongoAction(callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log(err);
            throw err;
        } else {
            callback(db)

        }
    });
}

module.exports = {
    insert: function (collection, data, callback) {
        mongoAction(function (db) {
            db.collection(collection).insertOne(data, function (err, result) {
                db.close();
                if (callback != undefined) {
                    callback(result);
                }
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
                db.close();
                if (doc !== null) {
                    data[data.length] = doc
                } else {
                    callback(data);
                }
            });
        });
    },

    findOne: function (collection, query, callback) {
        mongoAction(function (db) {
            db.collection(collection).findOne(query, function (err, item) {
                db.close();
                callback(item);
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
    aggregate: function (collection, query, callback) {
        mongoAction(function (db) {
            db.collection(collection).aggregate(query).toArray(function (err, result) {
                db.close();
                callback(result);
            });
        });
    },
};