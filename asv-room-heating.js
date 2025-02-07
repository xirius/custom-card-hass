class AsvThermostatCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;

    const config = this._config;
    const tempState = hass.states[config.temp_entity];
    const humState  = hass.states[config.humidity_entity];
    const climateState = hass.states[config.climate_entity];

    // Get current sensor readings
    const currentTemp = tempState ? parseFloat(tempState.state) : NaN;
    const currentHum  = humState ? parseFloat(humState.state) : NaN;

    // Get climate setpoint
    // Many thermostats store setpoint in climateState.attributes.temperature
    // but check your device's attributes if it's different (target_temp, etc.)
    let targetTemp = climateState ? climateState.attributes.temperature : undefined;

    if (typeof targetTemp !== "number") {
      targetTemp = NaN;
    }

    this._currentTarget = targetTemp;

    // Update UI elements (using fallback values if necessary)
    this._currentTempEl.textContent = isNaN(currentTemp) ? "--" : currentTemp.toFixed(1);
    this._currentHumEl.textContent = isNaN(currentHum) ? "--" : currentHum.toFixed(0);
    this._setpointEl.textContent = isNaN(targetTemp) ? "--" : targetTemp.toFixed(1);

    // Button handlers
    this._minusBtn.onclick = () => this._adjustTemperature(targetTemp - 0.5);
    this._plusBtn.onclick  = () => this._adjustTemperature(targetTemp + 0.5);
  }

  setConfig(config) {
    // Basic validation
    if (!config.room_name || 
        !config.temp_entity || 
        !config.humidity_entity || 
        !config.climate_entity) {
      throw new Error("You must define 'room_name', 'temp_entity', 'humidity_entity', and 'climate_entity' in the card config.");
    }

    this._config = config;

    // Create a wrapper
    if (!this._wrapper) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("card");

      const style = document.createElement("style");
      style.textContent = `
        :host {
          display: block;
          margin: 8px;
        }
        .card {
          background-color: #E4E4E4;  /* Soft off-white card background */
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          padding: 16px;
          font-family: 'Roboto', sans-serif;
          color: #333;
        }
        .title {
          font-size: 1.3em;
          font-weight: 500;
          margin-bottom: 12px;
          text-align: center;
        }
        /* Combined info row for current temp and humidity */
        .info {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
          font-size: 1.1em;
          font-weight: bold;
        }
        .info ha-icon {
          margin-right: 4px;
        }
        .controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 16px;
        }
        /* Square buttons with slightly rounded corners */
        .button {
          background-color: #3D7ACB;  /* Accent color */
          color: #fff;
          border: none;
          border-radius: 4px;
          width: 80px;
          height: 40px;
          font-size: 1.5em;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: background-color 0.2s, box-shadow 0.2s;
        }
        .button:hover {
          background-color: #336699;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .setpoint {
          font-size: 2em;
          font-weight: bold;
          min-width: 60px;
          text-align: center;
        }
      `;

      // Build the card HTML structure:
      // • The room name title
      // • A combined info row for temperature and humidity
      // • A controls row with square plus/minus buttons and a setpoint display
      wrapper.innerHTML = `
        <div class="title">${this._config.room_name}</div>
        <i class="mdi mdi-thermometer" style="font-size:24px; display:inline-block; line-height: 24px; color:black"></i>
        <div class="info">
          <ha-icon icon="mdi:thermometer"></ha-icon>
          <span id="currentTemp">--</span> °C
          <ha-icon icon="mdi:water-percent"></ha-icon>
          <span id="currentHum">--</span> %
        </div>
        <div class="controls">
          <button class="button" id="minusBtn">−</button>
          <div id="setpoint" class="setpoint">--</div>
          <button class="button" id="plusBtn">+</button>
        </div>
      `;

      // Append style and wrapper to shadow DOM
      this.shadowRoot.appendChild(style);
      this.shadowRoot.appendChild(wrapper);

      // Save references for later updates
      this._wrapper = wrapper;
      this._currentTempEl = wrapper.querySelector("#currentTemp");
      this._currentHumEl = wrapper.querySelector("#currentHum");
      this._setpointEl = wrapper.querySelector("#setpoint");
      this._minusBtn = wrapper.querySelector("#minusBtn");
      this._plusBtn = wrapper.querySelector("#plusBtn");
      this._plusBtn = wrapper.querySelector("#plusBtn");
    }
  }

  _adjustTemperature(newTemp) {
    if (!this._hass || !this._config) return;
    const climateEntity = this._config.climate_entity;

    // Call the climate.set_temperature service
    this._hass.callService("climate", "set_temperature", {
      entity_id: climateEntity,
      temperature: newTemp
    });
  }

  getCardSize() {
    // Approximate vertical size
    return 3;
  }
}

customElements.define("asv-thermostat-card", AsvThermostatCard);