let express = require('express')
let passport = require('passport')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let session = require('express-session')
let mongoose = require('mongoose')
let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let morgan = require('morgan')
let flash = require('connect-flash')

let passportMiddleware = require('./middleware/passport')
let routes =  require('./routes.js')

let User = require('./models/User.js')

require('songbird')

let app = new express()
app.passport = passport
const PORT = process.env.PORT || 8000

app.use(morgan('dev'))
app.use(cookieParser('ilovethenodejs'))    
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

mongoose.connect('mongodb://127.0.0.1:27017/myblogger')

app.use(session({
  secret: 'ilovethenodejs',
  resave: true,
  saveUninitialized: true
}))


app.use(passport.initialize())


app.use(passport.session())
app.use(flash())
app.listen(PORT, () => console.log(`LISTENING @ http://127.0.0.1:${PORT}`))

let user = {
    email: 'foo@b.com',
   password: 'Asdf1'
}

passportMiddleware(app)
routes(app)



