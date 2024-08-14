/**
 * @format
 */

import {AppRegistry, Appearance} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

Appearance.setColorScheme('light')

AppRegistry.registerComponent(appName, () => App);
