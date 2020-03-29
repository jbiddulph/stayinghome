import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import MediaHandler from '../MediaHandler';
import Pusher from 'pusher-js';
import Peer from 'simple-peer';
import axios from 'axios';

const APP_KEY = '1a11d2223ae84ccafdce';

export default class App extends Component {
    constructor() {
        super();

        this.state = {
            hasMedia: false,
            otherUserID: null,
            users:[]
        };
        this.user = window.user;
        this.user.stream = null;
        this.peers = {};
        this.mediaHandler = new MediaHandler();
        this.setupPusher();
        this.callTo = this.callTo.bind(this);
        this.setupPusher = this.setupPusher.bind(this);
        this.startPeer = this.startPeer.bind(this);
    }

    componentDidMount() {
        axios.get('https://stayhomecam.test/api/users')
            .then(response=> {
                this.setState({users:response.data});
            })
    }

    componentWillMount() {
        this.mediaHandler.getPermissions()
            .then((stream) => {
                this.setState({hasMedia: true});
                this.user.stream = stream;
                try {
                    this.myVideo.srcObject = stream;
                } catch (e) {
                    this.myVideo.src = URL.createObjectURL(stream);
                }

                this.myVideo.play();
            })
    }

    setupPusher() {
        this.pusher = new Pusher(APP_KEY, {
            authEndpoint: '/pusher/auth',
            cluster: 'eu',
            auth: {
                params: this.user.id,
                headers: {
                    'X-CSRF-Token': window.csrfToken
                }
            }
        });
        this.channel = this.pusher.subscribe('presence-video-channel');
        this.channel.bind(`client-signal-${this.user.id}`, (signal) => {
            let peer = this.peers[signal.userId];

            //if peer is not already existing, we got an incoming call
            if(peer === undefined) {
                this.setState({otherUserId: signal.userId})
                peer = this.startPeer(signal.userId, false);
            }
            peer.signal(signal.data);
        });
    }

    startPeer(userId, initiator = true) {
        const peer = new Peer({
            initiator,
            stream: this.user.stream,
            trickle: false
        });
        peer.on('signal', (data) => {
            this.channel.trigger(`client-signal-${userId}`, {
                type: 'signal',
                userId: this.user.id,
                data: data
            })
        });
        peer.on('stream', (stream) => {
            try {
                this.userVideo.srcObject = stream;
            } catch (e) {
                this.userVideo.src = URL.createObjectURL(stream);
            }

            this.userVideo.play();
        });
        peer.on('close', () => {
            let peer = this.peers[userId];
            if(peer !== undefined) {
                peer.destroy()
            }
            this.peers[userId] = undefined;
        })
        return peer;
    }

    callTo(userId) {
        this.peers[userId] = this.startPeer(userId);
    }

    render() {

        return (
            <div className="app">
                <div className="row">
                    <div className="col-md-8">
                        <div className="videoContainer">
                            <video className="my-video" ref={(ref) => {this.myVideo = ref;}}></video>
                            <video className="user-video" ref={(ref) => {this.userVideo = ref;}}></video>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card">
                            <div className="card-header">
                                Users
                            </div>
                            <div className="card-body">
                                {this.state.users.map(theuser => {
                                    return this.user.id !== theuser.id ? <button className="btn btn-sm btn-dark" key={theuser.id} onClick={() => this.callTo(theuser.id)}>
                                        <i className="fas fa-video"></i> {theuser.name}</button> : null;
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


if (document.getElementById('app')) {
    ReactDOM.render(<App />, document.getElementById('app'));
}
