const express = require("express");
const app = express();
const PORT = 3000; // default port 8080
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.com",
    userID: "aJ48lW"
  },
};

const users = {
  userRandomId: {
    id: "userRandomId",
    email: "a@a.com",
    password: "1234"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "b@b.com",
    password: "5678"
  },
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

const urlsForUser = (id) => {
  const userURLS = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLS[url] = urlDatabase[url].longURL;
    }
  }
  return userURLS;
}

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
  const user_id = req.cookies.user_id;

  if (!user_id) {
    return res.status(401).send('You are unauthorized to view this page. Please login or register first');
  }
  const templateVars = {
    urls: urlsForUser(user_id),
    user: users[req.cookies.user_id]
  };
  return res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user: users[req.cookies.user_id]
  };

  if (!user_id) {
    return res.redirect('/login');
  }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const user_id = req.cookies.user_id;

  if (!user_id) {
    return res.status(401).send('You are not authorized to view this page. Please sign in or register');
  }

  const id = generateRandomString(5); // generates new shortURL
  urlDatabase[id] = {
    longURL: req.body.longURL, // req.body.longURL = new longURL
    userID: user_id
  };
  return res.redirect(`/urls/${id}`);
});

app.get("/urls/:id", (req, res) => {
  const user_id = req.cookies.user_id;
  const urlDatabaseKeys = urlDatabase[req.params.id];

  if (!user_id) {
    return res.status(401).send('You are not authorized to view this page. Please sign in or register');
  }
  if (user_id !== urlDatabaseKeys.userID) {
    return res.status(401).send('You are not authorized to view this page');
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies.user_id]
  };

  return res.render('urls_show', templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;

  if (!longURL) {
    return res.status(404).send('404: URL not found');
  }
  return res.redirect(longURL);

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
  const user_id = req.cookies.user_id;
  const shortURL = req.params.id;
  const longUpdatedURL = req.body.longURL;
  const urlDatabaseKeys = urlDatabase[req.params.id];

  console.log("CHECK:", longUpdatedURL);
  console.log("SHORTURL:", urlDatabase[shortURL]);
  

  if (!shortURL) {
    return res.status(403).send('Field cannot be empty');

  } else if (!user_id) {
    return res.status(401).send('You are not authorized to view this page. Please sign in or register');

  } else if (user_id !== urlDatabaseKeys.userID) {
    return res.status(401).send('You are not authorized to edit this URL');
  }

  urlDatabase[shortURL].longURL = longUpdatedURL;

  return res.redirect('/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  const urlDatabaseKeys = urlDatabase[req.params.id];
  const user_id = req.cookies.user_id;

  if (!user_id) {
    return res.status(401).send('You are not authorized to view this page. Please sign in or register');
    
  } else if (user_id !== urlDatabaseKeys.userID) {
    return res.status(401).send('You are not authorized to delete this URL');
  }
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Adding Cookies and Setting Up Login

app.get('/login', (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user: users[req.cookies.user_id]
  };

  if (user_id) {
    return res.redirect('/urls');
  }
  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // lookup the user based on email provided
  let foundUser = null;

  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      foundUser = user;
    }
  }
  if (!foundUser) {
    return res.status(403).send('No user with that email found');
  }

  // does the provided password NOT match the one from the database?
  if (foundUser.password !== password) {
    return res.status(403).send('Passwords do not match');
  }

  res.cookie('user_id', foundUser.id);
  res.redirect('/urls');
});

// Logout functionality

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// User Registration

app.get('/register', (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user: users[req.cookies.user_id]
  };

  if (user_id) {
    return res.redirect('/urls');
  }

  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const randomID = generateRandomString(5);
  const user_id = randomID;
  const email = req.body.email;
  const password = req.body.password;

  // Is the email or password field blank?
  if (!email || !password) {
    return res.status(400).send('Error: email or password not entered. Please provide a valid email and password');
  }

  // if someone tries to register with an email that already exists:

  for (const userId in users) {
    if (users[userId].email === email) {
      return res.status(400).send('This email is already registered');
    }
  }

  users[randomID] = {
    id: user_id,
    email,
    password
  };

  res.cookie('user_id', user_id);
  res.redirect('/urls');

});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});