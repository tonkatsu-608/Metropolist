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
    },
    // segment: {
    //     type: Number,
    //     required: false
    // },
    // distance: {
    //     type: Number,
    //     required: false
    // },
    // sites: {
    //     type: Array,
    //     required: false
    // },
    // edges: {
    //     type: Array,
    //     required: false
    // },
    // polygons: {
    //     type: Array,
    //     required: false
    // },
    // clusters: {
    //     type: Array,
    //     required: false
    // },
    // vertices: {
    //     type: Array,
    //     required: false
    // },
});

mapSchema.methods.transformMap = function ( map ) {
    return {
        id: map._id,
        uid: map.uid,
        name: map.name,
        img: map.img,
        data: map.data,
        // createDate: map.createDate,
        // editDate: map.editDate,
        // segment: map.segment,
        // distance: map.distance,
        // sites: map.sites,
        // edges: map.edges,
        // polygons: map.polygons,
        // clusters: map.clusters,
        // vertices: map.vertices,
    };
}

mapSchema.statics.findAll = function (cb) {
    return this.find(cb);
}

mapSchema.statics.update = function (map, cb) {
    return this.findOneAndUpdate({ _id: map.id },
        { $set: {
                name: map.name,
                img: map.img,
                data: map.data,
                // editDate: map.editDate,
                // segment: map.segment,
                // distance: map.distance,
                // sites: map.sites,
                // edges: map.edges,
                // polygons: map.polygons,
                // clusters: map.clusters,
                // vertices: map.vertices,
        }}, { new: true }, cb);
}

mapSchema.statics.delete = function (id, cb) {
    return this.findByIdAndRemove( id, cb );
}

module.exports = mongoose.model('maps', mapSchema, 'maps');