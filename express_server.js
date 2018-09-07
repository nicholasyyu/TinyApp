var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();
app.use(cookieParser());
var PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "123"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}
//GET Route to Show the Home Page
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, users: req.cookies["user_id"],};
  res.render("urls_index", templateVars);
});
//GET Route to Show the Form
app.get("/urls_new", (req, res) => {
  let templateVars = { users: req.cookies["user_id"],};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase, users: req.cookies["user_id"],};
  res.render("urls_show", templateVars);
});

//user name sign up POST
app.post("/urls/form", (req, res) => {
  res.cookie("username", req.body.userName);
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  let newUrlKey = generateRandomString();
  urlDatabase[newUrlKey] = req.body['longURL'];
  let templateVars = { urls: urlDatabase, users: req.cookies["user_id"],};
  res.redirect("urls_index", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  let updateURL = req.params.id;
  for (let key in urlDatabase) {
    if (key === updateURL) {
      delete urlDatabase[key];
    }
  }
  let templateVars = { urls: urlDatabase, users: req.cookies["user_id"],};
  res.redirect("urls_index", templateVars);
});

//update long url
app.post("/urls/:id", (req, res) => {
  let updateURL = req.params.id;
  for (let key in urlDatabase) {
    if (key === updateURL) {
      urlDatabase[key] = req.body['longURL'];
    }
  }
  let templateVars = { urls: urlDatabase, users: req.cookies["user_id"],};
  res.redirect("urls_index", templateVars);
});

// Logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

//Registration Page
app.get("/register", (req, res) => {
  let templateVars = { urls: urlDatabase, users: req.cookies["user_id"],};
  res.render("registration_form", templateVars);
});

app.post("/register", (req, res) => {
  let check = checkUserRegisterContent(users, req.body.email, req.body.password);
  if(check === "goodUserAndPassword"){
    let userID = generateRandomString();
    let userData = {};
    userData["id"] = userID;
    userData["email"] = req.body.email;
    userData["password"] = req.body.password;
    users[userID] = userData;
    res.cookie("user_id", users[userID].id);
    res.redirect("/urls");
  }else if(check === "badUserAndPassword"){
    res.sendStatus(400)
  }
});

//User Login Page
app.get("/login", (req, res) => {
  let templateVars = { urls: urlDatabase, users: req.cookies["user_id"],};
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  let check = checkUserLoginContent(users, req.body.email, req.body.password);
  if(check !== "badUserLogin"){
    res.cookie("user_id", users[check].id);
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
      if (userdata[key].email === email && userdata[key].password === password) {
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

