const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "havaHavai.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    const port = process.env.PORT || 3000; // Change the port here if needed
    app.listen(port, () =>
      console.log(`Server Running at http://localhost:${port}/`)
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.get("/airport", async (request, response) => {
  const { iata_code } = request.query;
  if (!iata_code) {
    return response.status(400).send("iata_code is required");
  }

  const getAirportQuery = `
    SELECT
      a.id AS airport_id, a.icao_code, a.iata_code, a.name AS airport_name, a.type, a.latitude_deg, a.longitude_deg, a.elevation_ft,
      c.id AS city_id, c.name AS city_name, c.country_id, c.is_active AS city_is_active, c.lat AS city_lat, c.long AS city_long,
      co.id AS country_id, co.name AS country_name, co.country_code_two, co.country_code_three, co.mobile_code, co.continent_id
    FROM
      Airport a
      JOIN City c ON a.city_id = c.id
      LEFT JOIN Country co ON c.country_id = co.id
    WHERE
      a.iata_code = ?;
  `;
  
  const airport = await database.get(getAirportQuery, [iata_code]);
  
  if (!airport) {
    return response.status(404).send("Airport not found");
  }

  const responseObject = {
    airport: {
      id: airport.airport_id,
      icao_code: airport.icao_code,
      iata_code: airport.iata_code,
      name: airport.airport_name,
      type: airport.type,
      latitude_deg: airport.latitude_deg,
      longitude_deg: airport.longitude_deg,
      elevation_ft: airport.elevation_ft,
      address: {
        city: {
          id: airport.city_id,
          name: airport.city_name,
          country_id: airport.country_id,
          is_active: airport.city_is_active,
          lat: airport.city_lat,
          long: airport.city_long
        },
        country: airport.country_id ? {
          id: airport.country_id,
          name: airport.country_name,
          country_code_two: airport.country_code_two,
          country_code_three: airport.country_code_three,
          mobile_code: airport.mobile_code,
          continent_id: airport.continent_id
        } : null
      }
    }
  };

  response.send(responseObject);
});

module.exports = app;
