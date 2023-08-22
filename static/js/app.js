const BookShow = {
  props: {
    username: String,
  },
  template:`
  <div>
    <h2>Book Show Tickets</h2>

    <div>
      <label>Choose Date:</label>
      <input type="date" v-model="selectedDate" @change="fetchShowsByDate" />
    </div>

    <h3>Available Shows:</h3>
    <ul>
      <li v-for="show in availableShows" :key="show.show_id">
        <h3>{{ show.theatre_name }}</h3>
        <h4>{{ show.title }}</h4>
        <p>Timing: {{ show.timing }}</p>
        <p>Available Seats: {{ show.available_seats }}</p>
        <p>Price: {{ show.price }}</p>
        <button @click="bookTickets(show)">Book Tickets</button>
      </li>
    </ul>

    <div v-if="bookingShow">
      <h3>Booking Tickets for {{ bookingShow.title }} in {{ bookingShow.theatre_name }}</h3>
      <label>No.of tickets:</label>
      <input type="number" v-model="quantity" min="1" :max="bookingShow.available_seats" />
      <button @click="confirmBooking">Confirm Booking</button>
    </div>
  </div>`,

  data() {
    return {
      username: this.username,
      quantity: 1,
      selectedDate: '',
      availableShows: [],
      bookingShow: null,
    };
  },
  methods: {
    async fetchShowsByDate() {
      try {
        const response = await fetch(`/api/getshows?start_time=${this.selectedDate}T00:00&end_time=${this.selectedDate}T23:59`);
        if (response.ok) {
          this.availableShows = await response.json();
        } else {
          console.error('Error fetching available shows');
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    },
    bookTickets(show) {
      this.bookingShow = show;
    },
    async confirmBooking() {
      if (this.quantity > this.bookingShow.available_seats) {
        alert('Houseful! Not enough seats available.');
        return;
      }

      try {
        const bookingData = {
          show_id: this.bookingShow.show_id,
          num_tickets: this.quantity,
          username: this.username,
        };

        const response = await fetch('/api/bookings', {
          method: 'POST',
          body: JSON.stringify(bookingData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          alert('Tickets booked successfully');
          this.bookingShow = null;
          this.availableShows = this.fetchShowsByDate();
        } else {
          const errorMessage = await response.json();
          alert(errorMessage.message || 'Error booking tickets');
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    },
  },
};

const UserDashboard = {
  props: {
    username: String,
  },
  template: `
    <div>
      <h1>User Dashboard</h1>
      <div>
        <h2>Search Theatres</h2>
        <input v-model="location" placeholder="Enter location">
        <button @click="searchTheatres">Search Theatres</button>
        <ul v-if="theatres.length">
          <li v-for="theatre in theatres" :key="theatre.id">{{ theatre.title }} - {{ theatre.caption }}</li>
        </ul>

        <h2>Search Shows</h2>
        <input v-model="tags" placeholder="Enter tags">
        <input v-model="minRating" placeholder="Minimum Rating">
        <button @click="searchShows">Search Shows</button>
        <ul v-if="shows.length">
          <li v-for="show in shows" :key="show.id">{{ show.title }} - Timing: {{ show.timing }} - Price: {{ show.price }}</li>
        </ul>
      </div>
      <div>
          <book-show :username="username"></book-show>
      </div>
    </div>
  `,
  data() {
    return {
      username: this.username,
      location: '',
      theatres: [],
      tags: '',
      minRating: '',
      shows: [],
    };
  },
  components: {
    BookShow,
  },
  methods: {
    async searchTheatres() {
      try {
        const response = await fetch(`/api/search/theatres?location=${this.location}`);
        const data = await response.json();
        this.theatres = data;
      } catch (error) {
        console.error('Error searching theatres:', error);
      }
    },
    async searchShows() {
      try {
        const params = new URLSearchParams();
        if (this.tags) params.append('tags', this.tags);
        if (this.minRating) params.append('min_rating', this.minRating);
        const response = await fetch(`/api/search/shows?${params.toString()}`);
        const data = await response.json();
        this.shows = data;
      } catch (error) {
        console.error('Error searching shows:', error);
      }
    },
  },
}

const ShowManagement = {
  props: ['theatre'],
  template: `
    <div>
      <h3>Show Management for {{ selectedTheatre.title }}</h3>

      <button @click="createForm()">Create Show</button>
      <!-- Create Show Form -->
      <div v-if="createshowForm">
      <h4>Create New Show</h4>
      <form @submit.prevent="createShow">
        <div>
          <label>Name:</label>
          <input type="text" v-model="newShow.title" required />
        </div>
        <div>
          <label>Rating:</label>
          <input type="number" v-model="newShow.rating" required />
        </div>
        <div>
          <label>Capacity:</label>
          <input type="number" v-model="newShow.capacity" required />
        </div>
        <div>
          <label>Timing:</label>
          <input type="datetime-local" v-model="newShow.timing" required />
        </div>
        <div>
          <label>Tags:</label>
          <input type="text" v-model="newShow.tags" required />
        </div>
        <div>
          <label>Price:</label>
          <input type="number" v-model="newShow.price" required />
        </div>
        <button type="submit">Create</button>
      </form>
      </div>
      

      <!-- List of Shows with Edit and Remove Buttons -->
      <h4>Shows List</h4>
      <ul>
        <li v-for="show in shows" :key="show.id">
          <h5>{{ show.title }}</h5>
          <p>Rating: {{ show.rating }}</p>
          <p>Capacity: {{ show.capacity }}</p>
          <p>Timing: {{ show.timing }}</p>
          <p>Tags: {{ show.tags }}</p>
          <p>Price: {{ show.price }}</p>
          <button @click="editShow(show)">Edit</button>
          <button @click="confirmRemoveShow(show)">Remove</button>
        </li>
      </ul>

      <!-- Edit Show Form -->
      <div v-if="editingShow">
        <h4>Edit Show</h4>
        <form @submit.prevent="updateShow">
          <div>
            <label>Name:</label>
            <input type="text" v-model="editedShow.title" required />
          </div>
          <div>
            <label>Rating:</label>
            <input type="number" v-model="editedShow.rating" required />
          </div>
          <div>
            <label>Capacity:</label>
            <input type="number" v-model="editedShow.capacity" required />
          </div>
          <div>
            <label>Timing:</label>
            <input type="datetime-local" v-model="editedShow.timing" required />
          </div>
          <div>
            <label>Tags:</label>
            <input type="text" v-model="editedShow.tags" required />
          </div>
          <div>
            <label>Price:</label>
            <input type="number" v-model="editedShow.price" required />
          </div>
          <button type="submit">Save</button>
          <button @click="cancelEdit">Cancel</button>
        </form>
      </div>
    </div>
  `,
  data() {
    return {
      newShow: {
        title: '',
        rating: '',
        capacity: '',
        timing: '',
        tags: '',
        price: '',
        theatre_id: '',
      },
      selectedTheatre: this.theatre,
      shows: [], // List of shows
      editingShow: null, // Show being edited
      editedShow: {}, // Edited show details
      createshowForm: false,
    };
  },

  methods: {
    async createShow() {
      try {
        const showData = {
          title: this.newShow.title,
          rating: this.newShow.rating,
          capacity: this.newShow.capacity,
          timing: this.newShow.timing,
          tags: this.newShow.tags,
          price: this.newShow.price,
          theatre_id: this.selectedTheatre.id,
        };
        const response = await fetch('/api/shows', {
          method: 'POST',
          body: JSON.stringify(showData),
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          // Show created successfully, refresh the list of shows
          this.getShows();
          // Clear the newShow object to reset the form
          this.newShow = {
            title: '',
            rating: '',
            capacity: '',
            timing: '',
            tags: '',
            price: '',
            theatre_id: this.selectedTheatre.id,
          };
        } else {
          console.error('Error creating show abcd:', response.statusText);
        }
      } catch (error) {
        // Handle error if the API call fails
        console.error('Error creating show:', error);
      }finally{
        this.createshowForm = false;
      }
    },

    async getShows() {
      try {
        const theatreData = {
          id: this.theatre.id,
        }
        const response = await fetch(`/api/shows/${theatreData.id}`);
        if (response.ok) {
          const data = await response.json();
          this.shows = data; // Assuming the response returns an array of shows
        } else {
          console.error('Error fetching shows:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching shows:', error);
      }
    },
    createForm() {
      this.createshowForm = true;
    },
    editShow(show) {
      this.editingShow = show;
      this.editedShow = { ...show };
    },
    async updateShow() {
      try {
        const showData = {
          id: this.editingShow.id,
          title: this.editedShow.title,
          rating: this.editedShow.rating,
          capacity: this.editedShow.capacity,
          timing: this.editedShow.timing,
          tags: this.editedShow.tags,
          price: this.editedShow.price,
          theatre_id: this.editingShow.theatre_id,
        };
        
        const response = await fetch(`/api/shows/${showData.id}`, {
          method: 'PUT',
          body: JSON.stringify(showData),
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        if (response.ok) {
          // Show updated successfully, refresh the list of shows
          this.getShows();
          this.cancelEdit(); // Cancel the edit mode after successful update
        } else {
          console.error('Error updating show!!', response.statusText);
        }
      } catch (error) {
        // Handle error if the API call fails
        console.error('Error updating show:', error);
      }
    },
    
    cancelEdit() {
      this.editingShow = null;
      this.editedShow = {};
    },
    async confirmRemoveShow(show) {
      if (window.confirm('Are you sure you want to remove this show?')) {
        try {
          const response = await fetch(`/api/shows/${show.id}`, {
            method: 'DELETE',
          });
      
          if (response.ok) {
            // Show removed successfully, refresh the list of shows
            this.getShows();
          } else {
            console.error('Error removing show:', response.statusText);
          }
        } catch (error) {
          // Handle error if the API call fails
          console.error('Error removing show:', error);
        }
      }
    },
    
  },
  created() {
    // Fetch initial list of theatres when the component is created
    this.getShows();
  },
};

const AdminDashboard = {
  template: `
  <div>
    <h2>Admin Dashboard</h2>

    <!-- Create Theatre Form -->
    <h3>Create New Theatre</h3>
    <form @submit.prevent="createTheatre">
      <div>
        <label>Title:</label>
        <input type="text" v-model="newTheatre.title" required />
      </div>
      <div>
        <label>Caption:</label>
        <input type="text" v-model="newTheatre.caption" required />
      </div>
      <div>
        <label>Place:</label>
        <input type="text" v-model="newTheatre.place" required />
      </div>
      <button type="submit">Create</button>
    </form>

    <!-- List of Theatres with Edit and Remove Buttons -->
    <h3>Theatres List</h3>
    <ul>
      <li v-for="theatre in theatres" :key="theatre.id">
        <h4>{{ theatre.title }}</h4>
        <p>{{ theatre.caption }}</p>
        <p>Place: {{ theatre.place }}</p>
        <button @click="editTheatre(theatre)">Edit</button>
        <button @click="confirmRemoveTheatre(theatre)">Remove</button>
        <show-management :theatre="theatre"/>
      </li>
    </ul>

    <!-- Edit Theatre Form -->
    <div v-if="editingTheatre">
      <h3>Edit Theatre</h3>
      <form @submit.prevent="updateTheatre">
        <div>
          <label>Title:</label>
          <input type="text" v-model="editedTheatre.title" required />
        </div>
        <div>
          <label>Caption:</label>
          <input type="text" v-model="editedTheatre.caption" required />
        </div>
        <div>
          <label>Place:</label>
          <input type="text" v-model="editedTheatre.place" required />
        </div>
        <button type="submit">Save</button>
        <button @click="cancelEdit">Cancel</button>
      </form>
    </div>
  </div>
`,
  components: {
    ShowManagement,
  },
  data() {
    return {
      newTheatre: {
        title: '',
        caption: '',
        place: '',
      },
      theatres: [], // List of theatres
      editingTheatre: null, // Theatre being edited
      editedTheatre: {}, // Edited theatre details
    };
  },
  methods: {
    async createTheatre() {
      try {
        const theatreData = {
          title: this.newTheatre.title,
          caption: this.newTheatre.caption,
          place: this.newTheatre.place,
        };
  
        const response = await fetch('/api/theatres', {
          method: 'POST',
          body: JSON.stringify(theatreData),
          headers: {
            'Content-Type': 'application/json',
            // Include any necessary headers (e.g., authorization token)
          },
        });
  
        if (response.ok) {
          // Refresh the list of theatres after a successful creation
          this.fetchTheatres();
  
          // Clear the form fields
          this.newTheatre.title = '';
          this.newTheatre.caption = '';
          this.newTheatre.place = '';
  
          // Optionally show a success message to the user
          alert('Theatre created successfully');
        } else {
          // Handle error cases
          const errorMessage = await response.text();
          console.error(errorMessage);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    },

    async fetchTheatres() {
      try {
        const response = await fetch('/api/theatres', {
          method: 'GET',
        });

        if (response.ok) {
          const theatreData = await response.json();
          this.theatres = theatreData; // Update the theatres data
        } else {
          // Handle error cases
          const errorMessage = await response.text();
          console.error(errorMessage);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    },

    editTheatre(theatre) {
      this.editingTheatre = theatre;
      this.editedTheatre = { ...theatre };
    },

    async updateTheatre() {
      try {
        const response = await fetch(`/api/theatres/${this.editedTheatre.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // Include any necessary headers (e.g., authorization token)
          },
          body: JSON.stringify({
            title: this.editedTheatre.title,
            caption: this.editedTheatre.caption,
            place: this.editedTheatre.place,
          }),
        });

        if (response.ok) {
          // Update the theatres list with the edited theatre data
          const index = this.theatres.findIndex(theatre => theatre.id === this.editedTheatre.id);
          if (index !== -1) {
            this.theatres[index] = {
              ...this.theatres[index],
              title: this.editedTheatre.title,
              caption: this.editedTheatre.caption,
              place: this.editedTheatre.place,
            };
          }
          // Cancel the edit mode
          this.cancelEdit();
        } else {
          // Handle error cases
          const errorMessage = await response.text();
          console.error(errorMessage);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    },

    cancelEdit() {
      this.editingTheatre = null;
      this.editedTheatre = {};
    },

    async confirmRemoveTheatre(theatre) {
      if (window.confirm('Are you sure you want to remove this theatre?')) {
        try {
          const response = await fetch(`/api/theatres/${theatre.id}`, {
            method: 'DELETE',
            headers: {
              // Include any necessary headers (e.g., authorization token)
            },
          });

          if (response.ok) {
            // Remove the theatre from the theatres list
            this.theatres = this.theatres.filter(item => item.id !== theatre.id);
          } else {
            // Handle error cases
            const errorMessage = await response.text();
            console.error(errorMessage);
          }
        } catch (error) {
          console.error('An error occurred:', error);
        }
      }
    },
  },
  created() {
    // Fetch initial list of theatres when the component is created
    this.fetchTheatres();
  },
};


const LoginForm = {
  template: `
    <div>
      <h2>Login</h2>
      <form @submit.prevent="login">
        <div>
          <label for="username">Username:</label>
          <input type="text" id="username" v-model="username" required />
        </div>
        <div>
          <label for="password">Password:</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <div>
          <button type="submit">Login</button>
        </div>
      </form>
    </div>
  `,
  data() {
    return {
      username: '',
      password: '',
    };
  },
  methods: {
    login() {
        fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: this.username, password: this.password }),
          })
            .then(response => response.json())
            .then(data => {
              localStorage.setItem('access_token', data.access_token);
              console.log(data.message,data.username);
              this.$emit('login-success', data.message,data.username); 
            })
            .catch(error => {
              console.error(error);
            });
    },
  },
};

const SignupForm = {
    template: `
      <div>
        <h2>Sign Up</h2>
        <form @submit.prevent="signup">
          <div>
            <label for="username">Username:</label>
            <input type="text" id="username" v-model="username" required />
          </div>
          <div>
            <label for="mail">Email:</label>
            <input type="email" id="mail" v-model="email" required />
          </div>
          <div>
            <label for="password">Password:</label>
            <input type="password" id="password" v-model="password" required />
          </div>
          <div>
            <button type="submit">Sign Up</button>
          </div>
        </form>
      </div>
    `,
    data() {
      return {
        username: '',
        email: '',
        password: '',
      };
    },
    methods: {
      signup() {
        fetch('/api/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: this.username,email: this.email,password: this.password }),
          })
            .then(response => response.json())
            .then(data => {
              console.log(data.message);
              this.$emit('signup-success');
            })
            .catch(error => {
              console.error(error);
            });
      },
    },
  };

new Vue({
  el: '#app',
  delimiters: ['${','}'],
  components: {
    LoginForm, 
    SignupForm,
    AdminDashboard,
    UserDashboard,
  },
  data() {
    return {
      loggedInUsername: '',
      showLoginForm: true,
      showSignupForm: false,
      showAdminDashboard: false,
      showUserDashboard: false,
    };
  },
  methods: {
    toggleForm(formName) {
      if (formName === 'login') {
        this.showLoginForm = true;
        this.showSignupForm = false;
        this.showAdminDashboard = false;
        this.showUserDashboard = false;
      } else if (formName === 'signup') {
        this.showLoginForm = false;
        this.showSignupForm = true;
        this.showAdminDashboard = false;
        this.showUserDashboard = false;
      }
    },
    handleLoginSuccess(isAdmin, username) {
      console.log('Logged in successfully',username);
      if (isAdmin) {
        this.showLoginForm = false;
        this.showSignupForm = false;
        this.showAdminDashboard = true; // Show admin dashboard
      }
      else{
        this.loggedInUsername = username;
        this.showLoginForm = false;
        this.showSignupForm = false;
        this.showUserDashboard = true; // Show user dashboard
      }
    },
    handleSignupSuccess() {   
        console.log('Signup successful');  
        this.showLoginForm = true;
        this.showSignupForm = false;
    },
  },
});