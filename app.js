import { create } from 'ipfs-core'
import { libp2pConfig } from 'ipfs-core-config/libp2p'
import WebRTCStar from 'libp2p-webrtc-star'
import wrtc from 'wrtc'
import prompt from 'prompt'
import defu from 'defu'

prompt.message = '';
prompt.delimiter = '';

const app = async () => {

    const libp2p = defu(libp2pConfig(), {
        modules: {
            transport: [WebRTCStar],
        },
        config: {
            transport: {
                [WebRTCStar.prototype[Symbol.toStringTag]]: {
                    wrtc
                }
            }
        }
    })

    console.dir(libp2p, {
        depth: null,
    })
    
    const node = await create({
        repo: '.repo/demo-' + Date.now(),
        silent: true,

        config: {
            Addresses: {
                Swarm: [
                    '/ip4/0.0.0.0/tcp/0',
                    '/ip4/0.0.0.0/tcp/0/ws',
                    '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
                    // '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/'
                ]
            },
        },
        libp2p
    })

    const { username } = await prompt.get({
        name: 'username',
        description: 'Enter your username:',
        required: true,
    });

    await node.pubsub.subscribe('message', (msg) => {
        if (!username) {
            return;
        }

        const decoded = JSON.parse(new TextDecoder().decode(msg.data));

        if (username === decoded.from) {
            return;
        }

        console.log(`> ${decoded.from} says: ${decoded.message}`);
    })



    while (true) {
        const { message } = await prompt.get({
            name: 'message',
            description: '> ',
        });

        if (message) {
            node.pubsub.publish('message', new TextEncoder().encode(JSON.stringify({
                from: username,
                message,
            })));
        }
    }
}



app().catch(console.error)