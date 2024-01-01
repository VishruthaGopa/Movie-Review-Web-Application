//let favorites = [];
let updatedFavorites;
let userRole;

updateFavorite();
// Event listener for user list button
const usersPageButton = document.getElementById('user-list');
usersPageButton.style.display = 'none';

// CREATE
function getMovie() {
  let movieName = document.getElementById('movie').value;
  if (movieName === '') {
    return alert('Please enter a movie');
  }

  let movieDiv = document.getElementById('moviedetails');
  movieDiv.innerHTML = '';

  // Clear the input field after submission
  document.getElementById('movie').value = '';

  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      let response = JSON.parse(xhr.responseText);

      for (let i = 0; i < Math.min(response.results.length, 8); i++) {
        const movie = response.results[i];
        const posterUrl = movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : 'logo/placeholderPoster.png'; // placeholder poster

        const releaseDate = movie.release_date
          ? `<p><strong>Release Date:</strong> ${movie.release_date}</p>`
          : '<p><strong>Release Date:</strong> Not available</p>';

        const movieDetails = `
          <div class="movie-container">
              <div class="movie-details">
                  <h1>${movie.title}</h1>
                  <img src="${posterUrl}" alt="${movie.title} Poster" />
                  ${releaseDate}
                  <p><strong>Overview:</strong> ${movie.overview}</p>
                  <button class="favorite-btn" onclick="addFavorite(${JSON.stringify(movie).replace(/"/g, '&quot;')})">💙</button>
                  </div>
          </div>
        `;
        
        movieDiv.innerHTML += movieDetails;
      }
    }
  };

  xhr.open('GET', `/movies?query=${movieName}&limit=8`, true);
  xhr.send();
}

function addFavorite(movie) {
    // Get the actual user ID and username from your authentication/session
    const movieId = movie.id; 
    const title = movie.title;
    const overview = movie.overview;
    const posterPath = movie.poster_path;
  
    // Make an HTTP POST request to your server
    fetch('/addFavorite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ movieId, title, overview, posterPath }),
    })
      .then((response) => response.json())
      .then((data) => {
        //console.log(data.message);
        //console.log("Data received from the server:", data);

        // Update the UI with the updated list of favorites        
        updateFavorite(); //call func
      
      })
      .catch((error) => {
        console.error('Error:', error);
        // Handle the error appropriately
      });
}


function updateFavorite() {
  // Make an HTTP GET request to your server to get the updated favorites
  fetch('/getFavorites')
    .then((response) => response.json())
    .then((data) => {
      favorites = data.favorites
      userRole = data.user_role

      // Event listener for user list button
      const usersPageButton = document.getElementById('user-list');
      
      if (userRole === "admin") {
        // If the user is an admin, show the button
        usersPageButton.style.display = 'block';
      }

      // Update the UI with the updated list of favorites
      updateFavoritesList(data.favorites);
    })
    .catch((error) => {
      console.error('Error:', error);
      // Handle the error appropriately
    });

}

function updateFavoritesList() {
  // Clear the current favorites list
  const favoritesList = document.getElementById('favorites-list');
  favoritesList.innerHTML = '';

  // Display each movie in the favorites array
  favorites.forEach((movie) => {
    displayFavorite(movie);
  });
}

function displayFavorite(movie) {
  const favoritesList = document.getElementById('favorites-list');
  const movieElement = document.createElement('div');
  movieElement.classList.add('movie-container');
  
  const posterUrl = movie.poster
    ? `https://image.tmdb.org/t/p/w500${movie.poster}`
    : 'logo/placeholderPoster.png'; // placeholder poster

  movieElement.innerHTML = `
    <div class="movie-details">
      <h1>${movie.title}</h1>
      <img src="${posterUrl}" alt="${movie.title} Poster" />
      <p><strong>Overview:</strong> ${movie.overview}</p>
      <button class="favorite-btn" onclick="removeFromFavorites(${JSON.stringify(movie).replace(/"/g, '&quot;')})"> Remove </button>
    </div>
  `;
  
  favoritesList.appendChild(movieElement);
}

function removeFromFavorites(movie) {
  console.log("remove clicked");
  const movieId = movie.movie_id; // Assuming the movie object has an 'id' property

  // Make an HTTP DELETE request to your server
  fetch('/removeFavorite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ movieId }),
  })
    .then((response) => response.json())
    .then((data) => {
      //console.log(data.message);
      // Update the UI with the updated list of favorites        
      updateFavorite(); //call func
  })
    .catch((error) => {
      console.error('Error:', error);
      // Handle the error appropriately
    });
}



const ENTER = 13;

function handleKeyUp(event) {
  event.preventDefault();
  if (event.keyCode === ENTER) {
    document.getElementById("submit_button").click();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('submit_button').addEventListener('click', getMovie);
  
  // Add key handler for the document as a whole, not separate elements.
  document.addEventListener('keyup', handleKeyUp);
  
  // Event listener for logout button
  document.getElementById('logoutButton').addEventListener('click', function () {
    // Make a request to the server to logout
    fetch('/logout', {
      method: 'GET',
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === 'Logout successful') {
          // Redirect to the login page after successful logout
          window.location.href = '/loginAndRegister';
        } else {
          console.error('Logout failed');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  });


    // Event listener for logout button
    document.getElementById('user-list').addEventListener('click', function () {
      if (userRole === 'admin') {
        // Redirect to the users' page
        window.location.href = '/users';
      } else {
        // Handle non-admin users
        console.log('You do not have permission to access the users page.');
      }  
    });  
    
});
