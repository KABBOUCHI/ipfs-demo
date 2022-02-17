import { create } from 'ipfs-core'
import prompt from 'prompt'

import MulticastDNS from 'libp2p-mdns'
import Bootstrap from 'libp2p-bootstrap'
import PubsubPeerDiscovery from 'libp2p-pubsub-peer-discovery'
prompt.message = '';
prompt.delimiter = '';

const app = async () => {

    const node = await create({
        repo: '.repo/demo-' + Date.now(),
        config: {
            Addresses: {
                Swarm: [
                    '/ip4/0.0.0.0/tcp/0',
                    '/ip4/0.0.0.0/tcp/0/ws',
                ],
            },
        },

        libp2p: {
            modules: {
                peerDiscovery: [
                    MulticastDNS, 
                    Bootstrap, 
                    PubsubPeerDiscovery
                ],
            },
            config: {
                peerDiscovery: {
                    autoDial: true, // Auto connect to discovered peers (limited by ConnectionManager minConnections)
                    // The `tag` property will be searched when creating the instance of your Peer Discovery service.
                    // The associated object, will be passed to the service when it is instantiated.
                    [Bootstrap.tag]: {
                        enabled: true,
                        interval: 60e3,
                        list: [
                            '/ip4/95.179.131.73/tcp/15002/ws/p2p/QmeBFMQJUkv5wkSCWY4cgvuKZtQ5rCAZyvKpe5dARVGmwL',
                            '/ip4/95.179.131.73/tcp/8001/p2p/QmeBFMQJUkv5wkSCWY4cgvuKZtQ5rCAZyvKpe5dARVGmwL',
                        ] // provide array of multiaddrs
                    },
                    [MulticastDNS.tag]: {
                        interval: 20e3,
                        enabled: true,
                    },
                    [PubsubPeerDiscovery.tag]: {
                        interval: 1000,
                        enabled: true
                    },
                },
                relay: {
                    enabled: true,
                    autoRelay: {
                        enabled: true,
                        maxListeners: 2
                    }
                }
            }
        },
    })

    const { username } = await prompt.get({
        name: 'username',
        description: 'Enter your username:',
        required: true,
    });

    node.pubsub.subscribe('announce-circuit', console.log)

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