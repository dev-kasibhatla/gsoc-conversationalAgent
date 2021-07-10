const DeepSpeech = require('deepspeech');
import * as argparse from "argparse";

module.exports = {
    testMozillaDeepSpeech
}

let parser = new argparse.ArgumentParser({addHelp: true, description: 'Running DeepSpeech inference.'});
parser.addArgument(['--model'], {required: true, help: 'Path to the model (protocol buffer binary file)'});
parser.addArgument(['--scorer'], {help: 'Path to the external scorer file'});
parser.addArgument(['--audio'], {required: true, help: 'Path to the audio file to run (WAV format)'});
parser.addArgument(['--version'], {action: VersionAction, nargs: 0, help: 'Print version and exits'});
parser.addArgument(['--extended'], {action: 'storeTrue', help: 'Output string from extended metadata'});
parser.addArgument(['--stream'], {action: 'storeTrue', help: 'Use streaming code path (for tests)'});
parser.addArgument(['--hot_words'], {help: 'Hot-words and their boosts. Word:Boost pairs are comma-separated'});
let args = parser.parseArgs();

function testMozillaDeepSpeech() {
  console.log('testing deepspeech');
  let model = new DeepSpeech.Model(args['model']);
}