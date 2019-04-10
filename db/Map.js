var mongoose = require('mongoose');
var schema = mongoose.Schema;

var mapSchema = new schema({
    uid: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true
    },
    isVisible: {
        type: Boolean,
        required: true
    },
    createDate: {
        type: String,
        required: true
    },
    editDate: {
        type: String,
        required: false
    },
    data: {
        type: Object,
        required: false
    }
});

mapSchema.methods.transformMap = function (map) {
    return {
        id: map._id,
        uid: map.uid,
        name: map.name,
        img: map.img,
        data: map.data,
        createDate: map.createDate,
        editDate: map.editDate,
        isVisible: map.isVisible,
    };
}

mapSchema.statics.findAll = function (cb) {
    return this.find(cb);
}

mapSchema.statics.update = function (map, cb) {
    return this.findOneAndUpdate({_id: map.id}, {$set: map}, {new: true}, cb);
}

mapSchema.statics.delete = function (id, cb) {
    return this.findByIdAndRemove(id, cb);
}

module.exports = mongoose.model('maps', mapSchema, 'maps');