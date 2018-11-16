var mongoose = require('mongoose');
var schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var userSchema = new schema({
    email: {
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

userSchema.methods.hashPassword = function (password) {
    return bcrypt.hashSync(password, bcrypt.hashSync(10));
}

userSchema.methods.verifyPassword = function (password, hash) {
    return bcrypt.compareSync(password, hash);
}

userSchema.statics.findByEmail = function(email, cb) {
    return this.findOne({email: email}, cb);
};

module.exports = mongoose.model('users', userSchema, 'users');