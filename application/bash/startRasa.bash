location="$ROBOCOMP/components/robocomp-viriato/components/conversationalAgent/chatbot"
cd $location
ls
rasa run -m models --endpoints endpoints.yml --port 5002 --credentials credentials.yml --enable-api
