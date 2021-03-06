import express from "express";
import Mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: process.env.appId,
    key: process.env.key,
    secret: process.env.secretKey,
    cluster: process.env.cluster,
    useTLS: true
});

const connection_url = 'process.env.mongoURL'

Mongoose.connect(connection_url)

const db = Mongoose.connection
db.once('open',()=>{
    console.log(`DB iS Connected`);

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change',(change)=>{
        console.log(change)
        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            })
        }else{
            console.log(`Error triggering Pusher`)
        }
    })
})

app.use(express.json())
app.use(cors())



app.get('/',(req,res)=>{
    res.status(200).send("Hello World");
})

app.get('/messages/sync',(req,res)=>{
    Messages.find((err, data)=>{
        if(err){
            res.status(500).send(err)

        }
        else{
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new',(req,res)=>{
    const dbMessage = req.body

    Messages.create(dbMessage,(err,data) => {
        if (err){
            res.status(500).send(err)
        }
        else{
            res.status(201).send(data)
        }
    })
})


app.listen(port,()=>{
    console.log(`Listening on port localhost:${port}`)
})
