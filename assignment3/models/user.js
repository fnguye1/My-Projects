let mongoose = require('mongoose')
let nodeify = require('bluebird-nodeify')
//let bcrypt = require('bcrypt')
let crypto = require('crypto')
let SALT = 'CodePathHeartNodeJS'


let UserSchema = mongoose.Schema({
	username: {	
        type:String, 
        required: true },
    email: {
        type:String, 
        required: true	},
    password: { 
        type:String, 
        required: true	},
    blogTitle: {
        type:String, 
        required: false } ,
    blogDescription: String	
})


UserSchema.methods.generateHash = async function(password) {
  return await crypto.promise.pbkdf2(password, SALT, 100000, 512, 'sha512')
  return hash.toString('hex')
}

UserSchema.methods.validatePassword = async function(password) {
  return await crypto.promise.pbkdf2(password,  SALT, 100000, 512, 'sha512')
  return hash.toString('hex') == this.password
}

UserSchema.pre('save', function(callback) {
    nodeify(async()=> {
         if (!this.isModified('password')) return callback()
         this.password = await this.generateHash (this.password)
    }(), callback)
})


UserSchema.path('password').validate((pw) => {
	return pw.length >= 4 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw)
})

module.exports = mongoose.model('User', UserSchema)