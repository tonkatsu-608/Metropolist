var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var schema = mongoose.Schema;

var userSchema = new schema({
    email: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        required: true
    }
});

userSchema.methods.transformUser = function ( user ) {
    return {
        id: user._id,
        email: user.email,
        avatar: user.avatar,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        enabled: user.enabled
    };
}

userSchema.methods.hashPassword = function ( password ) {
    return bcrypt.hashSync( password, bcrypt.hashSync(10) );
}

userSchema.methods.verifyPassword = function ( password, hash ) {
    return bcrypt.compareSync( password, hash );
}

userSchema.statics.findByEmail = function( email, cb ) {
    return this.findOne( { email: email }, cb );
};

userSchema.statics.findAll = function (cb) {
    return this.find(cb);
}

userSchema.statics.update = function (user, cb) {
    return this.findByIdAndUpdate(user.id,
        { $set: {
                email: user.email,
                avatar: user.avatar,
                firstname: user.firstname,
                lastname: user.lastname,
                role: user.role,
                enabled: user.enabled
            }}, { new: true }, cb);
}

userSchema.statics.updateEmail = function (user, cb) {
    return this.findByIdAndUpdate(user.id,
        { $set: {
                email: user.email
            }}, { new: true }, cb);
}

userSchema.statics.updateName = function (user, cb) {
    return this.findByIdAndUpdate(user.id,
        { $set: {
                firstname: user.firstname,
                lastname: user.lastname,
            }}, { new: true }, cb);
}

userSchema.statics.updatePassword = function (user, cb) {
    return this.findByIdAndUpdate(user.id,
        { $set: {
                password: user.password
            }}, { new: true }, cb);
}

userSchema.statics.updateEnabled = function (user, cb) {
    return this.findByIdAndUpdate(user.id,
        { $set: {
                enabled: false
            }}, { new: true }, cb);
}

module.exports = mongoose.model('users', userSchema, 'users');