import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { bootstrapHttp } from './lib/http';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<'pusher'>;
        axios: typeof axios;
    }
}

window.Pusher = Pusher;
bootstrapHttp();
window.axios = axios;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || '614b7155df91494dab2a',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1',
    forceTLS: true,
});

export default window.Echo;
