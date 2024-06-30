import fetch from "node-fetch";
import { openWeatherAPIKey } from "./hiddenInfo.js";

async function getCityCoordinatesObject(city) {
    let url = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${openWeatherAPIKey}`;
    const response = await fetch(url);
    const json = await response.json();
    let coordinates = {
        cityName: json[0].local_names.ru,
        lat: json[0].lat,
        lon: json[0].lon,
    };
    return coordinates;
}

async function getCurrentWeatherObject(coordinates) {
    let url = `http://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${openWeatherAPIKey}&lang=ru&units=metric`;
    const response = await fetch(url);
    const json = await response.json();
    let currentWeather = {
        condition: currentWeatherConditionTransform(json.weather[0].main),
        temperature: json.main.temp,
        feelsLike: json.main.feels_like
    }
    return currentWeather;
}

function currentWeatherConditionTransform(weatherCondition) {
    switch (weatherCondition) {
        case 'Clear':
            return 'Ясно';
        case 'Clouds':
            return 'Облачно';
        case 'Thunderstorm':
            return 'Гроза';
        case 'Drizzle':
            return 'Изморось';
        case 'Rain':
            return 'Дождь';
        case 'Snow':
            return 'Снег';
        case 'Atmosphere':
            return 'Атмосферные явления';
        default:
            return weatherCondition;
    }
}

async function getTodayWeatherForecast(coordinates) {
    let url = `http://api.openweathermap.org/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${openWeatherAPIKey}&units=metric`;
    const response = await fetch(url);
    const json = await response.json();
    let forecastWeather = {
        condition: currentWeatherConditionTransform(json.list[0].weather[0].main),
        temperature: json.list[0].main.temp,
        feelsLike: json.list[0].main.feels_like
    }
    return forecastWeather;
}

export {getCityCoordinatesObject, getCurrentWeatherObject, getTodayWeatherForecast};

