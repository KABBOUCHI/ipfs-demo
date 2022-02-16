import { create } from 'ipfs-core'
import prompt from 'prompt'

prompt.message = '';
prompt.delimiter = '';

const app = async () => {

    const node = await create({
        repo: '.repo/demo-' + Date.now(),
        silent: false,
        config: {
            Addresses: {
                Swarm: [
                    '/ip4/0.0.0.0/tcp/0',
                    '/ip4/0.0.0.0/tcp/0/ws',
                ],
            },

            Bootstrap: [
                '/ip4/95.179.131.73/tcp/15002/ws/p2p/Qma3Ma763RzXvJzrcfEmqf25QED3rGyKLirVKWvg5Z6pTA',
                '/ip4/95.179.131.73/tcp/8001/p2p/Qma3Ma763RzXvJzrcfEmqf25QED3rGyKLirVKWvg5Z6pTA',
            ]
        },
        Swarm: {
            EnableAutoRelay : true,
            AutoRelay: {
                Enabled: true,
            },
        },
        Discovery: {
            MDNS: {
                Enabled: true,
            },
        }
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