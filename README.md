# Metropolist
## Overview
This web application allows users to create randomly generated fantasy maps of cities and additionally allows user to annotate and edit city elements at a fine granularity.

<p align="center">
  <img src="https://github.com/haleyysz/Metropolist/blob/master/public/assets/images/screenshot-0.png">
  <br>
  <i>a screenshot of the map generator page</i>
</p>

## Tech Stack: [MEAN](https://en.wikipedia.org/wiki/MEAN_(software_bundle))
* [**M**ongoose.js](http://www.mongoosejs.com) ([MongoDB](https://www.mongodb.com)): Document database
* [**E**xpress.js](http://expressjs.com): Back-end web application framework running on top of Node.js
* [**A**ngular 7](https://angular.io): Front-end web app framework
* [**N**ode.js](https://nodejs.org): JavaScript runtime environment

Other libraries used:
* [d3.js](https://github.com/d3/d3): Map rendering engine
* [Angular Material](https://material.angular.io): Layout and styles
* [Passport.js](http://www.passportjs.org): User authentication
* [express-jwt](https://github.com/auth0/express-jwt): JSON Web Token
* [bcrypt-nodejs](https://www.npmjs.com/package/bcrypt-nodejs): Password encryption

## Installation & usage
* **Install Node.js**  [https://nodejs.org/en/download](https://nodejs.org/en/download)
* **Install MongoDB**  [https://docs.mongodb.com/manual/installation](https://docs.mongodb.com/manual/installation)
* **Clone this project to your local machine**
```
git clone https://github.com/haleyysz/Metropolist.git
```
* **Run MongoDB**
```
mongod
```
* **Run Application**
```
npm start
```
* **Open in browser** 
[http://localhost:3000](http://localhost:3000)

* Now you can register as a new user via [http://localhost:3000/signup](http://localhost:3000/signup)
* Or login as an old user [http://localhost:3000/login](http://localhost:3000/login) <br>

* There is a default admin:
```
email: admin@admin.com
password: adminABC123
```
