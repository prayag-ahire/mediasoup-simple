import express from "express"
import http from "http"
import cors from "cors"
import {WebSocketServer} from "ws"
import webSocketConnection from "../lib/ws.js";

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

const server = http.createServer(app);
const wss = new  WebSocketServer({server,path:"/ws"});

webSocketConnection(wss);

app.get('/',(req,res)=>{
    res.send("hello hahah");
})

server.listen(port,()=>{
    console.log("server is running on 3000......")
})