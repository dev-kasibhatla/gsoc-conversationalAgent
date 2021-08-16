# Coming up with a plan

It was important to get a perspective on everything I had to do, and plan my days. Plans very often don't pan out the way they're supposed to, and there are a lot of reasons for this. But plan always better than no plan.



## Look and feel



My project title is **Graphical user interface for affective human-robot interactions**.

So needless to say, it needed to look good. I decided to take a path that was clean, bold and intuitive. Creativity is important, but it might not always guarantee intuition. I took inspiration from popular applications that implement similar features.

It is a little hard to nail a design to the last pixel before the project even begins. Because a lot of things change as we progress, and some aspects might not look exactly the way they look in design (CSS is a little finicky that way).

But I tried to get it as close to the final thing as possible, by spending more time brainstorming. I've worked on some projects in the past, where we focused only on functionality, and as we added more features, it started becoming more and more unusable (from a design perspective).



#### Basics

For a  clean design, I tried to focus on consistency. 

- Each page has the exact same structure - navigation, title, sub-title, content, actions. 
- All related UI elements have the exact same colour, size, margin and padding. 
- Text font faces, sizes and colours for titles, subtitles, labels and content are pre-defined.
- Single primary colour. The pastel green of this app was inspired from Robocomp's logo. 
- Straightforward transitions that cue the user on state changes.

Writing good CSS will definitely take care of the basics.



#### Navigation

The application combines four independent windows. All four windows are nearly equally important. I chose to implement a **collapsible side navigation** like the one we see in VS Code.

- Since this application is meant for desktop use, most desktops have enough horizontal space to house a side navigation bar. 

- It is extensible. Adding more options is a breeze, and hardly affects other components. No wonder a lot of admin panels use it.
- Provides one click access to any section of the app.
- Bold and intuitive - It is always on the screen, in the state user chooses to keep it in. Once the user learns the 4 icons on the bar, navigation couldn't be faster.



![nav](post3.assets/nav.png)

Fig: Expanded navigation bar



![chat+tts](post3.assets/chat+tts.png)

Fig: Collapsed navigation bar



#### Chat

There are primarily two kinds of chats we observe on a regular basis:

1. Chats that look like a log. These make more sense in group chats with a nearly equal amount of particiaption from everyone.

   Example: Discord

   ![img](post3.assets/Screen-Shot-2020-06-25-at-2.45.44-PM-1024x652.png)



2. Chats that look like a conversation. These make more sense when 2 people are talking, or 2 entities are talking. Like in our case, where a robot and a human have a conversation.

   Example: Telegram

   ![Telegram](post3.assets/image-1562742442995-6474e4cf4325101c9b5656e36ca84658.png)

I chose choice 2 for the reasons explained above.

Chat also has some other features, apart from text exchange. It lets the user listen to messages out loud. For that, there is a Text-to-speech icon. When text to speech is active, the button colour changes to the app's primary colour (green) as a visual indication. A label also appears on the top saying text-to-speech is active.

The same philosphy has been followed for speech-to-text as well.



#### Preferences

There will be a preferences section in the app to configure some things. This includes some paths that are required, settings for text-to-speech and speech-to-text among others.



![preferences mockup](post3.assets/image-20210816142524492.png)



## Functionality



#### Conversation

This is the main part. The app needs to get and send conversation data to the old conversational agent. 



![communicator](post3.assets/communicator.png)

Conversational agent knows when to start and stop conversation. When the app detects that a conversation needs to be started, it sends a request to RASA server, to start a conversation. RASA server responds with a response to the sent message.



#### Chat

The chat service keeps listening for start chat event. Once the event is received, it starts using the communicator module to send and receive messages. It also acknowledges various chat settings enforced by other modules, and uses correct channels to process this data.



![chatservice](post3.assets/chatservice-9118820.png)

#### Text to speech

Accepts textual input, reads settings, and provides appropriate output.



![tts](post3.assets/tts.png)



#### Speech to text

Accepts voice input, reads settings and provides appropriate output.



![stt](../../../../Google%20Drive/t9/gsoc/wireframes/stt.png)

