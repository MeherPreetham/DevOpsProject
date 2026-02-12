const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('<h1>DevOps Pipeline Status: <span style="color: green;">Success</span></h1>');
});

app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});