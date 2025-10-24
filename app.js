const express=require('express')
const app=new express()
const path=require('path')
const multer=require('multer')
const userRouter=require('./routes/userRoutes')
const adminRouter=require('./routes/adminRouter')
const passport = require('./config/passport');
const session=require('express-session')
require('dotenv').config()
const db=require('./config/db')
const { json } = require('stream/consumers')
db()

app.set('views',[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])
app.set('view engine','ejs')
app.use(express.static(path.join(__dirname,'public')))
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(session({
  secret:process.env.SECRET_KEY,
  resave:false,
  saveUninitialized:false,
  cookie:{
    httpOnly:true,
    secure:false,
    maxAge:72*60*60*1000
  }
}))

app.use(passport.initialize());
app.use(passport.session());

app.use('/',userRouter)
app.use('/admin',adminRouter)

app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  // Multer file size or fileFilter errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Custom errors or other thrown errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(process.env.PORT,()=>{
  console.log('server started')
})