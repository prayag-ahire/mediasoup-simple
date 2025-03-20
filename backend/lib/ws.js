import createWebRtcTransport from "./createWebrtcTransport.js";
import { createWorker } from "./worker.js";
import {v4} from "uuid" 

let mediasoupRouter;
let producer;
let producerTransport;
let consumerTransport;
let consumer;
const webSocketConnection = async (websocket)=>{
    try{
        mediasoupRouter = await createWorker();
    }catch(error){
        throw error;
    }
    websocket.on('connection',(ws)=>{
        ws.id = v4();
        console.log("connected");

        ws.on('message',(message)=>{
            console.log("message",JSON.parse(message));


            const event = JSON.parse(message);

            switch(event.type){
                case 'getRouterRtpCapabilities':
                    onRouterRtpCapbilities(event,ws);
                break;

                case 'createProducerTransport':
                    oncreateProducerTransport(event,ws);
                break;
                
                case 'connectProducerTransport':
                    onconnectProducerTransport(event,ws);
                break;

                case 'produce':
                    onProduce(event,ws,websocket);
                break;

                case 'createConsumerTransport':
                    oncreateconsumerTransport(event,ws);
                break;

                case 'connectConsumerTransport':
                    onconnectConsumerTransport(event,ws);
                break;

                case 'resume':
                    onResume(ws);
                    break;
                case 'consume':
                    onConsume(event,ws);
                    break;
                default:
                  break;
            }
        });
    });

    const onRouterRtpCapbilities = (event, ws)=>{
        send(ws,"routerCapabilities",mediasoupRouter.rtpCapabilities)
        console.log("get id :",ws.id);
        console.log("send routerCapabilities :",mediasoupRouter.rtpCapabilities);
    }


    const oncreateProducerTransport= async(event,ws)=>{
        try{
            console.log("producerTransport rtpCapabilites : ",event); 
            const { transport,params } = await createWebRtcTransport(mediasoupRouter);
            producerTransport = transport;
            console.log("producer transport : ",producerTransport);
            console.log("params : ",params);
            send(ws,"ProducerTransportCreated",params);

        }catch(error){
            console.error(error)
            send(ws,"error",error); 
        }
    }

    const  onconnectProducerTransport = async (event, ws) => {
        console.log("sender connected to server");
        const dtlsParameters = event.dtlsParameters;
        console.log("dtlsParameters : ",dtlsParameters);
        await producerTransport.connect({dtlsParameters});
        console.log("producer transport : ",producerTransport);
        send(ws,'producerConnected','producer connted!');
      };
    

    const send = (ws,type,msg)=>{
        const message = {
            type,
            id:ws.id,
            data:msg
        }
        const resp = JSON.stringify(message);
        ws.send(resp); 
    }

    const onResume = async(ws)=>{
        await consumer.resume();
        send(ws,"resumed","resumed"); 
    }

    const onProduce =async (event,ws,WebSocket)=>{
            const { kind,rtpParameters} = event;
            producer = await producerTransport.produce({ kind,rtpParameters});
            const res = {
                id: producer.id,
            }
            console.log("got produce!");
            console.log("id : ",res.id);
            console.log("server get IceCandidates : ",event); 
            send(ws,'produced',res);
            brodcast(WebSocket,'newProducer','new user');
        }

    const brodcast = (ws,type,msg)=>{
        const message = {
            type,
            data:msg
        }
        const res= JSON.stringify(message);
        ws.clients.forEach((client)=>{
            client.send(res);
        })
    }
    const oncreateconsumerTransport = async(event,ws)=>{
        try{
            console.log("consumerTransport rtpCapabilites : ",event);
            const {transport,params} = await createWebRtcTransport(mediasoupRouter)
            consumerTransport =  transport;
            console.log("consumer transport : ",consumerTransport);
            send(ws,"subTransportCreated",params);
            console.log("params : ",params);
        }catch(error){
            console.error(error);
        }
    }


    const onconnectConsumerTransport = async (event,ws)=>{
        console.log("reciever connected to server");
        const dtlsParameters = event.dtlsParameters;
        console.log("dtlsparametres of consumer : ",event.dtlsParameters);
        await consumerTransport.connect({ dtlsParameters})
        console.log("consumerTransport : ",consumerTransport);
        send(ws,"subConnected","consummer transport connected")
    }



    const onConsume = async(event,ws)=>{
        const res = await createConsumer(producer,event.rtpCapabilities); 
        console.log("IceCandidates : ",event.rtpCapabilities)
        send(ws,"subscribed",res);
    }

    const  createConsumer = async (producer,rtpCapabilities)=>{
        if(!mediasoupRouter.canConsume(
            {
                producerId : producer.id,
                rtpCapabilities,
            }
        )){
             console.error('can not consume');
             return;
        }
        try{
            consumer = await consumerTransport.consume({
                producerId: producer.id,
                rtpCapabilities,
                paused: false
            })
        }catch(error){
            console.error("consume failed",error);
            return;
        }
        return{
            producerId : producer.id,
            id:consumer.id,
            kind:consumer.kind,
            rtpParameters:consumer.rtpParameters,
            type:consumer.type,
            producerPaused: consumer.producerPaused
        }
    }
}

export default webSocketConnection;
