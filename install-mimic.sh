#script created from https://mycroft-ai.gitbook.io/docs/mycroft-technologies/mimic-overview
echo "Install script can be found at https://mycroft-ai.gitbook.io/docs/mycroft-technologies/mimic-overview"
echo "Installing dependencies"
sudo apt install -y gcc make pkg-config automake libtool libicu-dev libpcre2-dev libasound2-dev
echo "Cloning mimic"
cd $HOME
git clone https://github.com/MycroftAI/mimic.git
cd $HOME/mimic
echo "Generating build script"
./autogen.sh
echo "Configure build script"
./configure --prefix="/usr/local"
echo "Build"
make
echo "Validating build"
make check
echo "Installing mimic"
sudo make install
echo "Installation complete"
