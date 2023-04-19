const express = require("express");
const app = express();
const PORT = 3000; // default port 8080
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = function(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let newShortURL = '';

  for (let i = 0; i <= length; i++) {
    const randomGeneration = Math.floor(Math.random() * characters.length);
    newShortURL += characters.charAt(randomGeneration);
  }
  return newShortURL;
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const id = generateRandomString(6); // generates new shortURL
  urlDatabase[id] = req.body.longURL; // req.body.longURL = new longURL
  res.redirect(`/urls/${id}`);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
   };
  res.render('urls_show', templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL]
  };

  res.render('urls_show', templateVars);
});

// URL update route
app.post('/urls/:id', (req, res) => {
  const shortURL = req.params.id
  const longUpdatedURL = req.body.longURL

  if (!shortURL) return res.status(403).send('Field cannot be empty')

  urlDatabase[shortURL] = longUpdatedURL

  return res.redirect('/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Adding Cookies and Setting Up Login

app.get('/login', (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render('partials/_header', templateVars);
});

app.post('/login', (req, res) => {
  const username = req.body.username
  res.cookie('username', username);
  res.redirect('/urls');
});

// Logout functionality

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});