#!/bin/bash
#
# Written by Sam Artuso <sam@highoctanedev.co.uk>

# Settings
CLONE_DIR='OwlServer'
REPO_URL="https://github.com/pingdynasty/$CLONE_DIR.git"

# Make sure only root can run this script
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root" 1>&2
    exit 1
fi

# Work out directory where this script is, no matter where it is called from,
# and with which method (source, bash -c, symlinks, etc.):
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    SOURCE="$(readlink "$SOURCE")"
    [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

# Work out environment
HOSTNAME=`hostname`
if [ "$HOSTNAME" = "bella" ]
then
    TARGET_ENV='staging'
    GIT_BRANCH='dev'
elif [ "$HOSTNAME" = "buenaventura" ]
then
    TARGET_ENV='production'
    GIT_BRANCH='master'
else
    echo "Unknown hostname $HOSTNAME. Cannot determine target environment."
    echo "Aborting."
    exit 1
fi
echo "This is $HOSTNAME, assuming $TARGET_ENV environment."

# Delete previous clone
rm -rf $DIR/$CLONE_DIR
echo "Cloning $CLONE_DIR repository..."
git clone --quiet $REPO_URL $DIR/$CLONE_DIR
cd $DIR/$CLONE_DIR
echo "Checking out '$GIT_BRANCH' branch..."
git checkout $GIT_BRANCH > /dev/null
git pull origin $GIT_BRANCH > /dev/null
cd - > /dev/null

# Update Wordpress
echo "Updating Wordpress files..."
rsync --quiet -avz $DIR/OwlServer/web/wordpress/wp-content $DIR/../httpdocs/
chown -R root:root $DIR/../httpdocs/wp-content
find $DIR/../httpdocs/wp-content -type f -exec chmod 644 '{}' \;
find $DIR/../httpdocs/wp-content -type d -exec chmod 755 '{}' \;

# Update Mediawiki
echo "Updating Mediawiki files..."
rsync --quiet -avz $DIR/OwlServer/web/mediawiki/skins/HoxtonOWL2014 $DIR/../httpdocs/mediawiki/skins/
chown -R root:root $DIR/../httpdocs/mediawiki/skins/HoxtonOWL2014
find $DIR/../httpdocs/mediawiki/skins/HoxtonOWL2014 -type f -exec chmod 644 '{}' \;
find $DIR/../httpdocs/mediawiki/skins/HoxtonOWL2014 -type d -exec chmod 755 '{}' \;

# Set privileges on "wp-content/uploads" directory
echo "Cleaning up..."
chown -R www-data:www-data $DIR/../httpdocs/wp-content/uploads

rm -rf $DIR/$CLONE_DIR

echo "Done."