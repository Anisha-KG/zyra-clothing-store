const express=require('express')
const app=new express()
require('dotenv').config()
const db=require('./config/db')
db()


app.listen(process.env.PORT,()=>{
    console.log('server started')
})