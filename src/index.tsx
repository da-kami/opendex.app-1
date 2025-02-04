import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import './index.scss';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<App />, document.getElementById('root'));

serviceWorker.register();
