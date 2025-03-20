import dotenv from "dotenv";
import os from "os"

dotenv.config();
export const PORT = process.env.PORT || 5000;

export const config = {
    
    domain: 'localhost',

    http:{
        listenIP: '0.0.0.0',
        listenPort: 4443
    },

    mediasoup:{
        numWorkers: Object.keys(os.cpus()).length,
        workerSetting:{
            rtcMinPort:10000,
            rtcMaxPort:10100,
            logLevel:'debug',
            logTags:[
                'info',
                'ice',
                'dtls',
                'rtp',
                'srtp',
                'rtcp'
            ],
        },
        routerOptions:{
            mediaCodecs:[
                {
                    kind:'audio',
                    mimeType:'audio/opus',
                    clockRate: 48000,
                    channels: 2,
                },
                {
                    kind:'video',
                    mimeType:'video/VP8',
                    clockRate: 90000,
                    parameters:{
                        'x-google-start-bitrate' : 1000,
                    }
                },
            ],
        },
        // webrtctransport setting 
        webRtcTransport:{
            listenIps:[
                {
                    ip:'0.0.0.0',
                    announcedIp: '127.4.4.4'
                },    
            ],
            maxIncomeBitrate:1500000,
            initialAvailableOutgoingBitrate:1000000,
        },
    }
} 