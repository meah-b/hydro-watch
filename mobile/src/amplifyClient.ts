import { Amplify } from 'aws-amplify';
import 'react-native-get-random-values';
import awsconfig from './aws-exports';

let configured = false;

export function configureAmplify() {
	if (configured) return;
	Amplify.configure(awsconfig);
	configured = true;
}
