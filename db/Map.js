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
    sites: {
        type: Array,
        required: true
    },
    clusters: {
        type: Array,
        required: true
    },
    createDate: {
        type: String,
        required: true
    },
    editDate: {
        type: String,
        required: false
    }
});

mapSchema.methods.transformMap = function ( map ) {
    return {
        id: map._id,
        uid: map.uid,
        name: map.name,
        img: map.img,
        sites: map.sites,
        clusters: map.clusters,
        createDate: map.createDate,
        editDate: map.editDate

    };
}

mapSchema.statics.findByName = function( name, cb ) {
    return this.findOne( { name: name }, cb );
};

mapSchema.statics.findByUid = function( uid, cb ) {
    return this.findOne( { uid: uid }, cb );
};

mapSchema.statics.findAll = function (cb) {
    return this.find(cb);
}

mapSchema.statics.findAllByUid = function (cb) {
    return this.findOne( { uid: uid }, cb );

    return this.find(cb);
}

mapSchema.statics.update = function (map, cb) {
    return this.findByUidAndUpdate(map.id,
        { $set: {
                uid: map.uid,
                name: map.name,
                img: map.img,
                sites: map.sites,
                clusters: map.clusters,
                createDate: map.createDate,
                editDate: map.editDate
        }}, { new: true }, cb);
}

module.exports = mongoose.model('maps', mapSchema, 'maps');