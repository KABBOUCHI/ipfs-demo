import { create } from 'ipfs-core'
import Libp2p from "libp2p"
import TCP from "libp2p-tcp"
import Websockets from 'libp2p-websockets'
import Mplex from "libp2p-mplex"
import { NOISE } from "libp2p-noise"
import Secio from "libp2p-secio"
import MDNS from "libp2p-mdns"
import Bootstrap from 'libp2p-bootstrap'
import Gossipsub from '@achingbrain/libp2p-gossipsub'
import WebrtcStar from 'libp2p-webrtc-star'
import KadDHT from 'libp2p-kad-dht'
import wrtc from 'wrtc'
import prompt from 'prompt'

prompt.message = '';
prompt.delimiter = '';

const libp2pBundle = (opts) => {
    // Set convenience variables to clearly showcase some of the useful things that are available
    const peerId = opts.peerId
    const bootstrapList = opts.config.Bootstrap
    const addressesList = opts.config.Addresses.Swarm;

    // Build and return our libp2p node
    // n.b. for full configuration options, see https://github.com/libp2p/js-libp2p/blob/master/doc/CONFIGURATION.md
    return Libp2p.create({
        peerId,
        addresses: {
            listen: addressesList
        },
        modules: {
            transport: [WebrtcStar, TCP, Websockets],
            streamMuxer: [Mplex],
            connEncryption: [NOISE],
            peerDiscovery: [MDNS, Bootstrap],
            pubsub: Gossipsub
        },
        config: {
            transport: {
                [WebrtcStar.prototype[Symbol.toStringTag]]: {
                    wrtc
                }
            },
            peerDiscovery: {
                autoDial: true, // Auto connect to discovered peers (limited by ConnectionManager minConnections)
                // The `tag` property will be searched when creating the instance of your Peer Discovery service.
                // The associated object, will be passed to the service when it is instantiated.
                [Bootstrap.tag]: {
                    enabled: true,
                    list: bootstrapList
                },
                [MDNS.tag]: {
                    enabled: true,
                }
            }
        }
    })
}

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
                    '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/'
                ]
            },

            Bootstrap: [
                "/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
                "/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa"
            ]
        },
        libp2p: libp2pBundle
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