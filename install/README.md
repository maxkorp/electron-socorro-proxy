## Set up this repo
```
sudo yum install -y git
sudo mkdir -p /usr/share/nginx/electron-socorro-proxy
sudo chown `whoami` /usr/share/nginx/electron-socorro-proxy
git clone https://github.com/maxkorp/electron-socorro-proxy /usr/share/nginx/electron-socorro-proxy
cd /usr/share/nginx/electron-socorro-proxy/install
```

## Copy in conf/stage1
`sudo cp -r ./conf/stage1/* /`

## Install epel-release
`sudo yum install -y epel-release`

## Install socorro repo
`sudo yum install -y https://s3-us-west-2.amazonaws.com/org.mozilla.crash-stats.packages-public/el/7/noarch/socorro-public-repo-1-1.el7.centos.noarch.rpm`

## Install node repo
`sudo curl -sL https://rpm.nodesource.com/setup_6.x | bash -`

## Import elasticsearch gpg key
`sudo rpm --import https://packages.elastic.co/GPG-KEY-elasticsearch`

## Install the things!
`sudo yum install -y java-1.7.0-openjdk python-virtualenv elasticsearch nginx envconsul consul socorro httpd-tools nodejs`

## Copy in conf/stage2
`sudo cp -r ./conf/stage2/* /`

## Configure socorro
```
( cd /etc/socorro/socorro-config ; sudo setup-socorro.sh consul )
( cd /etc/socorro/socorro-config ; sudo setup-socorro.sh elasticsearch )
```

## Edit nginx configs, then copy them in
`sudo cp -r ./conf/stage3/* /`

## Secure Diffie Helman for nginx
`sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 4096`

## Make nginx behave sanely with selinux
`sudo setsebool -P httpd_can_network_connect 1`

## Password protect kibana
`sudo htpasswd -c /etc/nginx/htpasswd.users kibanaadmin`

## Restart nginx
`sudo systemctl restart nginx`

## Startup and enable services
```
sudo systemctl enable nginx \
                      consul \
                      elasticsearch \
                      socorro-collector \
                      socorro-processor \
                      kibana
sudo systemctl start  nginx \
                      consul \
                      elasticsearch \
                      socorro-collector \
                      socorro-processor \
                      kibana
```

## Install node modules
```
npm install -g npm pm2
`( cd .. ; npm install)`
```

## Start up the proxy
`( cd .. ; pm2 start start.sh -n electron-socorro-proxy )`

## Send a crash!
Socorro won't create the necesasry index in elasticsearch for kibana until it processes a crash.
```
curl -O https://github.com/mozilla/socorro/blob/master/testcrash/raw/7d381dc5-51e2-4887-956b-1ae9c2130109.dump
curl --local-port 8881 \
     -H 'Host: socorro.mysite.local' \
     -F 'ProductName=Test' \
     -F 'Version=1.0' \
     -F upload_file_minidump=@7d381dc5-51e2-4887-956b-1ae9c2130109.dump \
     http://localhost:8881/submit
```

## Configure kibana
Now go to your kibana path (defaulted here to http://kibana.mysite.local).
When it asks you to pick an index, pick `socorro_reports`

## Enable symbol uploads
Make sure that your ci which dumps symbols has ssh access the box, and make sure that the user has write access to the `/home/socorro/symbols` directory. The key can be added to the `socorro` user, or as their own user in a group with write permissions. Docs for symbols dumping coming up.

## Configure a user to upload symbols
Tada!

## Notes
Still needed docs: firewalld config, fail2ban config, dumping symbols
Still needed code: Script this doc out, download electron symbols automagically
