import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import { getCityCoordinatesObject } from './get_weather.js';
import { getCurrentWeatherObject } from './get_weather.js';
import { getTodayWeatherForecast } from './get_weather.js';
import { token } from './hiddenInfo.js';

const bot = new TelegramBot(token, { polling: true });

let setCity = 'Москва';
let task = null;
async function getCurrentWeatherString(city) {
    let cityCoordinates = await getCityCoordinatesObject(city);
    let weather = await getCurrentWeatherObject(cityCoordinates);
    return `Текущая погода в г. ${cityCoordinates.cityName}: ${weather.condition}, температура ${weather.temperature}, ощущается как ${weather.feelsLike}`;
}

async function getTodayWeatherString(city) {
    let cityCoordinates = await getCityCoordinatesObject(city);
    let weather = await getTodayWeatherForecast(cityCoordinates);
    return `Прогноз погоды на сегодня в г. ${cityCoordinates.cityName}: ${weather.condition}, температура ${weather.temperature}, ощущается как ${weather.feelsLike}`;
}

async function firstTimeEventHandler(msg) {
    try {
        if (msg.text === '/start') {
            await bot.sendMessage(msg.chat.id, `Бот запущен! Введи город:`);
            bot.once('text', chooseCityEventHandler);
        }
    } catch (error) {
        console.log(error);
    }
}

async function chooseCityEventHandler(msg) {
    try {
        let cityObject = await getCityCoordinatesObject(msg.text);
        setCity = cityObject.cityName;
        await bot.sendMessage(msg.chat.id, `Установлен город: ${setCity}`);
        await bot.sendMessage(msg.chat.id, `Открыть меню: /menu`);
        bot.off("text");
        bot.on("text", secondTimeEventHandler);
    } catch (error) {
        console.log(error);
    }
}

async function scheduleWeather(msg) {
    try {
        const timeRegex = /\d{2}:\d{2}/g;
        if (msg.text.match(timeRegex)) {
            let hours = parseInt(msg.text.substring(0, 2));
            let minutes = parseInt(msg.text.substring(3));
            if (hours >= 24 || minutes >= 60) {
                await bot.sendMessage(msg.chat.id, `Время введено неверно`);
                bot.on('text', secondTimeEventHandler);
            }
            task = cron.schedule(`${minutes} ${hours} * * *`, async () => {
                await bot.sendMessage(msg.chat.id, `Текущая погода: ${await getCurrentWeatherString(setCity)}`);
                await bot.sendMessage(msg.chat.id, `Прогноз на сегодня: ${await getTodayWeatherString(setCity)}`);
            }, {
                scheduled: false,
            });
            task.start();
            await bot.sendMessage(msg.chat.id, `Погода будет приходить каждый день в ${hours}:${minutes}`);
            bot.on('text', secondTimeEventHandler);
        } else {
            await bot.sendMessage(msg.chat.id, `Ты ввел какую-то шляпу!`);
            bot.on('text', secondTimeEventHandler);
        }
    } catch (error) {
        console.log(error);
    }
}

async function secondTimeEventHandler(msg) {
    try {
        if (msg.text === '/menu') {
        await bot.sendMessage(msg.chat.id, `Меню`, {
            reply_markup: {
                keyboard: [
                    ['Установить время', 'Текущая погода'],
                    ['Выключить повторение', 'Поменять город'],
                    ['Прогноз на сегодня','Закрыть меню']
            ],
            resize_keyboard: true,
            }
        });
    } else if (msg.text === 'Установить время') {
        bot.off("text");
        await bot.sendMessage(msg.chat.id, `Введи время в формате ЧЧ:ММ (например, 19:05):`);
        bot.once("text", scheduleWeather);
    } else if (msg.text === 'Текущая погода') {
        await bot.sendMessage(msg.chat.id, `${await getCurrentWeatherString(setCity)}`);
    } else if (msg.text === 'Выключить повторение') {
        if (task) {
            task.stop();
            task = null;
            await bot.sendMessage(msg.chat.id, `Повторение выключено`);
        } else {
            await bot.sendMessage(msg.chat.id, 'Время не было установлено!');
        }
    } else if (msg.text === 'Поменять город') {
        bot.off("text");
        await bot.sendMessage(msg.chat.id, `Введи новый город:`);
        bot.once("text", chooseCityEventHandler);
    } else if (msg.text === 'Прогноз на сегодня') {
        await bot.sendMessage(msg.chat.id, `${await getTodayWeatherString(setCity)}`);
    } else if (msg.text === 'Закрыть меню') {
        await bot.sendMessage(msg.chat.id, 'Меню закрыто. Открыть заново: /menu', {
            reply_markup: {
                remove_keyboard: true,
            }
        });
    } else {
        await bot.sendMessage(msg.chat.id, `Не знаю такого запроса!`);
    }
    } catch (error) {
        console.log(error);
    }
}


bot.on("text", firstTimeEventHandler);
bot.on("polling_error", err => console.log(err.data.error.message));
