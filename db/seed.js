const User = require('./User');

const admin = {
    email: 'admin@admin.com',
    firstname: 'admin',
    lastname: 'admin',
    password: User().hashPassword('adminABC123'),
    role: 'admin',
    enabled: true,
    avatar: 'assets/images/avatar-0.jpg',
};

User.findByEmail(admin.email, function (err, user) {
    if(err) {
        throw err;
    } else if(user) {

    } else {
        User.create(admin, e => {
            if (e) {
                throw e;
            }
        });
    }
});