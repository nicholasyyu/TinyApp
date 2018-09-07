var express = require("express");
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var app = express();
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

var PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var urlDatabase = {

};

const user = {
  "tempUser": {
    id: "userRandomID",
    email: "user@example.com",
    password: "123"
  },
}
//GET Route to Show the Home Page
app.get("/", (req, res) => {
  if(req.session.user_id){
    res.redirect("/urls");
  }else{
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  let key = checkUserLogin(req.session.user_id);
  let templateVars = { urls: urlDatabase, users: req.session.user_id, userEmail: user[key].email, };
  res.render("urls_index", templateVars);
});
//GET Route to Show the Form
app.get("/urls/new", (req, res) => {
  if(req.session.user_id){
    let key = checkUserLogin(req.session.user_id);
    let templateVars = { users: req.session.user_id, userEmail: user[key].email,};
    res.render("urls_new", templateVars);
  }else{
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  if(urlDatabase[req.params.id]){
    if(req.session.user_id){
      if(req.session.user_id === urlDatabase[req.params.id].userID){
        let key = checkUserLogin(req.session.user_id);
        let templateVars = { shortURL: req.params.id, urls: urlDatabase, users: req.session.user_id, userEmail: user[key].email,};
        res.render("urls_show", templateVars);
      }else{
        res.sendStatus(400);
      }
    }else{
      res.redirect("/login");
    }
  }else{
    res.sendStatus(400);
  }
});

app.post("/urls", (req, res) => {
  let newUrlKey = generateRandomString();
  urlDatabase[newUrlKey] = {
    url: req.body['longURL'],
    userID: req.session.user_id,
  };
  res.redirect("/urls/" + newUrlKey);
});

app.get("/u/:shortURL", (req, res) => {
  if(urlDatabase[req.params.shortURL]){
    let shortURL = req.params.shortURL;
    let longURL = urlDatabase[shortURL].url;
    res.redirect(longURL);
  }else{
    res.sendStatus(400);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  let updateURL = req.params.id;
  for (let key in urlDatabase) {
    if (key === updateURL) {
      delete urlDatabase[key];
    }
  }
  res.redirect("/urls");
});

//update long url
app.post("/urls/:id", (req, res) => {
  if(req.session.user_id){
    let updateURL = req.params.id;
    for (let key in urlDatabase) {
      if (key === updateURL) {
        urlDatabase[key].url = req.body['longURL'];
      }
    }
    res.redirect("/urls");
  }else{
    res.sendStatus(400);
  }
});

//Logout
app.post('/logout', (req, res) => {
  //res.clearCookie('user_id');
  req.session.user_id = null;
  res.redirect("/urls");
});

//Registration Page
app.get("/register", (req, res) => {
  let key = checkUserLogin(req.session.user_id);
  let templateVars = { urls: urlDatabase, users: req.session.user_id, userEmail: user[key].email,};
  res.render("registration_form", templateVars);
});

app.post("/register", (req, res) => {
  let check = checkUserRegisterContent(user, req.body.email, req.body.password);
  if(check === "goodUserAndPassword"){
    let userID = generateRandomString();
    let userData = {};
    userData["id"] = userID;
    userData["email"] = req.body.email;
    userData["password"] = bcrypt.hashSync(req.body.password, 10);
    user[userID] = userData;
    //res.cookie("user_id", users[userID].id);
    req.session.user_id = user[userID].id;
    res.redirect("/urls");
  }else if(check === "badUserAndPassword"){
    res.sendStatus(400);
  }
});

//User Login Page
app.get("/login", (req, res) => {
  let key = checkUserLogin(req.session.user_id);
  let templateVars = { urls: urlDatabase, users: req.session.user_id, userEmail: user[key].email,};
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  let check = checkUserLoginContent(user, req.body.email, req.body.password);
  if(check !== "badUserLogin"){
    //res.cookie("user_id", users[check].id);
    req.session.user_id = user[check].id;
    res.redirect("/urls");
  }else if(check === "badUserLogin"){
    res.sendStatus(403);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let charString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    randomString += charString.charAt(Math.floor(Math.random() * charString.length));
  }
  return randomString;
}

function checkUserRegisterContent(userdata, email, password){
  let count = 0;
  if(email.length !== 0 && password.length !== 0) {
    Object.keys(userdata).forEach(function(key) {
      if (userdata[key].email === email) {
        count++;
      }
    })
    if(count >= 1) {
      return "badUserAndPassword";
    }
    else {
      return "goodUserAndPassword";
    }
  }
  else {
    return "badUserAndPassword";
  }
}

function checkUserLoginContent(userdata, email, password){
  let count = 0;
  let result = "";
  if(email.length !== 0 && password.length !== 0) {
    Object.keys(userdata).forEach(function(key) {
      if (userdata[key].email === email && bcrypt.compareSync(password, userdata[key].password)) {
        count++;
        result = key;
      }
    })
    if(count >= 1) {
      return result;
    }
    else {
      return "badUserLogin";
    }
  }
  else {
    return "badUserLogin";
  }
}

function checkUserLogin(user_id){
  if(user_id){
    return user_id;
  }
  else{
    return "tempUser";
  }
}

