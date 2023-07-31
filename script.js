'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.distance = distance; //km
    this.duration = duration; //min
    this.coords = coords; //array[lat,lng]
  }

  _description() {
    const month = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      month[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.clacPace();
    this._description();
  }
  clacPace() {
    this.pace = this.duration / this.distance; //min/km
    return this;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.clacSpeed();
    this._description();
  }
  clacSpeed() {
    this.speed = this.distance / (this.duration / 60); //km/h
    return this;
  }
}
class App {
  #map;
  #mapClickEvent;
  mapZoom = 13;
  workout = [];
  constructor() {
    this._getLocalStorage();
    this._loadMap();
    form.addEventListener('submit', this._handelSubmit.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener(
      'click',
      this._onWorkoutClick.bind(this)
    );
  }
  _getPosition(position) {
    const { longitude, latitude } = position.coords;
    const coord = [latitude, longitude];
    this.#map = L.map('map').setView(coord, this.mapZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 13,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>',
    }).addTo(this.#map);
    this.workout.forEach(d => {
      this._addMarkToMap(d);
    });
    this.#map.on('click', this._onMapClick.bind(this));
  }
  _loadMap() {
    navigator?.geolocation?.getCurrentPosition(
      this._getPosition.bind(this),
      function () {
        alert('your position was not found');
      }
    );
  }

  _showForm() {
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }
  _showHideForm() {
    form.classList.toggle('hidden');
    inputDistance.focus();
  }
  _toggleElevationField() {
    inputCadence.closest('div').classList.toggle('form__row--hidden');
    inputElevation.closest('div').classList.toggle('form__row--hidden');
  }

  _onMapClick(e) {
    this.#mapClickEvent = e;
    this._showForm();
  }
  _handelSubmit(e) {
    e.preventDefault();
    let workout;
    //helper function
    const validateInput = (...inputs) => inputs.every(i => isFinite(i));
    const isPositive = (...inputs) => inputs.every(i => i > 0);
    //get coordinates
    const { lng, lat } = this.#mapClickEvent.latlng;
    //get the date from the user
    const type = document.querySelector('.form__input--type').value;
    const distance = document.querySelector('.form__input--distance').value;
    const duration = document.querySelector('.form__input--duration').value;
    //if running create workout running
    if (type === 'running') {
      const cadence = document.querySelector('.form__input--cadence').value;
      console.log('type:running');
      //validate the data
      if (
        !validateInput(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      )
        return alert('The inputs must be positive numbers and not empty');

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    //if cycling create workout cycling
    if (type === 'cycling') {
      const elevationGain = document.querySelector(
        '.form__input--elevation'
      ).value;
      //validate the data
      if (
        !validateInput(distance, duration, elevationGain) ||
        !isPositive(distance, duration)
      )
        return alert('The inputs must be positive numbers and not empty');
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }
    //add workout market to the map
    this._addMarkToMap(workout);
    //add workout  to the list
    this.workout.push(workout);
    //update the local storage
    this._setLocalStorage(workout);
    //add workout to sidbar
    this._addWorkOut(workout);
    //hide the form + clear the inputs
    this._hideForm();
  }
  _addMarkToMap({ type, coords, description }) {
    const popup = L.popup({
      maxWidth: 250,
      maxHeight: 100,
      autoClose: false,
      closeOnClick: false,
      className: `${type}-popup`,
    }).setContent(
      `${
        type === 'running' ? '🏃‍♂️' : type === 'cycling' ? '🚴‍♀️' : ''
      } ${description}`
    );
    L.marker(coords).addTo(this.#map).bindPopup(popup).openPopup();
  }

  _addWorkOut({ type, id, distance, duration, description, ...otherProps }) {
    let html = `
     <li class="workout workout--${type}" data-id=${id}>
          <h2 class="workout__title">${description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              type === 'running' ? '🏃‍♂️' : type === 'cycling' ? '🚴‍♀️' : ''
            }</span>
            <span class="workout__value">${distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;
    if (type === 'cycling') {
      const { elevationGain, speed } = otherProps;
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
    </li>`;
    }

    if (type === 'running') {
      const { pace, cadence } = otherProps;
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
    </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _onWorkoutClick(e) {
    const workout_id = e.target.closest('.workout');
    if (!workout_id) return;

    console.log(this.workout);
    const { coords } = this.workout.find(e => e.id === workout_id.dataset.id);
    this.#map.setView(coords, this.mapZoom, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.workout));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    if (!data) return;
    this.workout = data;
    data.forEach(d => {
      this._addWorkOut(d);
    });
  }
}

const app = new App();
