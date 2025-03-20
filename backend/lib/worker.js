import * as mediasoup from "mediasoup";
import {config} from "../src/config.js";

    
const {
    worker,
    router
} = [];

let nextMediasoupWorkerIdx = 0;

const createWorker = async () => {
    const worker = await mediasoup.createWorker({
        logLevel:config.mediasoup.workerSetting.logLevel,
        logTags: config.mediasoup.workerSetting.logTags,
        rtcMinPort:config.mediasoup.workerSetting.rtcMinPort,
        rtcMaxPort:config.mediasoup.workerSetting.rtcMaxPort,
    })

    worker.on('died',()=>{
        console.log('mediasoup worker died , exiting in 2 secands ...[pid:&d]',worker.pid);
        setTimeout(()=>{
            process.exit(1);
        },2000);
    })

    const mediaCodecs = config.mediasoup.routerOptions.mediaCodecs;
    const mediasoupRouter = await worker.createRouter({mediaCodecs});
    return mediasoupRouter;
}

export {createWorker};
