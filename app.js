const express=require('express')
const app=new express()
const path=require('path')
const userRouter=require('./routes/userRoutes')
require('dotenv').config()
const db=require('./config/db')
const { json } = require('stream/consumers')
db()

app.set('views',[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])
app.set('view engine','ejs')
app.use(express.static(path.join(__dirname,'public')))
app.use(express.urlencoded({extended:true}))
app.use(express.json())


app.use('/',userRouter)



app.listen(process.env.PORT,()=>{
    console.log('server started')
})