import express from 'express';


const app = express();

app.get('/users', (request, response) => {
  console.log('Listagem de usuários');
  response.json({name: "alan", age: 22});
})

app.listen(3333);