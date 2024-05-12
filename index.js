const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken")
const app = express()
const port = 3000;
const ToDo = require("../api/models/todos.js")

const moment = require("moment")

app.use(require("cors")({
    origin: "*"
}))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect("mongodb+srv://anshuman_react_native:anshuman_react_native@cluster0.aej78hl.mongodb.net/").then(() => {
    console.log("Success in connecting Mongo DB")
}).catch((error) => {
    console.log("Error in connecting mongo db.", error)
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


const User = require("./models/user")
const ToDO = require("./models/todos");
const Todo = require("../api/models/todos.js");

// creting the user
app.get('/', (req, res) => {
    res.status(200).json({
        "message": "I am running"
    }
    )
})
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = await req.body;

        ///check if email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("Email already registered");
        }

        const newUser = new User({
            name,
            email,
            password,
        });

        await newUser.save();

        res.status(202).json({ message: "User registered successfully" });
    } catch (error) {
        console.log("Error registering the user", error);
        res.status(500).json({ message: "Registration failed" });
    }
});


const generateSecretrKey = () => {
    try {
        const key = crypto.randomBytes(32).toString("hex");
        return key;
    }
    catch (error) {

    }

}
const secrectKey = generateSecretrKey();
// login the user
app.post("/login", async (req, res) => {
    try {
        console.log("inside the login api call")
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid email" })
        }

        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid password" })
        }

        const token = jwt.sign({ userId: user._id }, secrectKey);

        res.status(200).json({ token: token });

    }
    catch (error) {
        console.log("Error in creating user", error)
        res.status(500).json({ message: "Lagin Failed" })
    }
})

app.post("/todos/:userId", async (req, res) => {
    try {
        console.log("Inside todo add call")
        const userId = req.params.userId
        const { title, category } = req.body;

        const newTodo = await ToDo.create({
            title: title,
            category: category,
            dueDate: Date.now().toString()
        });
        console.log(newTodo)
        // await newTodo.save();

        const user = await User.findById(userId)
        if (!user) {
            res.status(404).json({ message: "User not found" })
        }

        user?.todos.push(newTodo._id)
        await user.save()

        res.status(200).json({ message: "Todo added successfully", todo: newTodo })

    } catch (error) {
        console.log("Error in adding user task to db = ",error  )
        res.status(400).json({ message: "Todo not added" })
    }
})

app.get("/user/:userId/todos", async (req, res) => {
    try {
        const userId = req.params.userId
        const user = await User.findById(userId).populate('todos');

        if (!user) {
            return res.status(404).json({ error: "user not found" })
        }

        res.status(200).json({ todos: user.todos })

    } catch (error) {
        console.log("Error in getting user data = ",error)
        res.status(500).json({ error: `Something went wrong = ${error}`})
    }
})


app.patch("/todos/:id/complete", async (req, res) => {
    try {

        const {id} = req.params;
        console.log("REceived ID = ",id)
        const updatedTodo = await Todo.findOneAndUpdate({_id:id}, {
            status: 'completed'
        }, { new: true })

        if (!updatedTodo) {
            return res.status(404).json({ error: "ToDo not found" })
        }
        console.log("Completed data = ",updatedTodo)
        res.status(200).json({ message: "Todo marked as completed", todo: updatedTodo })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: `Something went wrong` })
    }
})

app.get("/todos/completed/:date",async(req,res) => {
    try{
        const date = req.params.date

        const completedTodos = await Todo.find({
            status:"completed",
            createdAt:{
                $gte:new Date(`${date}T00:00:00.000Z`), //start of selected date
                $lt:new Date(`${date}T23:59:59.999Z`)   // end of selected date
            }
        }).exec()
        res.status(200).json(completedTodos)

    }catch(error){
        res.status(500).josn({error:"Something went wrong"})
    }
})

app.get("/todos/count",async (req,res)=>{
    try{
        const totalCompletedTodo = await Todo.countDocuments({
            status:'completed'
        }).exec()

        const totalPendingTodo = await Todo.countDocuments({
            status:'pending'
        }).exec()

        res.status(200).json({complete:totalCompletedTodo,pending:totalPendingTodo})

    }catch(error){
        res.status(500).josn({error:"network error"})
    }
})