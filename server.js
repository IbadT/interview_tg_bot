require('dotenv').config();
const { 
    Bot, 
    Keyboard, 
    GrammyError, 
    InlineKeyboard, // клавиатура, которая будет появляться под самими сообщениями 
    HttpError 
} = require('grammy');
const bot = new Bot(process.env.TELEGRAM_TOKEN);

const { getRundomQuestion, getCorrectAnswer } = require('./utils.js');



// чтобы реагировать на команды от пользователя /start ...
// добавляются слушатели событий перед методом start
bot.command('start', async (ctx) => { // принимает контекст с большим количеством информации
    // отправка сообщений - это асинхронная операция


    // для добавления кнопок
    const startKeyboard = new Keyboard()
        .text("HTML").text("CSS")
        .row() // для того, чтобы сделать перенос
        .text("JavaScript").text("React")
        .row()
        .text('Случайный вопрос')
        .resized() // для того, чтобы кнопки на клавиатуре были нормального размера на всех устройствах


    // для того, чтобы ответить на комманду start и отправить пользователю сообщение в ответ используется метод reply
    await ctx.reply('Привет!') // принимает строку с сообщением

    // для того, чтобы отправить пользователю клавиатуру, для выбора поля
    // метод reply принимает объект с разными полями
    await ctx.reply("С чего начнем?", {
        reply_markup: startKeyboard
    })

});

// для того, чтобы добавить реагирование на сообщение
// bot.hears("HTML", async() => {
//     await ctx.reply("Что такое html?");
// });





// для того, чтобы один слушатель реагировал на несколько разных сообщений мы можем передать не строку, а массив со строками
bot.hears(['HTML', 'CSS', 'JavaScript', 'React', 'Случайный вопрос'], async (ctx) => {

    // для отправки рандомного вопроса
    const topic = ctx.message.text.toLowerCase();
    const { question, questionTopic } = getRundomQuestion(topic); // получаем 1 из вопросов

    let inlineKeyboard;
    
    
    if(question.hasOptions) { // если у нашего вопроса есть варинты ответа
        
        // создадим ряды кнопок
        const buttonRows = question.options.map(option => {
            // на каждый из этих вариантов будем возвращать массив с вызовом InlineKeyboard
            return [InlineKeyboard.text(option.text, JSON.stringify({
                type: `${questionTopic} - option`,
                isCorrect: option.isCorrect,
                question_id: question.id
            }))]
        })
        // теперь из buttonRows мы сделаем клавиатуру
        // from - метод для создания клавиатуры из готовых рядов кнопок
        inlineKeyboard = InlineKeyboard.from(buttonRows);

    } else {
        
        // теперь в метод text мы будет передавать 2 аргумента (lable кнопки, payload data - данные, которые мы хотим, чтобы эта кнопка имела)
        inlineKeyboard = new InlineKeyboard()
            // .text('Получить ответ', 'get answer')
            // .text('Отменить', 'cancel');
        
            // для того, чтобы не передавать строки, а объекты и переводим из в строку
            .text('Узнать ответ ответ', JSON.stringify({
                // type: ctx.message.text,
                type: questionTopic,
                question_id: question.id
            }))
            // .text('Отменить', 'cancel');
        
    }
    

    // await ctx.reply(`Что такое ${ctx.message.text}`, {
    await ctx.reply(question.text, {
        reply_markup: inlineKeyboard
    });
});







// чтобы обрабатывать нажания на кнопки из inlineKeyboard нам нужно добавить еще один слушатель, который будет реагировать на сallback query
bot.on('callback_query:data', async (ctx) => {
    // // при нажатии будем получать доступ к данным этого callback
    // if( ctx.callbackQuery.data === 'cancel') { // паттерн раннего возврата 
    //     // await ctx.reply('Отменено'); // вместо того, чтобы отправлять этот текст напрямую, мы может его указать в метод answerCallbackQuery
    //     // для того, чтобы загрузку прекратить и ответить телеграмму, что этот запрос сallback отвечен
    //     await ctx.answerCallbackQuery('Отменено'); // для того, чтобы телеграмм перемтал ждать ответа на этот запрос
    //     return; // чтобы дальше исполнение функции не шло
    // }

    // // получим доступ к callback:data
    const callbackData = JSON.parse(ctx.callbackQuery.data);
    // await ctx.reply(`${callbackData.type} ---> state`);
    // await ctx.answerCallbackQuery(); // снова прекращаем ожидание телеграмма



    if(!callbackData.type.includes('option')) { // если в callbackData.type не включено слово option - значит вариантов ответа нет и вопрос открытый
        // и отправим ответ при нажатии на кнопку
        const answer = getCorrectAnswer(callbackData.type, callbackData.question_id);

        // передаем ответ с ключами как 
        await ctx.reply(answer, {
            // тк в некоторых вопросах есть ссылки на источники и для того, чтобы эти ссылки корректно отображались, нужно добавить эти опции
            parse_mode: 'HTML', // можем добавлять разметку HTML
            disable_web_page_preview: true // отключить превью веб страниц, чтобы не захламлять сообщения в чате
        });
        await ctx.answerCallbackQuery();
        return;
    };


    if(callbackData.isCorrect) {
        await ctx.reply("Верно!!!");
        await ctx.answerCallbackQuery();
        return;
    };


    const answer = getCorrectAnswer(callbackData.type.split('-')[0], callbackData.question_id) // разделим строку по дефису, чтобы вместо строки был массив с 2 элементами
    await ctx.reply(`Неверно, правильный ответ: ${answer}`);
    await ctx.answerCallbackQuery();
});









// все обработчики событий, слушатели и тд, должны быть добавлены до метода start
bot.catch(err => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}`);
    const e = err.error;
    if(e instanceof GrammyError) {
        console.error("Error in request: ", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown Error: ", e);
    };
})

bot.start(); // для старта бота