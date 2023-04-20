const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { getUserByEmail } = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080 not working; using port 3000 instead

// Configuration
app.set('view engine', 'ejs');

// Middleware

app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'cookiemonster',
  keys: ['kadhfiu348978ih3'],
}));

// Global Variables

const urlDatabase = {
  b6UTxQ: {
    longURL: 'https://www.tsn.ca',
    userID: 'aJ48lW'
  },
  i3BoGr: {
    longURL: 'https://www.google.com',
    userID: 'aJ48lW'
  },
};

const users = {
  userRandomId: {
    id: 'userRandomId',
    email: 'a@a.com',
    password: '$2a$10$raWRPjeXB8LaXK8nDK70YOkkOPYsZD5rAy0PBhBJvOpP.ZDa0ow9i'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'b@b.com',
    password: '$2a$10$HlzOLaHnzg8PDC7I8ECdseB.QzBpwdqJPM24mlnE9Nid7TGh59GSy'
  },
};

const generateRandomString = function(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let newShortURL = '';

  for (let i = 0; i < length; i++) {
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
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// GET route for My URLs page

app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;

  if (!user_id) {
    return res.status(401).send('You are unauthorized to view this page. Please login or register first');
  }
  const templateVars = {
    urls: urlsForUser(user_id),
    user: users[req.session.user_id]
  };
  return res.render("urls_index", templateVars);
});

// GET and POST routes for accessing and using New URLs page

app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = {
    user: users[req.session.user_id]
  };

  if (!user_id) {
    return res.redirect('/login');
  }
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;

  if (!user_id) {
    return res.status(401).send('You are not authorized to view this page. Please sign in or register');
  }

  const id = generateRandomString(6); // generates new shortURL
  urlDatabase[id] = {
    longURL: req.body.longURL, // req.body.longURL = new longURL
    userID: user_id
  };
  return res.redirect(`/urls/${id}`);
});

// GET routes to shortURLs page

app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
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
    user: users[req.session.user_id]
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

// GET and POST routes  for registering a new user

app.get('/register', (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = {
    user: users[req.session.user_id]
  };

  if (user_id) {
    return res.redirect('/urls');
  }

  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const user_id = generateRandomString(6);
  const email = req.body.email;
  const password = req.body.password;

  // Is the email or password field blank?
  if (!email || !password) {
    return res.status(400).send('Error: email or password not entered. Please provide a valid email and password');
  }

  // Does the email already exist in the database:

  const user = getUserByEmail(email, users);

  if (user) {
    return res.status(400).send('This email is already registered');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  users[user_id] = {
    id: user_id,
    email,
    password: hashedPassword
  };

  req.session.user_id = user_id;
  res.redirect('/urls');

});

// GET and POST routes for Login, including setting cookies

app.get('/login', (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = {
    user: users[req.session.user_id]
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

  const foundUser = getUserByEmail(email, users);

  if (!foundUser) {
    return res.status(403).send('No user with that email found. Please register for an account.');
  }

  // does the provided password NOT match the one from the database?
  if (!bcrypt.compareSync(password, foundUser.password)) {
    return res.status(403).send('Passwords do not match');
  }

  req.session.user_id = foundUser.id;
  res.redirect('/urls');
});

// POST route for Logout

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// POST route to edit/update URLs

app.post('/urls/:id', (req, res) => {
  const user_id = req.session.user_id;
  const shortURL = req.params.id;
  const longUpdatedURL = req.body.longURL;
  const urlDatabaseKeys = urlDatabase[req.params.id];

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

// POST route to delete URLs

app.post('/urls/:id/delete', (req, res) => {
  const urlDatabaseKeys = urlDatabase[req.params.id];
  const user_id = req.session.user_id;

  if (!user_id) {
    return res.status(401).send('You are not authorized to view this page. Please sign in or register');

  } else if (user_id !== urlDatabaseKeys.userID) {
    return res.status(401).send('You are not authorized to delete this URL');
  }
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});