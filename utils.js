const questions = require('./questions.json');
// const { Random } = require('random-js');


// будем передавать то, что пользователь передал на клавиатуре (HTML, CSS, JavaScript, React)
const getRundomQuestion = (topic) => {
    let questionTopic = topic.toLowerCase();


    if(questionTopic === 'случайный вопрос') {
        const randIndex = Math.floor(Math.random() * Object.keys(questions).length);
        questionTopic = ['HTML', 'CSS', 'JavaScript', 'React'][randIndex].toLowerCase();
    }


    // полученную дляну рандомизации умножаем на длину массива с вопросами и округлять до целого в меньшую сторону
    // округлить в меньшую сторону, тк длина массива может быть 10, но самый крупный индекс будет 9
    const randomQuestionIndex = Math.floor(Math.random() * questions[questionTopic].length);

    // return questions[questionTopic][randomQuestionIndex];
    return {
        question:  questions[questionTopic][randomQuestionIndex],
        questionTopic,
    }




    // const random = new Random();
    // const randomQuestionIndex = random.integer(0, questions[questionTopic].length-1) // min, max
    // return questions[questionTopic][randomQuestionIndex];
};

// library  -->  random.js



const getCorrectAnswer = (topic, id) => {

    // находим вопрос из объекта всех вопросов, обращаяси к теме вопроса ( topic = HTML ) и получим массив вопросов 
    const question = questions[topic.trim()].find(question => question.id === id);

    if(!question.hasOptions) {
        return question.answer;
    }

    return question.options.find(option => option.isCorrect).text; // возвращаем не объект, а сам ответ
    
}



module.exports = { getRundomQuestion, getCorrectAnswer };