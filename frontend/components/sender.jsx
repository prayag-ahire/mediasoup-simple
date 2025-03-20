import * as mediasoup from "mediasoup-client"
let device;
let socket;
let producer;
let transport;

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
    
            case 'ProducerTransportCreated':
              onProducerTransportCreated(res);
              break;
            
            case 'resumed':
              console.log(event.data);
              break;
            default:
              break;
          }
    };
    const loadDevice = async (routerRtpCapabilities) => {
      try {
        device = new mediasoup.Device();
        await device.load({
          routerRtpCapabilities: routerRtpCapabilities,
        });
        console.log("RTP capabilities:", device.rtpCapabilities);
        return true;
      } catch (err) {
        if (err.name === "UnsupportedError") {
          console.error("Browser not supported!");
        } else {
          console.error("Failed to load device:", err);
        }
        return false;
      }
    };


    const onRouterRtpCapabilities = async (res) => {
      console.log("socket id:", res.id);
      
      try {
        await loadDevice(res.data);
        console.log("Device loaded successfully");
        
        // Once the device is loaded, we can auto-start the receiving process
        // Uncomment the next line if you want to start receiving automatically
        // reciverHandler();
      } catch (error) {
        console.error("Failed to load device:", error);
      }
    };



    const publishHandler = (e)=>{
      console.log("camera is on ")
      
        const message = {
            type : 'createProducerTransport',
            forceTcp:false,
            rtpCapabilities:device.rtpCapabilities,
        }
        console.log("on click",message)
        socket.send(JSON.stringify(message));
    }


    const onProducerTransportCreated = async (event,ws) => { 
      if(event.error){
        console.error(event.error);
        return;
      }
     
      transport = device.createSendTransport(event.data);
      console.log(event.data);
    
        transport.on('connect', async ({dtlsParameters }, callback,errback) => {
          
          console.log("get dtlsParameters : ",{dtlsParameters});

          
          const message = {
            transportId:transport.id,
            type: "connectProducerTransport",
            dtlsParameters,
          };
          console.log(JSON.stringify(message));
          socket.send(JSON.stringify(message));
          
          socket.addEventListener('message',(event)=>{
            let res = JSON.parse(event.data);
            console.log(res);
            if(res.type === "producerConnected"){
              console.log("got connected");
              callback();
            }
          })

        });
    
        transport.on('produce', async ({ kind, rtpParameters }, callback,errback) => {

          const message = {
            type: 'produce',
            transportId: transport.id,
            kind,
            rtpParameters,
          };
          console.log("send IceCandidates : ",message);

          socket.send(JSON.stringify(message));

          socket.addEventListener('message',(event)=>{
            let res = JSON.parse(event.data);
            if(res.type == "produced"){
              callback(res.data.id);
            }
          });
        });
    
        transport.on('connectionstatechange', async (state) => {
          switch (state) {
            case 'connecting':
              console.log("connecting from stat change");
                document.getElementById('text_p').innerHTML = "publishing.....";
                break;
            case 'connected':
              console.log("connected from stat change");
              document.getElementById('local_stream').srcObject = stream;
              document.getElementById('text_p').innerHTML = "published";
              break;
            case 'failed':
              console.log("failed from stat change");
              transport.close();
              document.getElementById('text_p').innerHTML = "failed";
            default:
              break;
          }
        });
        let stream;
        try{
          stream = await getUserMedia(transport);
          console.log("this is stream : ",stream);
          const videoElemnt = document.getElementById('local_stream');
          videoElemnt.srcObject = stream;
          videoElemnt.muted = true;
          videoElemnt.play();
          
          
          const videoTrack = stream.getVideoTracks()[0];
          await transport.produce({ track: videoTrack });
          
        }catch(err){
          console.error(err);
          document.getElementById('text_p').innerHTML = "failed";
        }
    }



        const getUserMedia = async (transport) => {
            if (!device.canProduce('video')) {
              console.error('Cannot produce video');
              return;
            }
            let stream;
            try{
              stream =  await navigator.mediaDevices.getUserMedia({video:true,audio:true});
            }catch(err){
              console.log(err);
              throw err;
            }
            return stream;
          };

          
      return(<div>
        <div><h1>This is Sender</h1></div>
        <div>
            <video id="local_stream" autoPlay></video>
        </div>
        <div>
        </div>
        <div><p id='text_p'></p></div>
        <div>
            <button id="btn_cam" onClick={(e)=>{publishHandler(e.target)}}>Local video</button>
        </div>
      </div>)
    
}
export default Sender;