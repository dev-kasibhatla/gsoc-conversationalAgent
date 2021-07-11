# GSoC’21: Graphical user interface for affective human-robot interactions

### Mentors:  Pedro Núñez, Rishi Gondkar
### Student: Aditya Kasibhatla

[Project Link](https://summerofcode.withgoogle.com/projects/#4930970043547648)

## Abstract
Interaction of a robot with the operator (human) is an important and daunting task. The aim of this project would be to create a clean, modern, and modular Graphical User Interface (GUI) for the conversationalAgent component of RoboComp Viriato. The desktop application will be written using the Electron framework. The app would support one or more open source free-to-use Text to Speech engines like Mimic or MaryTTS. Combining such a TTS engine with a translation engine can enable the robot to converse in any of the given languages with the user.

Leveraging various conversational skills provided by the chosen TTS engine like Mycroft’s Mimic (for example, intents, statements, prompts, confirmations, conversational context) can further help make the conversation feel more real and closer to an actual human conversation. 

## Environment

OS: Linux Lubuntu 18.04 (VM)

RAM: 3GB

NPM version: 7.19.0

Node version: v16.4.0

Electron version: 13.1.6

## Requirements

Requires the following to be installed correctly.
 - [Robocomp](https://github.com/robocomp/robocomp)
 - [AGM](https://github.com/ljmanso/AGM)
 - [Robocomp Viriato - Conversational Agent](https://github.com/robocomp/robocomp-viriato)

## Installation

Once you have the above environment set up, to install this project:

#### Clone it
`git clone https://github.com/dev-kasibhatla/gsoc-conversationalAgent.git`

#### Make app directory your working directory
`cd cd gsoc-conversationalAgent/application`

#### Install dependencies
`npm install`

#### To run in debug
`npm start`

#### To create a release distributable we use electron-forge
```
npm run make
cd out/make/x64
sudo dpkg -i *.deb
```
