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
//GET Route to Show the Home Page
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"],};
  res.render("urls_index", templateVars);
});
//GET Route to Show the Form
app.get("/urls_new", (req, res) => {
  let templateVars = { username: req.cookies["username"],};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase, username: req.cookies["username"],};
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
  let templateVars = { urls: urlDatabase, username: req.cookies["username"],};
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
  let templateVars = { urls: urlDatabase, username: req.cookies["username"],};
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
  let templateVars = { urls: urlDatabase, username: req.cookies["username"],};
  res.redirect("urls_index", templateVars);
});

// Logout
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
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

