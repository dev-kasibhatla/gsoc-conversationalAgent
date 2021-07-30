deployment="/home/robocomp/robocomp/components/robocomp-viriato/etcSim/deployment_GSoC_conversationalAgent.xml"
echo "Starting con agent"
python3 $(rcmanagersimple) $deployment

# up IS
# ip executive
# mission
# rcis
# con agent - wait for rasa server and action server
# human obs agent
# mission - create path 3274(mission) -> human
# human obs -> Create human, set path blocked
