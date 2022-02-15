import { create } from 'ipfs-core'
import prompt from 'prompt'

prompt.message = '';
prompt.delimiter = '';

const app = async () => {
    const node = await create({
        repo: '.repo/demo-' + Date.now(),
        silent: true,

        config: {
            Addresses: {
                Swarm: [
                    '/ip4/0.0.0.0/tcp/0',
                    '/ip4/0.0.0.0/tcp/0/ws',
                    '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
                    // '/dns4/star.thedisco.zone/tcp/9090/wss/p2p-webrtc-star',
                    // '/dns6/star.thedisco.zone/tcp/9090/wss/p2p-webrtc-star',
                ]
            },

            Bootstrap: [
                "/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
                "/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
                // '/dns6/ipfs.thedisco.zone/tcp/4430/wss/p2p/12D3KooWChhhfGdB9GJy1GbhghAAKCUR99oCymMEVS4eUcEy67nt',
                // '/dns4/ipfs.thedisco.zone/tcp/4430/wss/p2p/12D3KooWChhhfGdB9GJy1GbhghAAKCUR99oCymMEVS4eUcEy67nt'
            ]
        }
    })

    const { username } = await prompt.get({
        name: 'username',
        description: 'Enter your username:',
        required: true,
    });

    node.pubsub.subscribe('message', (msg) => {
        if(! username){
            return;
        }

        const decoded = JSON.parse(new TextDecoder().decode(msg.data));
     
        if (username === decoded.from) {
            return;
        }

        console.log(`\n> ${decoded.from} says: ${decoded.message}`);
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