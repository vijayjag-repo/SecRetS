//jshint esversion:6
require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// const bcrypt = require('bcrypt'); - level 4: salting using bcrypt
// const saltRounds = 10;
// const encrypt = require('mongoose-encryption'); - level 2: database encrytion
// const md5 = require('md5'); - level 3: hashing


app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Little secret.",
    resave: false,
    saveUninitialized: false
}));

//initiliase passport
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser: true});
// to avoid deprecated warning
mongoose.set("useCreateIndex",true);

//schema for email and password entered by user
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);
//level 2 database encryption. We encrypt using the secret as a plugin to the mongoose schema.

//we want to encrpyt only the password.
//during save(), it is encrypted and during find(), it is decrypted and authenticated.
//secret shouldn't be publicly acessible.
// userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields: ['password']});

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    //if user is authenticated/already logged in, simply render the page. Else, redirect to login
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.get("/logout",function(req,res){
    //end user session
    req.logout();
    res.redirect("/");
});

//register using email id and password
app.post("/register",function(req,res){
    User.register({username: req.body.username},req.body.password,function(err,user){
        if(err){
            res.send(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                //callback will be triggered only if authentication is successful.
                res.redirect("/secrets");
            });
        }

    });
});

//login using email and password
app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    //we need to use passport to authenticate and login this user.
    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                //callback will be triggered only if authentication is successful.
                res.redirect("/secrets");
            });
        }
    });
});


app.listen(3000,function(){
    console.log("Successfully running on port 3000");
});