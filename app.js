//jshint esversion:6
require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
// const encrypt = require('mongoose-encryption'); - level 2: database encrytion
// const md5 = require('md5'); - level 3: hashing


app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser: true});

//schema for email and password entered by user
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//level 2 database encryption. We encrypt using the secret as a plugin to the mongoose schema.

//we want to encrpyt only the password.
//during save(), it is encrypted and during find(), it is decrypted and authenticated.
//secret shouldn't be publicly acessible.
// userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields: ['password']});

const User = new mongoose.model("User",userSchema);

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

//register using email id and password
app.post("/register",function(req,res){
    bcrypt.hash(req.body.password,saltRounds,function(err,hash){
        const newUser = new User({
            email: req.body.username,
            //level 3: using md5 to hash the password - md5(req.body.password)
            password: hash
        });
        newUser.save(function(err){
            if(!err){
                res.render("secrets");
            }
            else{
                console.log(err);
            }
        }); 
    });
    
});

//login using email and password
app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username},function(err,found){
        if(err){
            console.log(err)
        }
        else{ 
            if(found){
                bcrypt.compare(password,found.password,function(err,result){
                    if(result===true){
                        res.render("secrets");
                    }
                });
            }
        }
    });
});


app.listen(3000,function(){
    console.log("Successfully running on port 3000");
});