const http = require('http')
const express = require('express') //express framework
const session = require('express-session');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
var path = require('path');
let ID = 0;
let user_id = null;
let isAuthenticated = false;
let user_role = null;

// sqlite3 + database
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/movie_database.db');

const PORT = process.env.PORT || 3000 //allow environment variable to possible set PORT

let API_KEY = '7aca9bef7f434930122ff32085e07298'; //<== API KEY HERE
const app = express()

//Middleware
app.use(express.static(__dirname + '/public')) //static server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use express-session middleware to set up sessions
app.use(session({
  secret: 'your-secret-key', // Replace with a strong secret key
  resave: false,
  saveUninitialized: true,
}));

// Set up Handlebars as the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


//Routes
app.get('/', (request, response) => {
  response.sendFile(__dirname + '/views/authentication.html')
})

app.get('/loginAndregister', (request, response) => {
  //response.redirect('/');

  if (!request.session || !request.session.user) {
    response.sendFile(__dirname + '/views/authentication.html');
  } else {
    // User is already authenticated, redirect to another page (e.g., /movieclub)
    response.redirect('/movieclub');
  }
})



// Middleware function to check authentication
function authenticateUser(req, res, next) {
  //console.log(isAuthenticated)
  if (isAuthenticated) {
    // User is authenticated, allow access to the route
    next();
  } else {
    // User is not authenticated, redirect to login page or send an error response
    console.log("Not Authenticated.")
    res.redirect('/loginAndRegister');
  }
}

// authentication middleware to the routes you want to protect
app.get('/movieclub', authenticateUser, (request, response) => {
  response.sendFile(__dirname + '/views/index.html');
});

// Route for admin user pages
app.get('/users', (req, res) => {
  // Retrieve user entries from the database
  const sqlString = "SELECT * FROM users";
  db.all(sqlString, [], (err, rows) => {
     if (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
     } else {
        if (isAuthenticated && user_role === 'admin') {
          // Render the HBS template with user entries
          res.render('users', { title: 'Admin User Pages', userEntries: rows });
        }else{
          if (isAuthenticated){
            res.render('users', { title: 'Need Admin Privileges to view User List', userEntries: "Not allowed to view" });

            //res.redirect('/loginAndRegister');
            //res.redirect('/movieclub');
            console.log("Insufficient Role.");
          }else{
            // User is not authenticated
            console.log("Not Authenticated");
            res.redirect('/loginAndRegister');
          }
        }
     }
  });
});

// New route for user registration
app.post('/register', (req, res) => {
  const { regUsername, regPassword } = req.body;

  const sqlString = "INSERT INTO users (userid, password, role) VALUES (?, ?, ?)";
  db.run(sqlString, [regUsername, regPassword, 'guest'], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Registration failed. Please try again.' });
    } else {
      res.json({ message: 'Registration successful. Please login.' });
    }
  });
});

// New route for user login
app.post('/login', (req, res) => {
  const { loginUsername, loginPassword } = req.body;

  const sqlString = "SELECT * FROM users WHERE userid = ? AND password = ?";
  db.get(sqlString, [loginUsername, loginPassword], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ isAuthenticated: false });
    } else {
      if (row) {
        // User is found in the database
        const {id, userid, role } = row;
        console.log(row);
        ID = id;
        user_id = userid
        isAuthenticated = true;
        user_role = role;
        res.json({ isAuthenticated: true, role });
      } else {
        // User is not found in the database
        res.json({ isAuthenticated: false, role: null });
      }
    }
  });
});

// Route for user logout
app.get('/logout', (req, res) => {
  // Destroy the session to log the user out
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Logout failed' });
    } else {
      user_id = null;
      isAuthenticated = false;
      user_role = null;
      // Redirect the user to the login page after logout
      res.json({ message: 'Logout successful' });
    }
  });
});

app.post('/addFavorite', (req, res) => {
  const { movieId, title, overview, posterPath } = req.body;
  //console.log(movieId);

  // Insert the record into the user_content table
  const insertQuery = `
    INSERT INTO user_content (user_id, username, movie_id, title, overview, poster)
    VALUES (?, ?, ?, ?, ?, ?);
  `;

  db.run(insertQuery, [ID, user_id, movieId, title, overview, posterPath], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Error adding favorite' });
    } else {
      res.json({ message: 'Favorite added successfully' });
    }
  });
});

// Route to remove a movie from the favorites
app.post('/removeFavorite', (req, res) => {
  // Check if the user is authenticated
  if (!isAuthenticated) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { movieId } = req.body;
  const userId = ID; // Assuming you have the user ID stored in the ID variable
  //console.log(req.body);
  //console.log(movieId);

  // Replace this with your actual database query to remove the movie from favorites
  const removeFavoriteQuery = `
    DELETE FROM user_content WHERE user_id = ? AND movie_id = ?;
  `;

  db.run(removeFavoriteQuery, [userId, movieId], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Internal Server Error' });
    } else {
      res.json({ message: 'Favorite removed successfully' });
    }
  });
});

// Route to get the list of favorites for the logged-in user
app.get('/getFavorites', (req, res) => {
  // Check if the user is authenticated
  if (!isAuthenticated) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Replace this with your actual database query to retrieve favorites for the user
  const userId = ID; // Assuming you have the user ID stored in the ID variable
  const getFavoritesQuery = `
    SELECT * FROM user_content WHERE user_id = ?;
  `;

  db.all(getFavoritesQuery, [userId], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Internal Server Error' });
    } else {
      res.json({ favorites: rows, user_role  });
    }
  });
});

app.get('/movies', (request, response) => {
  let query = request.query.query;
  if (!query) {
    // send json response to client using response.json() feature
    // of express
    response.json({ message: 'Please enter a movie query' });
    return;
  }

  let options = {
    host: 'api.themoviedb.org',
    path: `/3/search/movie?query=${encodeURIComponent(query)}&api_key=${API_KEY}&limit=${8}`
  };

  //create the actual http request and set up
  //its handlers
  http.request(options, function (apiResponse) {
    let movieData = '';
    apiResponse.on('data', function (chunk) {
      movieData += chunk;
    });
    apiResponse.on('end', function () {
      response.contentType('application/json').json(JSON.parse(movieData));
    });
  }).end(); // important to end the request
           //to actually send the message
})

//start server
app.listen(PORT, err => {
  if(err) console.log(err)
  else {
    console.log(`Server listening on port: ${PORT}`)
    console.log(`To Test:`)
    //console.log(`http://localhost:3000/movies?query=Inception`);
    console.log(`http://localhost:3000`)
    console.log(`http://localhost:3000/loginAndRegister`)
    console.log(`http://localhost:3000/movieclub`)
    console.log('http://localhost:3000/users')
  }
})
