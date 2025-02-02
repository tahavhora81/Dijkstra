require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Together = require('together-ai');

const app =express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

//API calls 
const client = new Together({
    apiKey: process.env['TOGETHER_API_KEY'] // The API key is not provided in .env file for security reasons
  });


//express get method for providing the landing home page for response
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','index.html'))
});

//post method for displaying the prerequisites
var data;
app.post("/submit", async (req,res)=>{
    data = req.body.topic_query;
    const chatCompletion = await client.chat.completions.create({
        messages:[
            {role: 'system', content: "You list down prerequisites of the provided topic in a non numbered list directly starting from the numbers. Prerequisites should be only topic names."},
            {role: 'user', content: data}],
            model : 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    });
    let prereq_topic_list = await chatCompletion.choices[0].message.content;
    prereq_topic_list = prereq_topic_list.split('\n');
    console.log(prereq_topic_list);
    res.render(path.join(__dirname, 'views', 'prereq.ejs'), {topic_name: data, prereq_topic_list: prereq_topic_list});
});

//post method to provide the LLM generated learning path as response
app.post("/lp", async (req, res)=>{
    const prereq_known = req.body.known_prereq;
    var prereq_str ="";
    for(var i=0; i<prereq_known.length; i++){
        prereq_str = prereq_str + prereq_known[i];
    }
    console.log(prereq_str);
    const sys_content= `For the provided topic, provide a learning path which contains the name of topics, description in short for that topic and the resources(book names, youtube channels/playlists, courses) available. Directly start from the numbered list. The learning path should be according to the mentioned prerequisites already known to user. Topics should not be in bold. Description should be in next line. Resources also should be in different lines and mention the resource type in the same line.`;
    const user_content = `Topic name: ${data}, Prerequisites known are : ${prereq_str}`;  
    const chatCompletion = await client.chat.completions.create({
        messages:[
            {role: 'system', content: sys_content},
            {role: 'user', content: user_content}],
            model : 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    });
    console.log(chatCompletion.choices[0].message.content);
    let learning_path = await chatCompletion.choices[0].message.content;
    learning_path = learning_path.split('\n'); 
    console.log(learning_path);
    res.render(path.join(__dirname, 'views', 'learning_path.ejs'), {topic_name: data,learning_path: learning_path });
});

//Post method for displaying the concept tree
app.post("/tree", async (req, res)=>{
    sys_content = `For the provided topic, create a tree like JSON structure. The tree is basically the topics and subtopics in a herarchical structure.
    The JSON tree should be like : {name: "name_of_topic" , children: [{name: "name of children 1", children: [{name: "children"}]}], {name: "secondChild"}}
    Directly start with the JSON  and if no children then do not write the children key value pair. Only provide the JSON`
    const chatCompletion = await client.chat.completions.create({
        messages:[
            {role: 'system', content: sys_content},
            {role: 'user', content: data}],
            model : 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    });
    //console.log(chatCompletion.choices[0].message.content);
    let data_json = await chatCompletion.choices[0].message.content;
    data_json = JSON.parse(data_json);
    console.log(data_json);
    res.render(path.join(__dirname, 'views', 'tree.ejs') , {topic_name: data, data_json: data_json});
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running on port 3000.");
});