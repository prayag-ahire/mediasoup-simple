import * as mediasoup from "mediasoup-client"
let device;
let socket;
let remote_video;
let transport;
let remoteStream;
let stream;

const Sender = ()=>{

    socket = new WebSocket("ws://localhost:3000/ws");

    socket.onopen = ()=>{
      console.log("connected");
        const msg = {
            type:"getRouterRtpCapabilities",
        }
        socket.send(JSON.stringify(msg));
    }

    socket.onmessage = (event)=>{

        const res = JSON.parse(event.data);

        switch (res.type) {
            case 'routerCapabilities':
                onRouterRtpCapabilities(res);
                break;
            case 'subTransportCreated':
                onsubTransportCreated(res);
                break;

            case 'resumed':
                console.log(event.data);
                break;

            case 'subscribed':
              onSubscribe(event);
                break;

            default:
              break;
          }
    };
       const loadDevice = async (routerRtpCapabilities) => {
            try{
                device = new mediasoup.Device();
            }catch(err){
                if (err.name === "UnsupportedError") {
                    console.log("Browser not supported!");
                }
            }
            await device.load({
              routerRtpCapabilities:routerRtpCapabilities,
            });
            console.log("RTP capabilities :",device.rtpCapabilities);
        };
    
    
    const onRouterRtpCapabilities = (res) => {
        console.log("socket id :",res.id);
        
        loadDevice(res.data);
    };

    const reciverHandler = (e)=>{
      console.log("reciver is starting .... ")
      
      const msg = {
        type:"createConsumerTransport",
        forceTcp:false,
      }
      const message = JSON.stringify(msg);
      socket.send(message);
    } 

    
    const onsubTransportCreated =async (event)=>{
      if(event.error){
        console.error("on sub transport create error :",event.error);
      }
    transport = device.createRecvTransport(event.data);
    console.log("params : ",event.data);

    transport.on('connect',({dtlsParameters},callback,errback)=>{
      console.log("connected to server")
      console.log(" get dtlsParamters : ",dtlsParameters);
        const msg={
            type:"connectConsumerTransport",
            transportId:transport.id,
            dtlsParameters
        }
        console.log("message : ",msg);
        const message = JSON.stringify(msg);
        socket.send(message);
        socket.addEventListener('message',(event)=>{
            let res = JSON.parse(event.data);
            if(res.type == "subConnected"){
              console.log("consumer transport connected!!!")
              callback();
            }
        });
      }),
      transport.on('connectionstatechange',async (state)=>{
        switch(state){
          case 'connecting':
            document.getElementById('text_p').innerHTML = "subscribing...";
            break;
          case 'connected':
            remote_video = document.getElementById("remote_stream");
            remote_video.srcObject = remoteStream;
            const msg = {
              type : "resume"
            }
            socket.send(JSON.stringify(msg));
            document.getElementById('text_p').innerHTML = "subscribed";
            break;
          case 'faild':
            transport.close();
            document.getElementById('text_p').innerHTML = "failed";
            break;
          default:
            break;
        }
      });
      const stream = await consumer(transport);
    }
    const consumer = async (transport)=>{
      let {rtpCapabilities} = device;
      const msg = {
        type : "consume",
        rtpCapabilities
      }
      socket.send(JSON.stringify(msg));
    }


      const onSubscribe = async (event) => {
        const res = JSON.parse(event.data);
        const {
          producerId,
          id,
          kind,
          rtpParameters,
        } = res.data;

        let codecOption = {};
     
        const consumer = await transport.consume({
          id,
          producerId,
          kind,
          rtpParameters,
          codecOption
        });
        console.log("this is consumer :",consumer);

        if (!remoteStream) {
          remoteStream = new MediaStream();
          remote_video = document.getElementById("remote_stream");
          remote_video.srcObject = remoteStream;
          remoteStream.addTrack(consumer.track);  
      }

      };
      

      return(<div>
        <div><h1>This is Reciver</h1></div>
        <div>
            <video id="remote_stream" autoPlay></video>
        </div>
        <div>
        </div>
        <div><p id='text_p'></p></div>
        <div>
            <button id="btn_sub" onClick={(e)=>{reciverHandler(e.target)}}></button>
        </div>
      </div>)
    
}
export default Sender;