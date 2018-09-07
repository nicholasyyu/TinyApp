var express = require("express");
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var app = express();

app.use(cookieSession({
  name: 'session',
  keys: ['key1'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var PORT = 8080; // default port 8080
const bcrypt = require('bcrypt');
var urlDatabase = {};
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

//GET Route to Show the URL Page
app.get("/urls", (req, res) => {

  let key = checkUserLogin(req.session.user_id);
  let templateVars = { urls: urlDatabase, users: req.session.user_id, userEmail: user[key].email, };
  res.render("urls_index", templateVars);

});

//GET Route to submit new URL to current user
app.get("/urls/new", (req, res) => {

  if(req.session.user_id) {
    let key = checkUserLogin(req.session.user_id);
    let templateVars = { users: req.session.user_id, userEmail: user[key].email,};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }

});

//GET Route to update current input URL
app.get("/urls/:id", (req, res) => {

  if(urlDatabase[req.params.id]) {
    if(req.session.user_id) {
      if(req.session.user_id === urlDatabase[req.params.id].userID) {
        let key = checkUserLogin(req.session.user_id);
        let templateVars = { shortURL: req.params.id, urls: urlDatabase, users: req.session.user_id, userEmail: user[key].email,};
        res.render("urls_show", templateVars);
      } else {
        res.sendStatus(400);
      }
    } else {
      res.redirect("/login");
    }
  } else {
    res.sendStatus(400);
  }

});

//POST Route to new URL and update URL page
app.post("/urls", (req, res) => {

  let newUrlKey = generateRandomString();
  urlDatabase[newUrlKey] = {
    url: req.body['longURL'],
    userID: req.session.user_id,
  };
  res.redirect("/urls/" + newUrlKey);

});

//GET Route to long URL website after input short URL ID
app.get("/u/:shortURL", (req, res) => {

  if(urlDatabase[req.params.shortURL]) {
    let shortURL = req.params.shortURL;
    let longURL = urlDatabase[shortURL].url;
    res.redirect(longURL);
  } else {
    res.sendStatus(400);
  }

});

//POST Route to delete URL based on URL ID
app.post("/urls/:id/delete", (req, res) => {

  let updateURL = req.params.id;
  for (let key in urlDatabase) {
    if (key === updateURL) {
      delete urlDatabase[key];
    }
  }
  res.redirect("/urls");

});

//POST Route to update long URL based on URL ID
app.post("/urls/:id", (req, res) => {

  if(req.session.user_id) {
    let updateURL = req.params.id;
    for (let key in urlDatabase) {
      if (key === updateURL) {
        urlDatabase[key].url = req.body['longURL'];
      }
    }
    res.redirect("/urls");
  } else {
    res.sendStatus(400);
  }

});

//POST Route to Logout
app.post('/logout', (req, res) => {

  req.session.user_id = null;
  res.redirect("/urls");

});

//GET Route to Registration Page
app.get("/register", (req, res) => {

  let key = checkUserLogin(req.session.user_id);
  let templateVars = { urls: urlDatabase, users: req.session.user_id, userEmail: user[key].email,};
  res.render("registration_form", templateVars);

});

//POST Route to store user register information
app.post("/register", (req, res) => {

  let check = checkUserRegisterContent(user, req.body.email, req.body.password);
  if(check === "goodUserAndPassword") {
    let userID = generateRandomString();
    let userData = {};
    userData["id"] = userID;
    userData["email"] = req.body.email;
    userData["password"] = bcrypt.hashSync(req.body.password, 10);
    user[userID] = userData;
    req.session.user_id = user[userID].id;
    res.redirect("/urls");
  } else if (check === "badUserAndPassword") {
    res.sendStatus(400);
  }

});

//GET Route to User Login Page
app.get("/login", (req, res) => {

  let key = checkUserLogin(req.session.user_id);
  let templateVars = { urls: urlDatabase, users: req.session.user_id, userEmail: user[key].email,};
  res.render("login", templateVars);

});

//POST Route to check user login information
app.post("/login", (req, res) => {

  let check = checkUserLoginContent(user, req.body.email, req.body.password);
  if(check !== "badUserLogin") {
    //res.cookie("user_id", users[check].id);
    req.session.user_id = user[check].id;
    res.redirect("/urls");
  }else if (check === "badUserLogin") {
    res.sendStatus(403);
  }

});

app.listen(PORT, () => {

  console.log(`Example app listening on port ${PORT}!`);

});

//generate random ID for URLs
function generateRandomString() {

  let charString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    randomString += charString.charAt(Math.floor(Math.random() * charString.length));
  }
  return randomString;

}
//check user register information based on user database and input form information
function checkUserRegisterContent(userdata, email, password) {

  let count = 0;
  if(email.length !== 0 && password.length !== 0) {
    Object.keys(userdata).forEach(function(key) {
      if (userdata[key].email === email) {
        count++;
      }
    })
    if(count >= 1) {
      return "badUserAndPassword";
    } else {
      return "goodUserAndPassword";
    }
  } else {
    return "badUserAndPassword";
  }

}

//verify the user email and password in user database
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
    } else {
      return "badUserLogin";
    }
  } else {
    return "badUserLogin";
  }
}

//check if any user logged in to display user email in _header.ejs
function checkUserLogin(user_id) {
  if(user_id) {
    return user_id;
  } else {
    return "tempUser";
  }
}