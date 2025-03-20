import { config } from "../src/config.js"



export const createWebRtcTransport =async (mediasoupRouter)=>{
    const {
        maxIncomeBitrate,
        initialAvailableOutgoingBitrate
    }  = config.mediasoup.webRtcTransport;
    const transport  = await mediasoupRouter.createWebRtcTransport({
        listenIps:config.mediasoup.webRtcTransport.listenIps,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate,
    });

    if(maxIncomeBitrate){
        try{
            await transport.setMaxIncomingBitrate(maxIncomeBitrate);
        }catch(error){
            console.error(error);
        }
    }
    return {
        transport,
        params:{
            id:transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
        }
    }
}


export default createWebRtcTransport;